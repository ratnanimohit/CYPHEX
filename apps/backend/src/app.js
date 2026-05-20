import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/authRoutes.js";
import { ingestionRouter } from "./routes/ingestionRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { logRouter } from "./routes/logRoutes.js";
import { reportRouter } from "./routes/reportRoutes.js";
import { alertRouter } from "./routes/alertRoutes.js";
import { feedbackRouter } from "./routes/feedbackRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

export function createApp() {
  const app = express();

  const allowedOrigins = new Set(env.clientOrigins);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", searchRoutes);
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/logs", requireAuth, logRouter);
  app.use("/api/ingestion", requireAuth, ingestionRouter);
  app.use("/api/reports", requireAuth, reportRouter);
  app.use("/api/alerts", requireAuth, alertRouter);
  app.use("/api/feedback", requireAuth, feedbackRouter);
  app.use("/api/admin", requireAuth, adminRouter);

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: error.message || "Internal server error" });
  });

  return app;
}
