import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { MetricCard } from "../components/MetricCard";
import { Panel } from "../components/Panel";
import { StatusPill } from "../components/StatusPill";
import { Spinner } from "../components/Spinner";
import { useUI } from "../contexts/UIContext";
import { useRealtimeFeed } from "../hooks/useRealtimeFeed";

export function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syntheticFeed, setSyntheticFeed] = useState([]);
  const { globalSearch, notifications, simulationLogs } = useUI();
  const realtimeEvents = useRealtimeFeed();

  useEffect(() => {
    async function load() {
      const response = await api.get("/dashboard/summary");
      setSummary(response.data);
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    if (!summary?.recentRecords?.length) {
      return undefined;
    }

    const interval = setInterval(() => {
      const source = summary.recentRecords[Math.floor(Math.random() * summary.recentRecords.length)];
      setSyntheticFeed((current) => [
        {
          id: `${source._id}-${Date.now()}`,
          recordId: source.recordId,
          riskScore: source.riskScore,
          message: `${source.sourceType} stream re-evaluated for ${source.owner}`
        },
        ...current
      ].slice(0, 6));
    }, 3000);

    return () => clearInterval(interval);
  }, [summary]);

  const mergedFeed = useMemo(
    () => [
      ...syntheticFeed,
      ...realtimeEvents.map((event) => ({
        id: event.id,
        type: event.type,
        payload: event.payload
      }))
    ].slice(0, 10),
    [realtimeEvents, syntheticFeed]
  );

  if (loading) {
    return <Spinner label="Loading dashboard..." />;
  }

  const { metrics, recentRecords, alerts } = summary;
  const visibleRecords = [...simulationLogs, ...recentRecords].filter((record) =>
    !globalSearch
      ? true
      : [record.recordId, record.owner, record.normalizedContent, record.sourceType]
          .join(" ")
          .toLowerCase()
          .includes(globalSearch.toLowerCase())
  );
  const visibleAlerts = alerts.filter((alert) =>
    !globalSearch ? true : `${alert.title} ${alert.message}`.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Records" value={metrics.totalRecords} accent="blue" />
        <MetricCard title="Compliant" value={metrics.compliantRecords} accent="neon" />
        <MetricCard title="Violations" value={metrics.violationRecords} accent="red" />
        <MetricCard title="High Risk" value={metrics.highRiskRecords} accent="red" />
        <MetricCard title="Medium Risk" value={metrics.mediumRiskRecords} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Real-Time Data Monitoring" subtitle="Latest ingested events and privacy classification state">
          <div className="space-y-3">
            {visibleRecords.map((record) => (
              <div
                key={record._id}
                className="rounded-2xl border border-cyber-line bg-slate-950/30 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyber-blue"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{record.recordId}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {record.sourceType} · {record.owner} · {record.region}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill value={record.riskScore} />
                    <StatusPill value={record.complianceStatus} />
                    <StatusPill value={record.classification} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">{record.normalizedContent}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Alerts & Notifications" subtitle="Streaming risk events from the backend">
            <div className="space-y-3">
              {visibleAlerts.map((alert) => (
                <div key={alert._id} className="rounded-2xl border border-cyber-line bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <StatusPill value={alert.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{alert.message}</p>
                </div>
              ))}
              {notifications.slice(0, 2).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-cyber-line bg-cyber-panelAlt/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-cyber-blue">{entry.title}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{entry.message}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Realtime Bus" subtitle="Socket events for live monitoring">
            <div className="max-h-72 space-y-3 overflow-auto">
              {mergedFeed.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-cyber-line bg-slate-950/40 p-3 text-sm transition duration-300 hover:border-cyber-blue"
                >
                  {"recordId" in event ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-cyber-blue">{event.recordId}</p>
                        <StatusPill value={event.riskScore} />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{event.message}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-cyber-blue">{event.type}</p>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
