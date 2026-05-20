import crypto from "crypto";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { analyzeLogs, sampleBackendLogs } from "./services/logAnalysisService.js";
import mime from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const env = {
  port: Number(process.env.PORT || 5055),
  jwtSecret: process.env.JWT_SECRET || "change-me"
};

function logServerStartupError(error) {
  if (error?.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use. Stop the other process or change PORT.`);
    return;
  }

  if (error?.code === "EPERM") {
    console.error(`Permission denied while binding to port ${env.port}. Check your environment or sandbox.`);
    return;
  }

  console.error("Failed to start backend server", error);
}

const store = {
  users: [],
  rules: [],
  records: [],
  alerts: [],
  reports: [],
  auditLogs: []
};

const searchLogs = sampleBackendLogs;

function sendJson(res, status, payload) {
  const data = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": data.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS"
  });
  res.end(data);
}

function sendPdf(res, filename, content) {
  const body = Buffer.from(content, "utf-8");
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=${filename}.pdf`,
    "Content-Length": body.length,
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function objectId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: "12h" }
  );
}

function verifyAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

function immutableHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function writeAuditLog({ recordId = null, action, actor, details }) {
  store.auditLogs.unshift({
    _id: objectId("audit"),
    recordId,
    action,
    actor,
    details,
    immutableHash: immutableHash({ recordId, action, actor, details, at: new Date().toISOString() }),
    createdAt: new Date().toISOString()
  });
}

function pushAlert(record) {
  store.alerts.unshift({
    _id: objectId("alert"),
    title: record.complianceStatus === "Violation" ? "Compliance violation detected" : "Elevated risk detected",
    message: `${record.recordId} flagged as ${record.riskScore} risk`,
    severity: record.riskScore.toLowerCase(),
    status: "open",
    createdAt: new Date().toISOString()
  });
}

