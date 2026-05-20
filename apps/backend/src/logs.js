import fs from "fs";
import os from "os";
import { execSync } from "child_process";

const fallbackLogs = [
  "2026-04-10 10:01:23 [INFO] User login attempt | email: rahul.kumar@company.com | status: success",
  "2026-04-10 10:02:16 [WARNING] PII detected | email: rahul.kumar@company.com | phone: 9876543210",
  "2026-04-10 10:05:45 [WARNING] Sensitive data exposure | credit_card: 4111-1111-1111-1111",
  "2026-04-10 10:07:15 [ALERT] Unauthorized access attempt detected | IP: 192.168.1.105",
  "2026-04-10 10:10:04 [CRITICAL] Sensitive PII exposed | aadhaar: 1234-5678-9012",
  "2026-04-10 10:16:01 [WARNING] PII detected | phone: 9000000000"
];

function tailLogFile(logFilePath, maxBytes) {
  const stats = fs.statSync(logFilePath);
  const start = Math.max(0, stats.size - maxBytes);
  const fd = fs.openSync(logFilePath, "r");

  try {
    const buffer = Buffer.alloc(stats.size - start);
    fs.readSync(fd, buffer, 0, buffer.length, start);
    return buffer.toString("utf-8");
  } finally {
    fs.closeSync(fd);
  }
}

function readMacUnifiedLogs(maxLines) {
  try {
    const output = execSync(`log show --style syslog --last 30m | tail -n ${maxLines}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: Number(process.env.LOG_COMMAND_TIMEOUT_MS || 1500),
      maxBuffer: Number(process.env.LOG_MAX_BUFFER || 1024 * 1024)
    });

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function filterUsefulLines(lines) {
  return lines.filter(
    (line) =>
      line &&
      !/ASL Sender Statistics/i.test(line) &&
      !/Configuration Notice:/i.test(line) &&
      !/saved messages/i.test(line)
  );
}

function readSystemLogs() {
  const logFilePath = process.env.LOG_FILE_PATH || "/var/log/system.log";
  const maxLines = Number(process.env.LOG_MAX_LINES || 200);
  const maxBytes = Number(process.env.LOG_MAX_BYTES || 262144);
  const logSource = process.env.LOG_SOURCE || "sample";

  try {
    if (logSource === "unified" && os.platform() === "darwin") {
      const unifiedLogs = filterUsefulLines(readMacUnifiedLogs(maxLines));
      if (unifiedLogs.length) {
        return unifiedLogs;
      }
    }

    if (logSource === "sample") {
      return fallbackLogs;
    }

    if (!fs.existsSync(logFilePath)) {
      return fallbackLogs;
    }

    const raw = tailLogFile(logFilePath, maxBytes);
    const lines = filterUsefulLines(
      raw
      .split("\n")
      .slice(-maxLines)
      .map((line) => line.trim())
      .filter(Boolean)
    );

    return lines.length ? lines : fallbackLogs;
  } catch (error) {
    console.error(`Failed to read system logs from ${logFilePath}:`, error.message);
    return fallbackLogs;
  }
}

export const logs = readSystemLogs();

const indexedLogs = logs.map((line) => ({
  raw: line,
  lower: line.toLowerCase()
}));

export function searchLogs(query = "") {
  if (!query) {
    return logs;
  }

  const normalizedQuery = query.toLowerCase();
  return indexedLogs.filter((entry) => entry.lower.includes(normalizedQuery)).map((entry) => entry.raw);
}
