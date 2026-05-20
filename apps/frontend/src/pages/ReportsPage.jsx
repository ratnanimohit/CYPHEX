import { useEffect, useState } from "react";
import { Panel } from "../components/Panel";
import { Spinner } from "../components/Spinner";
import { useUI } from "../contexts/UIContext";
import api from "../services/api";

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [creating, setCreating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [activeReportId, setActiveReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const { addNotification, globalSearch } = useUI();

  async function loadReports() {
    const response = await api.get("/reports");
    setReports(response.data);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  async function generateReport() {
    setCreating(true);
    const response = await api.post("/reports");
    setReports((current) => [response.data, ...current]);
    setLoading(false);
    setCreating(false);
    setToast("Report generated successfully");
    addNotification({
      title: "Report generated",
      message: "Compliance report export is ready for review."
    });
  }

  async function openPdf(reportId) {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    const response = await api.get(`/reports/${reportId}/pdf`, { responseType: "blob" });
    const nextPdfUrl = URL.createObjectURL(response.data);
    setPdfUrl(nextPdfUrl);
    setActiveReportId(reportId);
  }

  async function exportPdf(reportId, reportName) {
    const response = await api.get(`/reports/${reportId}/pdf`, { responseType: "blob" });
    const fileUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${reportName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);
    setToast(`${reportName}.pdf downloaded`);
  }

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const visibleReports = reports.filter((report) =>
    !globalSearch
      ? true
      : [report.reportName, report.generatedBy, JSON.stringify(report.summary)]
          .join(" ")
          .toLowerCase()
          .includes(globalSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Panel
        title="Compliance Reports"
        subtitle="Generate and export PDF reports for audits and regulator review"
        action={
          <button
            onClick={generateReport}
            disabled={creating}
            className="rounded-2xl bg-cyber-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {creating ? "Generating..." : "Generate Report"}
          </button>
        }
      >
        {loading ? <Spinner label="Loading reports..." /> : null}
        {!loading && reports.length ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Reports", value: visibleReports.length, tone: "text-cyber-blue" },
              { label: "Violations", value: reports[0].summary.violations, tone: "text-cyber-red" },
              { label: "Medium Risk", value: reports[0].summary.mediumRisk, tone: "text-cyber-amber" },
              { label: "High Risk", value: reports[0].summary.highRisk, tone: "text-cyber-neon" }
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className={`mt-2 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      {!loading && reports.length ? (
        <Panel title="Risk Summary Chart" subtitle="Quick visual breakdown of the latest report">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Low", value: reports[0].summary.lowRisk, color: "bg-cyber-neon" },
              { label: "Medium", value: reports[0].summary.mediumRisk, color: "bg-cyber-amber" },
              { label: "High", value: reports[0].summary.highRisk, color: "bg-cyber-red" }
            ].map((item) => {
              const total = Math.max(
                1,
                reports[0].summary.lowRisk + reports[0].summary.mediumRisk + reports[0].summary.highRisk
              );
              const width = `${Math.max(10, (item.value / total) * 100)}%`;
              return (
                <div key={item.label} className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.label} Risk</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-slate-800">
                    <div className={`h-3 rounded-full ${item.color}`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}

      <Panel title="Generated Reports" subtitle="Preview, export, and inspect audit-ready evidence">
        <div className="space-y-4">
        {visibleReports.map((report) => (
          <div key={report._id} className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white">{report.reportName}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  Generated by {report.generatedBy} on {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openPdf(report._id)}
                  className="rounded-2xl bg-cyber-blue px-4 py-2 text-sm font-medium text-white"
                >
                  {activeReportId === report._id ? "Previewing" : "Preview PDF"}
                </button>
                <button
                  onClick={() => exportPdf(report._id, report.reportName)}
                  className="rounded-2xl border border-cyber-neon/40 px-4 py-2 text-sm text-cyber-neon"
                >
                  Export PDF
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-cyber-red/30 bg-cyber-red/10 px-3 py-1">
                Violations: {report.summary.violations}
              </span>
              <span className="rounded-full border border-cyber-amber/30 bg-cyber-amber/10 px-3 py-1 text-cyber-amber">
                Medium Risk: {report.summary.mediumRisk}
              </span>
              <span className="rounded-full border border-cyber-red/30 bg-cyber-red/10 px-3 py-1 text-cyber-red">
                High Risk: {report.summary.highRisk}
              </span>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-cyber-line bg-cyber-panelAlt/50 p-4 text-xs text-slate-300">
              {JSON.stringify(report.summary, null, 2)}
            </pre>
          </div>
        ))}

        {pdfUrl ? (
          <div className="rounded-3xl border border-cyber-line bg-cyber-panelAlt/60 p-4">
            <h4 className="mb-3 text-lg font-semibold text-white">PDF Preview</h4>
            <div
              style={{
                height: "80vh",
                width: "100%",
                overflow: "hidden",
                borderRadius: "10px"
              }}
            >
              <iframe
                src={pdfUrl}
                title="PDF Viewer"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>
          </div>
        ) : null}
        {toast ? (
          <div className="fixed bottom-6 right-6 rounded-2xl border border-cyber-neon/40 bg-slate-950/90 px-4 py-3 text-sm text-cyber-neon shadow-neon">
            {toast}
          </div>
        ) : null}
        </div>
      </Panel>
    </div>
  );
}
