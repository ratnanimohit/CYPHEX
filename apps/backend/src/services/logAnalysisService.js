export const sampleBackendLogs = [
  "2026-04-10 10:01:23 [INFO] User login attempt | email: rahul.kumar@company.com | status: success",
  "2026-04-10 10:02:11 [INFO] API request received | endpoint: /user/update-profile",
  "2026-04-10 10:02:15 [DEBUG] Processing user data | user_id: 1023 | phone: 9876543210",
  "2026-04-10 10:02:16 [WARNING] PII detected | email: rahul.kumar@company.com | phone: 9876543210",
  "2026-04-10 10:02:18 [INFO] Risk classified | level: HIGH",
  "2026-04-10 10:05:42 [INFO] Payment API triggered | endpoint: /payment/process",
  "2026-04-10 10:05:45 [WARNING] Sensitive data exposure | credit_card: 4111-1111-1111-1111",
  "2026-04-10 10:05:46 [ALERT] High-risk financial data detected",
  "2026-04-10 10:05:47 [ACTION] Masking applied to credit card data",
  "2026-04-10 10:07:10 [INFO] User login attempt | email: hacker@unknown.com | status: failed",
  "2026-04-10 10:07:15 [ALERT] Unauthorized access attempt detected | IP: 192.168.1.105 | attempts: 6",
  "2026-04-10 10:10:01 [INFO] Data ingestion started | source: logs",
  "2026-04-10 10:10:03 [DEBUG] Processing record | name: Amit Sharma | aadhaar: 1234-5678-9012",
  "2026-04-10 10:10:04 [CRITICAL] Sensitive PII exposed | aadhaar: 1234-5678-9012",
  "2026-04-10 10:10:05 [ALERT] Critical data exposure detected",
  "2026-04-10 10:10:06 [ACTION] Admin notified and access restricted",
  "2026-04-10 10:12:20 [INFO] Data masking applied | field: aadhaar",
  "2026-04-10 10:12:21 [INFO] Record secured successfully",
  "2026-04-10 10:15:33 [INFO] New user registered | email: user123@gmail.com",
  "2026-04-10 10:16:00 [DEBUG] Processing record | phone: 9000000000",
  "2026-04-10 10:16:01 [WARNING] PII detected | phone: 9000000000",
  "2026-04-10 10:16:02 [INFO] Risk score assigned | level: MEDIUM",
  "2026-04-10 10:20:10 [INFO] Admin action | blocked user: hacker@unknown.com",
  "2026-04-10 10:20:12 [INFO] User status updated | status: BLOCKED",
  "2026-04-10 10:25:45 [INFO] Data ingestion completed | total_records: 120",
  "2026-04-10 10:25:46 [INFO] Compliance report generated | violations: 8 | critical: 2"
];

const patterns = {
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  phone: /\b(?:\+91[- ]?)?[6-9]\d{9}\b/g,
  aadhaar: /\b\d{4}-\d{4}-\d{4}\b/g,
  credit_card: /\b(?:\d[ -]*?){13,19}\b/g
};

const suspiciousPatterns = [
  { label: "unauthorized_access", pattern: /unauthorized access|unauthorized|access denied/i },
  { label: "failed_login", pattern: /failed login|login failure|invalid credentials/i },
  { label: "privilege_escalation", pattern: /privilege escalation|elevated privilege/i },
  { label: "sensitive_exposure", pattern: /suspicious|breach|leaked|exposed/i }
];

function classifyRisk({ detectedData, suspiciousActivities }) {
  const hasAadhaar = detectedData.some((item) => item.type === "aadhaar");
  const hasCreditCard = detectedData.some((item) => item.type === "credit_card");
  const hasEmailOrPhone = detectedData.some((item) => ["email", "phone"].includes(item.type));
  const hasSuspicious = suspiciousActivities.length > 0;
  const distinctTypes = new Set(detectedData.map((item) => item.type));

  if ((hasAadhaar || hasCreditCard) && hasSuspicious) {
    return "Critical";
  }

  if (hasCreditCard || hasAadhaar || (hasSuspicious && distinctTypes.size >= 2)) {
    return "High";
  }

  if (hasSuspicious || hasEmailOrPhone || distinctTypes.size >= 2) {
    return "Medium";
  }

  return "Low";
}

function buildReason({ detectedData, suspiciousActivities, riskLevel }) {
  const reasons = [];

  if (detectedData.length) {
    reasons.push(`Detected ${detectedData.map((item) => item.type).join(", ")}`);
  }

  if (suspiciousActivities.length) {
    reasons.push(`Suspicious activity: ${suspiciousActivities.join(", ")}`);
  }

  if (riskLevel === "Critical") {
    reasons.push("Highly sensitive data combined with suspicious behavior");
  } else if (riskLevel === "High") {
    reasons.push("Sensitive regulated data exposure requires immediate response");
  } else if (riskLevel === "Medium") {
    reasons.push("Moderate sensitive data or suspicious pattern detected");
  } else {
    reasons.push("Low confidence threat with no regulated data exposure");
  }

  return reasons.join(" | ");
}

function buildSuggestedAction({ riskLevel, detectedData, suspiciousActivities }) {
  if (riskLevel === "Critical") {
    return ["block", "alert", "mask"];
  }

  if (riskLevel === "High") {
    return suspiciousActivities.length ? ["alert", "block", "mask"] : ["mask", "alert"];
  }

  if (riskLevel === "Medium") {
    return detectedData.length ? ["mask", "alert"] : ["alert"];
  }

  return ["allow"];
}

export function analyzeLogEntry(log) {
  const detectedData = [];

  for (const [type, pattern] of Object.entries(patterns)) {
    for (const match of log.matchAll(pattern)) {
      detectedData.push({
        type,
        value: match[0]
      });
    }
  }

  const suspiciousActivities = suspiciousPatterns
    .filter((item) => item.pattern.test(log))
    .map((item) => item.label);

  const riskLevel = classifyRisk({ detectedData, suspiciousActivities });

  return {
    log,
    detected_data: detectedData,
    risk_level: riskLevel,
    reason: buildReason({ detectedData, suspiciousActivities, riskLevel }),
    suggested_action: buildSuggestedAction({ riskLevel, detectedData, suspiciousActivities }),
    suspicious_activity: suspiciousActivities
  };
}

export function analyzeLogs(logs = sampleBackendLogs) {
  return logs.map((log) => analyzeLogEntry(log));
}