function detectMatches(content) {
  const patterns = {
    email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    phone: /\b(?:\+91[- ]?)?[6-9]\d{9}\b/g,
    aadhaar: /\b\d{4}-\d{4}-\d{4}\b/g
  };

  const matches = [];
  for (const [piiType, pattern] of Object.entries(patterns)) {
    for (const match of content.matchAll(pattern)) {
      matches.push({
        piiType,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

function maskValue(value) {
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name[0]}${"*".repeat(Math.max(name.length - 1, 3))}@${domain}`;
  }
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function analyzeRecord(record) {
  const normalizedContent = record.content.trim().replace(/\s+/g, " ");
  const piiMatches = detectMatches(normalizedContent);
  const classification = piiMatches.length ? "Sensitive" : "Non-Sensitive";
  const unauthorizedAccessDetected =
    /failed login|privilege escalation|unauthorized|suspicious/i.test(normalizedContent) ||
    (record.tags || []).some((tag) => ["login-failure", "unauthorized", "admin"].includes(tag));
  const exposureDetected =
    classification === "Sensitive" &&
    !["security", "support", "finance", "legal"].includes(record.owner.toLowerCase());

  const ruleOutcomes = store.rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      let passed = true;
      let message = "Rule satisfied";

      if (rule.condition === "sensitive_owner_allowlist") {
        passed = !exposureDetected;
        if (!passed) message = "Sensitive data routed to an unauthorized owner";
      }
      if (rule.condition === "aadhaar_india_only") {
        passed =
          !piiMatches.some((match) => match.piiType === "aadhaar") || record.region.toUpperCase() === "IN";
        if (!passed) message = "Aadhaar data detected outside India region";
      }
      if (rule.condition === "unauthorized_access_pattern") {
        passed = !unauthorizedAccessDetected;
        if (!passed) message = "Unauthorized or suspicious access pattern detected";
      }

      return {
        ruleId: rule.ruleId,
        passed,
        severity: rule.severity,
        message
      };
    });

  const complianceStatus = ruleOutcomes.some((item) => !item.passed) ? "Violation" : "Compliant";
  const riskScore =
    complianceStatus === "Violation" || piiMatches.length >= 2
      ? "High"
      : piiMatches.length || unauthorizedAccessDetected
        ? "Medium"
        : "Low";

  let maskedContent = normalizedContent;
  for (const match of [...piiMatches].sort((a, b) => b.value.length - a.value.length)) {
    maskedContent = maskedContent.replace(match.value, maskValue(match.value));
  }

  return {
    recordId: objectId("REC"),
    normalizedContent,
    piiMatches,
    sensitiveEntities: [...new Set(piiMatches.map((item) => item.piiType))],
    classification,
    unauthorizedAccessDetected,
    exposureDetected,
    complianceStatus,
    ruleOutcomes,
    riskScore,
    remediation: {
      maskedContent,
      blocked: complianceStatus === "Violation" || unauthorizedAccessDetected,
      encryptionApplied: piiMatches.length > 0,
      recommendedAction: complianceStatus === "Violation" ? "Quarantine and review" : "Allow with monitoring"
    },
    encryptedContent: Buffer.from(normalizedContent).toString("base64")
  };
}

function analyzeBatch(records) {
  return {
    results: records.map((record) => analyzeRecord(record))
  };
}

function submitFeedbackToAi(feedback) {
  return {
    message: "Feedback stored",
    stats: { [feedback.label]: 1 }
  };
}

function syncRulesToAi() {
  return { message: "Rules synced locally" };
}

function normalizeStoredRecord(input, analysis) {
  return {
    _id: objectId("rec"),
    recordId: analysis.recordId,
    sourceType: input.sourceType,
    sourceName: input.sourceName,
    owner: input.owner,
    region: input.region,
    actorId: input.actorId,
    content: input.content,
    tags: input.tags || [],
    metadata: input.metadata || {},
    normalizedContent: analysis.normalizedContent,
    encryptedContent: analysis.encryptedContent,
    piiMatches: analysis.piiMatches,
    sensitiveEntities: analysis.sensitiveEntities,
    classification: analysis.classification,
    unauthorizedAccessDetected: analysis.unauthorizedAccessDetected,
    exposureDetected: analysis.exposureDetected,
    complianceStatus: analysis.complianceStatus,
    ruleOutcomes: analysis.ruleOutcomes,
    riskScore: analysis.riskScore,
    remediation: analysis.remediation,
    createdAt: new Date().toISOString()
  };
}

function buildSummary(records) {
  return records.reduce(
    (summary, record) => {
      summary.totalRecords += 1;
      if (record.complianceStatus === "Compliant") summary.compliant += 1;
      if (record.complianceStatus === "Violation") summary.violations += 1;
      if (record.riskScore === "Low") summary.lowRisk += 1;
      if (record.riskScore === "Medium") summary.mediumRisk += 1;
      if (record.riskScore === "High") summary.highRisk += 1;
      return summary;
    },
    { totalRecords: 0, compliant: 0, violations: 0, lowRisk: 0, mediumRisk: 0, highRisk: 0 }
  );
}

async function seedInitialData() {
  if (!store.users.length) {
    store.users.push({
      id: objectId("user"),
      name: "IntrusionX Admin",
      email: "admin@intrusionx.io",
      role: "admin",
      passwordHash: await bcrypt.hash("Admin@123", 10)
    });
  }

  if (!store.rules.length) {
    const rulesPath = path.resolve(__dirname, "../../../data/seed/sample-rules.json");
    store.rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
    syncRulesToAi();
  }

  if (!store.records.length) {
    const recordsPath = path.resolve(__dirname, "../../../data/seed/sample-records.json");
    const records = JSON.parse(fs.readFileSync(recordsPath, "utf-8"));
    const batch = analyzeBatch(records);
    store.records = records.map((record, index) => normalizeStoredRecord(record, batch.results[index]));
    for (const record of store.records) {
      if (record.complianceStatus === "Violation" || record.riskScore !== "Low") {
        pushAlert(record);
      }
      writeAuditLog({
        recordId: record.recordId,
        action: "seed.ingestion",
        actor: "system",
        details: { complianceStatus: record.complianceStatus, riskScore: record.riskScore }
      });
    }
  }
}

function unauthorized(res) {
  sendJson(res, 401, { message: "Authentication required" });
}

function forbidden(res) {
  sendJson(res, 403, { message: "Insufficient permissions" });
}

async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS"
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "GET" && pathname === "/api/search") {
    const query = url.searchParams.get("q");
    const level = url.searchParams.get("level");
    let result = searchLogs;

    if (query) {
      result = result.filter((log) => log.toLowerCase().includes(query.toLowerCase()));
    }

    if (level) {
      result = result.filter((log) => log.includes(level.toUpperCase()));
    }

    sendJson(res, 200, {
      count: result.length,
      data: result
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await parseBody(req);
    const user = store.users.find((item) => item.email === body.email);
    if (!user || !(await bcrypt.compare(body.password || "", user.passwordHash))) {
      sendJson(res, 401, { message: "Invalid credentials" });
      return;
    }
    writeAuditLog({ action: "auth.login", actor: user.email, details: { role: user.role } });
    sendJson(res, 200, {
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
    return;
  }

  const user = verifyAuth(req);

  if (pathname.startsWith("/api/") && pathname !== "/api/health" && pathname !== "/api/auth/login" && !user) {
    unauthorized(res);
    return;
  }

  if (req.method === "GET" && pathname === "/api/dashboard/summary") {
    sendJson(res, 200, {
      metrics: {
        totalRecords: store.records.length,
        compliantRecords: store.records.filter((item) => item.complianceStatus === "Compliant").length,
        violationRecords: store.records.filter((item) => item.complianceStatus === "Violation").length,
        highRiskRecords: store.records.filter((item) => item.riskScore === "High").length,
        mediumRiskRecords: store.records.filter((item) => item.riskScore === "Medium").length
      },
      recentRecords: store.records.slice(0, 8),
      alerts: store.alerts.slice(0, 20)
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/logs") {
    sendJson(res, 200, { records: store.records.slice(0, 50), auditLogs: store.auditLogs.slice(0, 100) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/logs/analyze") {
    const body = await parseBody(req);
    const logs = Array.isArray(body.logs) && body.logs.length ? body.logs : sampleBackendLogs;
    const data = analyzeLogs(logs);
    sendJson(res, 200, {
      count: data.length,
      data
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/alerts") {
    sendJson(res, 200, store.alerts.slice(0, 50));
    return;
  }

  if (req.method === "GET" && pathname === "/api/reports") {
    sendJson(res, 200, store.reports);
    return;
  }

  if (req.method === "POST" && pathname === "/api/reports") {
    const report = {
      _id: objectId("report"),
      reportName: `compliance-report-${Date.now()}`,
      generatedBy: user.email,
      summary: buildSummary(store.records),
      findings: store.records
        .filter((item) => item.complianceStatus === "Violation" || item.riskScore !== "Low")
        .map((item) => ({
          recordId: item.recordId,
          complianceStatus: item.complianceStatus,
          riskScore: item.riskScore,
          owner: item.owner,
          sourceType: item.sourceType
        })),
      createdAt: new Date().toISOString()
    };
    report.metrics = report.summary;
    store.reports.unshift(report);
    writeAuditLog({ action: "report.generate", actor: user.email, details: { reportId: report._id } });
    sendJson(res, 201, report);
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/reports/") && pathname.endsWith("/pdf")) {
    const reportId = pathname.split("/")[3];
    const report = store.reports.find((item) => item._id === reportId);
    if (!report) {
      sendJson(res, 404, { message: "Report not found" });
      return;
    }
    const fakePdf = `%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%% IntrusionX Report ${report.reportName}\n%%EOF`;
    sendPdf(res, report.reportName, fakePdf);
    return;
  }

  if (req.method === "POST" && pathname === "/api/feedback") {
    const body = await parseBody(req);
    const response = submitFeedbackToAi(body);
    writeAuditLog({ recordId: body.recordId, action: "feedback.submit", actor: user.email, details: body });
    sendJson(res, 201, response);
    return;
  }

  if (req.method === "POST" && pathname === "/api/ingestion") {
    const body = await parseBody(req);
    const analysis = analyzeRecord(body);
    const stored = normalizeStoredRecord(body, analysis);
    store.records.unshift(stored);
    if (stored.complianceStatus === "Violation" || stored.riskScore !== "Low") {
      pushAlert(stored);
    }
    writeAuditLog({ recordId: stored.recordId, action: "ingestion.single", actor: user.email, details: stored });
    sendJson(res, 201, stored);
    return;
  }

  if (req.method === "GET" && pathname === "/api/admin/rules") {
    if (user.role !== "admin") {
      forbidden(res);
      return;
    }
    sendJson(res, 200, store.rules);
    return;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/admin/rules/")) {
    if (user.role !== "admin") {
      forbidden(res);
      return;
    }
    const ruleId = pathname.split("/").pop();
    const body = await parseBody(req);
    const rule = store.rules.find((item) => item.ruleId === ruleId);
    if (!rule) {
      sendJson(res, 404, { message: "Rule not found" });
      return;
    }
    Object.assign(rule, body);
    syncRulesToAi();
    writeAuditLog({ action: "rule.update", actor: user.email, details: { ruleId, ...body } });
    sendJson(res, 200, rule);
    return;
  }

  // Serve static frontend files
  const distPath = path.resolve(__dirname, "../../../apps/frontend/dist");
  let filePath = path.join(distPath, pathname === "/" ? "index.html" : pathname);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distPath, "index.html");
  }

  const ext = path.extname(filePath);
  const mimeType = mime.lookup(ext) || "text/html";
  const fileContent = fs.readFileSync(filePath);
  res.writeHead(200, { "Content-Type": mimeType, "Content-Length": fileContent.length });
  res.end(fileContent);
}

await seedInitialData();

const server = http.createServer((req, res) => {
  handler(req, res).catch((error) => {
    console.error(error);
    sendJson(res, 500, { message: error.message || "Internal server error" });
  });
});

server.on("error", (error) => {
  logServerStartupError(error);
  process.exit(1);
});

server.listen(env.port, "127.0.0.1", () => {
  console.log(`IntrusionX backend running on http://127.0.0.1:${env.port}`);
});
