import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const defaultClientOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5176",
  "http://localhost:5177",
  "http://127.0.0.1:5177"
];
const configuredClientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 5055),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intrusionx",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  clientOrigins: configuredClientOrigins.length ? configuredClientOrigins : defaultClientOrigins,
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"
};
