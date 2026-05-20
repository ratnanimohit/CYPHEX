import { IngestionRecord } from "../models/IngestionRecord.js";
import { getRecentAlerts } from "../services/alertService.js";

export async function getSummary(req, res) {
  const [metricRows, recentRecords, alerts] = await Promise.all([
    IngestionRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          compliantRecords: {
            $sum: { $cond: [{ $eq: ["$complianceStatus", "Compliant"] }, 1, 0] }
          },
          violationRecords: {
            $sum: { $cond: [{ $eq: ["$complianceStatus", "Violation"] }, 1, 0] }
          },
          highRiskRecords: {
            $sum: { $cond: [{ $eq: ["$riskScore", "High"] }, 1, 0] }
          },
          mediumRiskRecords: {
            $sum: { $cond: [{ $eq: ["$riskScore", "Medium"] }, 1, 0] }
          }
        }
      }
    ]),
    IngestionRecord.find().sort({ createdAt: -1 }).limit(8).lean(),
    getRecentAlerts()
  ]);

  const metrics = metricRows[0] || {
    totalRecords: 0,
    compliantRecords: 0,
    violationRecords: 0,
    highRiskRecords: 0,
    mediumRiskRecords: 0
  };

  return res.json({
    metrics: {
      totalRecords: metrics.totalRecords,
      compliantRecords: metrics.compliantRecords,
      violationRecords: metrics.violationRecords,
      highRiskRecords: metrics.highRiskRecords,
      mediumRiskRecords: metrics.mediumRiskRecords
    },
    recentRecords,
    alerts
  });
}

export async function getRiskScores(req, res) {
  const [riskCounts] = await IngestionRecord.aggregate([
    {
      $group: {
        _id: null,
        Low: { $sum: { $cond: [{ $eq: ["$riskScore", "Low"] }, 1, 0] } },
        Medium: { $sum: { $cond: [{ $eq: ["$riskScore", "Medium"] }, 1, 0] } },
        High: { $sum: { $cond: [{ $eq: ["$riskScore", "High"] }, 1, 0] } }
      }
    }
  ]);

  return res.json({
    Low: riskCounts?.Low || 0,
    Medium: riskCounts?.Medium || 0,
    High: riskCounts?.High || 0
  });
}
