import { Router } from "express";
import { analyzeBackendLogs, getLogs } from "../controllers/logController.js";

export const logRouter = Router();

logRouter.get("/", getLogs);
logRouter.post("/analyze", analyzeBackendLogs);
