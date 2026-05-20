import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { logs, searchLogs } from "./logs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve built frontend static files
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

const PORT = process.env.PORT || 5055;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

const rules = [
  {
    _id: "rule-1",
    ruleId: "RULE-SENSITIVE-OWNER",
    name: "Sensitive Data Ownership Restriction",
    description: "Sensitive data must remain with approved owners only.",
    severity: "high",
    enabled: true
  },
  {
    _id: "rule-2",
    ruleId: "RULE-AADHAAR-REGION",
    name: "Aadhaar Residency Rule",
    description: "Aadhaar identifiers should only be processed in India region.",
    severity: "high",
    enabled: true
  },
  {
    _id: "rule-3",
    ruleId: "RULE-UNAUTHORIZED-ACCESS",
    name: "Unauthorized Access Pattern",
    description: "High login failure rate or privileged access outside normal context is suspicious.",
    severity: "medium",
    enabled: true
  }
];

const feedbackEntries = [];

function classifyLog(log, index) {
  const emailMatches = log.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  const phoneMatches = log.match(/\b(?:\+91[- ]?)?[6-9]\d{9}\b/g) || [];
  const aadhaarMatches = log.match(/\b\d{4}-\d{4}-\d{4}\b/g) || [];
  const creditCardMatches = log.match(/\b(?:\d[ -]*?){13,19}\b/g) || [];
  const sensitiveEntities = [
    ...(emailMatches.length ? ["Email"] : []),
    ...(phoneMatches.length ? ["Phone"] : []),
    ...(aadhaarMatches.length ? ["Aadhaar"] : []),
    ...(creditCardMatches.length ? ["Credit Card"] : [])
  ];

  const unauthorizedAccessDetected = /unauthorized|failed|blocked|restricted|alert/i.test(log);
  const hasHighlySensitive = aadhaarMatches.length > 0 || creditCardMatches.length > 0;
  const hasSensitive = sensitiveEntities.length > 0;

  let riskScore = "Low";
  if (hasHighlySensitive && unauthorizedAccessDetected) {
    riskScore = "High";
  } else if (hasHighlySensitive) {
    riskScore = "High";
  } else if (hasSensitive || unauthorizedAccessDetected) {
    riskScore = "Medium";
  }

  const complianceStatus = unauthorizedAccessDetected || hasHighlySensitive ? "Violation" : "Compliant";

  return {
    _id: `rec-${index + 1}`,
    recordId: `REC_${String(index + 1).padStart(4, "0")}`,
    sourceType: "system-log",
    owner: unauthorizedAccessDetected ? "security" : "operations",
    region: "IN",
    normalizedContent: log,
    classification: hasSensitive ? "Sensitive" : "Non-Sensitive",
    complianceStatus,
    riskScore,
    sensitiveEntities,
    unauthorizedAccessDetected,
    remediation: {
      recommendedAction:
        riskScore === "High"
          ? "Mask sensitive values, alert security, and restrict access"
          : riskScore === "Medium"
            ? "Mask detected values and alert analysts"
            : "Allow with monitoring",
      maskedContent: log
        .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[masked-email]")
        .replace(/\b(?:\+91[- ]?)?[6-9]\d{9}\b/g, "[masked-phone]")
        .replace(/\b\d{4}-\d{4}-\d{4}\b/g, "[masked-aadhaar]")
        .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[masked-card]")
    },
    createdAt: new Date(Date.now() - index * 60000).toISOString()
  };
}

function buildRecords() {
  return logs.map((log, index) => classifyLog(log, index));
}

function buildAlerts(records) {
  return records
    .filter((record) => record.riskScore !== "Low" || record.complianceStatus === "Violation")
    .slice(0, 20)
    .map((record, index) => ({
      _id: `alert-${index + 1}`,
      title: record.complianceStatus === "Violation" ? "Compliance violation detected" : "Elevated risk detected",
      message: `${record.recordId} flagged as ${record.riskScore} risk`,
      status: "open",
      createdAt: record.createdAt
    }));
}

function buildAuditLogs(records) {
  return records.slice(0, 50).map((record, index) => ({
    _id: `audit-${index + 1}`,
    action: record.unauthorizedAccessDetected ? "security.review" : "log.processed",
    immutableHash: `hash-${index + 1}-${record.recordId}`,
    details: {
      riskScore: record.riskScore,
      complianceStatus: record.complianceStatus
    },
    createdAt: record.createdAt
  }));
}

