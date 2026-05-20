import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Panel } from "../components/Panel";
import { Spinner } from "../components/Spinner";
import { StatusPill } from "../components/StatusPill";
import { useUI } from "../contexts/UIContext";
import api from "../services/api";

export function LogsViewerPage() {
  const [payload, setPayload] = useState({ records: [], auditLogs: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [expanded, setExpanded] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { globalSearch, searchLevel, searchLoading, searchResults, simulationLogs } = useUI();

  useEffect(() => {
    api.get("/logs").then((response) => {
      setPayload(response.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!payload.records.length) {
      return undefined;
    }

    const interval = setInterval(() => {
      const source = payload.records[Math.floor(Math.random() * payload.records.length)];
      const nextRecord = {
        ...source,
        _id: `${source._id}-live-${Date.now()}`,
        recordId: `${source.recordId}-LIVE`,
        normalizedContent: `${source.normalizedContent} [live refresh]`
      };
      setPayload((current) => ({
        ...current,
        records: [nextRecord, ...current.records].slice(0, 50)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [payload.records.length]);

  const filteredRecords = useMemo(() => {
    return [...simulationLogs, ...payload.records].filter((record) => {
      const searchTerm = query || globalSearch;
      const matchesQuery =
        !searchTerm ||
        [record.recordId, record.normalizedContent, record.owner, record.sourceType, record.region]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === "All" || record.riskScore === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [globalSearch, payload.records, query, riskFilter, simulationLogs]);

  function buildReason(record) {
    const reasons = [];
    if (record.sensitiveEntities?.length) reasons.push(`Contains ${record.sensitiveEntities.join(" + ")}`);
    if (record.unauthorizedAccessDetected) reasons.push("Unauthorized access pattern detected");
    if (record.exposureDetected) reasons.push("Sensitive data exposed to non-allowlisted owner");
    return reasons.join(" | ") || "Flagged by active compliance rule evaluation";
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Processed Logs" subtitle="Search, filter, expand, and inspect full detection reasoning">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search record ID, owner, source, or content"
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyber-blue"
          />
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3 outline-none"
          >
            <option value="All">All Risks</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        {globalSearch ? (
          <div className="mb-4 rounded-2xl border border-cyber-line bg-slate-950/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">Backend Search Results</p>
              <p className="text-xs text-slate-400">
                Query: {globalSearch}
                {searchLevel ? ` | Level: ${searchLevel.toUpperCase()}` : ""}
              </p>
            </div>
            {searchLoading ? (
              <p className="mt-3 text-sm text-cyber-neon">Searching logs...</p>
            ) : (
              <div className="mt-3 space-y-2">
                {searchResults.length ? (
                  searchResults.map((log, index) => (
                    <div key={`${index}-${log}`} className="rounded-2xl border border-cyber-line bg-cyber-panelAlt/40 p-3 text-sm text-slate-300">
                      {log}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No backend log matches found.</p>
                )}
              </div>
            )}
          </div>
        ) : null}
        <div className="space-y-3">
          {loading ? <Spinner label="Loading processed logs..." /> : null}
          {!loading && filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cyber-line bg-slate-950/30 p-5 text-sm text-slate-400">
              No logs match the current search or filter.
            </div>
          ) : null}
          {filteredRecords.map((record) => {
            const isExpanded = Boolean(expanded[record._id]);
            return (
              <div
                key={record._id}
                className="rounded-2xl border border-cyber-line bg-slate-950/40 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyber-blue"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-white">{record.recordId}</p>
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
                <p className="mt-2 text-sm text-slate-300">
                  {isExpanded
                    ? record.normalizedContent
                    : `${record.normalizedContent.slice(0, 150)}${record.normalizedContent.length > 150 ? "..." : ""}`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setExpanded((current) => ({ ...current, [record._id]: !current[record._id] }))}
                    className="rounded-2xl border border-cyber-line px-4 py-2 text-sm text-slate-300 transition hover:border-cyber-blue hover:text-white"
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </button>
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="rounded-2xl border border-cyber-neon/40 px-4 py-2 text-sm text-cyber-neon transition hover:bg-cyber-neon/10"
                  >
                    View Analysis
                  </button>
                  <button
                    onClick={() => setSelectedRecord({ ...record, explainability: buildReason(record) })}
                    className="rounded-2xl border border-cyber-amber/40 px-4 py-2 text-sm text-cyber-amber transition hover:bg-cyber-amber/10"
                  >
                    AI Explainability
                  </button>
                </div>
                {isExpanded ? (
                  <div className="mt-4 rounded-2xl border border-cyber-line bg-cyber-panelAlt/50 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Remediation</p>
                    <p className="mt-2">{record.remediation?.recommendedAction}</p>
                    <p className="mt-2 text-xs text-slate-400">Masked: {record.remediation?.maskedContent}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Detected fields: {(record.sensitiveEntities || []).join(", ") || "No sensitive entities"}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Immutable Audit Trail" subtitle="Security actions, report generation, and feedback events">
        <div className="space-y-3">
          {payload.auditLogs.map((log) => (
            <div key={log._id} className="rounded-2xl border border-cyber-line bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-cyber-neon">{log.action}</p>
                <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-2 break-all text-xs text-slate-500">{log.immutableHash}</p>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-400">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Panel>

      {selectedRecord ? (
        <Modal
          title={selectedRecord.recordId}
          subtitle="Full detection analysis and risk rationale"
          onClose={() => setSelectedRecord(null)}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill value={selectedRecord.riskScore} />
              <StatusPill value={selectedRecord.complianceStatus} />
              <StatusPill value={selectedRecord.classification} />
            </div>
            <div className="rounded-2xl border border-cyber-line bg-slate-950/30 p-4">
              <p className="text-sm font-medium text-white">
                Why this is flagged as {selectedRecord.riskScore} risk
              </p>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                {JSON.stringify(
                  {
                    detected_entities: selectedRecord.sensitiveEntities || [],
                    risk_score: selectedRecord.riskScore === "High" ? 87 : selectedRecord.riskScore === "Medium" ? 58 : 24,
                    reason: selectedRecord.explainability || buildReason(selectedRecord),
                    recommended_action:
                      selectedRecord.remediation?.recommendedAction || "Allow with monitoring"
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl border border-cyber-line bg-cyber-panelAlt/50 p-4 text-xs text-slate-300">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
