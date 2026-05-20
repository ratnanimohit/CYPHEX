import express from "express";
import { sampleBackendLogs } from "../services/logAnalysisService.js";

const router = express.Router();

router.get("/search", (req, res) => {
  const { q, level } = req.query;
  let result = sampleBackendLogs;

  if (q) {
    result = result.filter((log) => log.toLowerCase().includes(q.toLowerCase()));
  }

  if (level) {
    result = result.filter((log) => log.includes(level.toUpperCase()));
  }

  res.json({
    count: result.length,
    data: result
  });
});

export default router;
