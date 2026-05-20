import { Alert } from "../models/Alert.js";
import { broadcast } from "./socketService.js";

export async function createAlert({ title, message, severity, recordRef = null }) {
  const alert = await Alert.create({ title, message, severity, recordRef });
  broadcast("alert:new", alert);
  return alert;
}

export async function getRecentAlerts() {
  return Alert.find().sort({ createdAt: -1 }).limit(20).lean();
}
