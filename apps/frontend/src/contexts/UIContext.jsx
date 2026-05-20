import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { playAlertSound } from "../utils/alertSound";

const UIContext = createContext(null);

const baseSimulationLog = {
  _id: "sim-log-template",
  recordId: "REC-SIM",
  sourceType: "API Gateway",
  owner: "external-vendor",
  region: "IN",
  classification: "Sensitive",
  complianceStatus: "Violation",
  riskScore: "High",
  sensitiveEntities: ["Aadhaar Number", "Email"],
  unauthorizedAccessDetected: true,
  exposureDetected: true,
  normalizedContent: "Simulated API breach payload containing aadhaar number 1234-5678-9000 and email victim@intrusionx.io",
  remediation: {
    recommendedAction: "Mask Aadhaar before logging and quarantine downstream payload.",
    maskedContent: "Simulated API breach payload containing aadhaar number 12****00 and email v***@intrusionx.io"
  }
};

export function UIProvider({ children }) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchLevel, setSearchLevel] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: crypto.randomUUID(),
      title: "System armed",
      message: "Cyphex monitoring console is active.",
      tone: "info",
      createdAt: new Date().toISOString(),
      read: false
    }
  ]);
  const [simulationLogs, setSimulationLogs] = useState([]);

  function addNotification(entry) {
    playAlertSound(entry.tone || "info");
    setNotifications((current) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        tone: "info",
        read: false,
        ...entry
      },
      ...current
    ].slice(0, 8));
  }

  function markNotificationsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  function simulateAttack() {
    const timestamp = Date.now();
    const nextLog = {
      ...baseSimulationLog,
      _id: `sim-${timestamp}`,
      recordId: `REC-SIM-${timestamp.toString().slice(-5)}`,
      normalizedContent:
        "Simulated breach detected in outbound API payload: aadhaar 1234-5678-9000 and email victim@intrusionx.io exposed during unauthorized export."
    };

    setSimulationLogs((current) => [nextLog, ...current].slice(0, 8));
    addNotification({
      title: "New violation detected",
      message: `${nextLog.recordId} triggered high-risk breach simulation.`,
      tone: "danger"
    });
    addNotification({
      title: "Attack simulation mode",
      message: "High-risk demo data injected into the monitoring flow.",
      tone: "warning"
    });
  }

  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    setSearchLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const response = await api.get("/search", {
          params: { q: globalSearch, level: searchLevel || undefined }
        });
        setSearchResults(response.data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [globalSearch, searchLevel]);

  const value = useMemo(
    () => ({
      addNotification,
      globalSearch,
      notifications,
      markNotificationsRead,
      searchLevel,
      searchLoading,
      searchResults,
      setGlobalSearch,
      setSearchLevel,
      simulateAttack,
      simulationLogs
    }),
    [globalSearch, notifications, searchLevel, searchLoading, searchResults, simulationLogs]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  return useContext(UIContext);
}