function buildSummary(records) {
  return records.reduce(
    (summary, record) => {
      summary.totalRecords += 1;
      if (record.complianceStatus === "Compliant") summary.compliantRecords += 1;
      if (record.complianceStatus === "Violation") summary.violationRecords += 1;
      if (record.riskScore === "High") summary.highRiskRecords += 1;
      if (record.riskScore === "Medium") summary.mediumRiskRecords += 1;
      if (record.riskScore === "Low") summary.lowRisk += 1;
      if (record.riskScore === "Medium") summary.mediumRisk += 1;
      if (record.riskScore === "High") summary.highRisk += 1;
      return summary;
    },
    {
      totalRecords: 0,
      compliantRecords: 0,
      violationRecords: 0,
      highRiskRecords: 0,
      mediumRiskRecords: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      violations: 0
    }
  );
}

const records = buildRecords();
const alerts = buildAlerts(records);
const auditLogs = buildAuditLogs(records);
const summary = buildSummary(records);
const recentRecords = records.slice(0, 8);
const recentAlerts = alerts.slice(0, 20);
const recentAuditLogs = auditLogs.slice(0, 100);
const violationCount = records.filter((record) => record.complianceStatus === "Violation").length;
const baseReportSummary = {
  ...summary,
  violations: violationCount
};
const reports = [
  {
    _id: "report-1",
    reportName: "compliance-report-initial",
    generatedBy: "admin@intrusionx.io",
    summary: baseReportSummary,
    createdAt: new Date().toISOString()
  }
];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (email !== "admin@intrusionx.io" || password !== "Admin@123") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = { id: "admin-1", name: "Cyphex Admin", email: "admin@intrusionx.io", role: "admin" };
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "12h" });

  return res.json({ token, user });
});

app.get("/api/dashboard/summary", (req, res) => {
  res.json({
    metrics: {
      totalRecords: summary.totalRecords,
      compliantRecords: summary.compliantRecords,
      violationRecords: summary.violationRecords,
      highRiskRecords: summary.highRiskRecords,
      mediumRiskRecords: summary.mediumRiskRecords
    },
    recentRecords,
    alerts: recentAlerts
  });
});

app.get("/api/logs", (req, res) => {
  res.json({
    records: records.slice(0, 50),
    auditLogs: recentAuditLogs
  });
});

app.get("/api/search", (req, res) => {
  const q = req.query.q || "";
  const level = req.query.level || "";
  let result = searchLogs(q);

  if (level) {
    result = result.filter((log) => log.toUpperCase().includes(level.toUpperCase()));
  }

  res.json({
    count: result.length,
    data: result
  });
});

app.get("/api/reports", (req, res) => {
  res.json(reports);
});

app.post("/api/reports", (req, res) => {
  const report = {
    _id: `report-${reports.length + 1}`,
    reportName: `compliance-report-${Date.now()}`,
    generatedBy: "admin@intrusionx.io",
    summary: baseReportSummary,
    createdAt: new Date().toISOString()
  };
  reports.unshift(report);
  res.status(201).json(report);
});

app.get("/api/reports/:id/pdf", (req, res) => {
  const pdf = `%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%% Cyphex Report ${req.params.id}\n%%EOF`;
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdf, "utf-8"));
});

app.get("/api/admin/rules", (req, res) => {
  res.json(rules);
});

app.put("/api/admin/rules/:ruleId", (req, res) => {
  const rule = rules.find((item) => item.ruleId === req.params.ruleId);
  if (!rule) {
    return res.status(404).json({ message: "Rule not found" });
  }

  Object.assign(rule, req.body);
  return res.json(rule);
});

app.post("/api/feedback", (req, res) => {
  feedbackEntries.unshift({
    _id: `feedback-${feedbackEntries.length + 1}`,
    ...req.body,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    message: "Feedback stored"
  });
});

// Catch-all: serve frontend index.html for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the old backend process and restart.`);
    return;
  }

  if (error.code === "EPERM") {
    console.error(`Permission denied while binding to port ${PORT}.`);
    return;
  }

  console.error("Failed to start backend server", error);
});
