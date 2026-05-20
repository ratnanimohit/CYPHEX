import { AuditLog } from "../models/AuditLog.js";
import { IngestionRecord } from "../models/IngestionRecord.js";
import { analyzeLogs, sampleBackendLogs } from "../services/logAnalysisService.js";

export async function getLogs(req, res) {
  const [records, auditLogs] = await Promise.all([
    IngestionRecord.find().sort({ createdAt: -1 }).limit(50),
    AuditLog.find().sort({ createdAt: -1 }).limit(100)
  ]);

  return res.json({ records, auditLogs });
}

export async function analyzeBackendLogs(req, res) {
  const logs = Array.isArray(req.body?.logs) && req.body.logs.length ? req.body.logs : sampleBackendLogs;
  const data = analyzeLogs(logs);

  return res.json({
    count: data.length,
    data
  });
}
