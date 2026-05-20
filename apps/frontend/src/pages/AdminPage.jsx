import { useEffect, useState } from "react";
import { Panel } from "../components/Panel";
import { Spinner } from "../components/Spinner";
import { useUI } from "../contexts/UIContext";
import api from "../services/api";

export function AdminPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({
    recordId: "",
    analyst: "admin@intrusionx.io",
    label: "true_positive",
    notes: ""
  });
  const [controls, setControls] = useState({
    aiDetectionEnabled: true,
    autoRemediation: true,
    highRiskThreshold: 80,
    mediumRiskThreshold: 45
  });
  const { addNotification } = useUI();

  async function loadRules() {
    const response = await api.get("/admin/rules");
    setRules(response.data);
    setLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function toggleRule(rule) {
    await api.put(`/admin/rules/${rule.ruleId}`, {
      enabled: !rule.enabled
    });
    addNotification({
      title: "Rule updated",
      message: `${rule.name} ${rule.enabled ? "disabled" : "enabled"} by admin.`
    });
    await loadRules();
  }

  async function submitFeedback(event) {
    event.preventDefault();
    await api.post("/feedback", feedback);
    setFeedback((current) => ({ ...current, recordId: "", notes: "" }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
      <Panel title="Rule Management" subtitle="Enable, disable, and tune live policy logic">
        {loading ? <Spinner label="Loading policy rules..." /> : null}
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-white">AI Detection</h4>
                <p className="mt-1 text-sm text-slate-400">Master switch for model-assisted privacy detection.</p>
              </div>
              <button
                onClick={() =>
                  setControls((current) => ({ ...current, aiDetectionEnabled: !current.aiDetectionEnabled }))
                }
                className={`rounded-2xl px-4 py-2 text-sm ${
                  controls.aiDetectionEnabled
                    ? "bg-cyber-neon text-slate-950"
                    : "border border-cyber-red/40 bg-cyber-red/10 text-cyber-red"
                }`}
              >
                {controls.aiDetectionEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-white">Auto Remediation</h4>
                <p className="mt-1 text-sm text-slate-400">Automatically mask, block, or encrypt risky traffic.</p>
              </div>
              <button
                onClick={() => setControls((current) => ({ ...current, autoRemediation: !current.autoRemediation }))}
                className={`rounded-2xl px-4 py-2 text-sm ${
                  controls.autoRemediation
                    ? "bg-cyber-blue text-white"
                    : "border border-cyber-red/40 bg-cyber-red/10 text-cyber-red"
                }`}
              >
                {controls.autoRemediation ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5 md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm text-slate-300">Medium Risk Threshold</span>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={controls.mediumRiskThreshold}
                  onChange={(event) =>
                    setControls((current) => ({ ...current, mediumRiskThreshold: Number(event.target.value) }))
                  }
                  className="mt-3 w-full"
                />
                <p className="mt-2 text-sm text-cyber-amber">{controls.mediumRiskThreshold}%</p>
                <p className="mt-2 text-xs text-slate-400">
                  {controls.mediumRiskThreshold > 55
                    ? "Higher medium threshold reduces noise but can miss suspicious edge cases."
                    : "Balanced medium threshold catches more borderline issues."}
                </p>
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">High Risk Threshold</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={controls.highRiskThreshold}
                  onChange={(event) =>
                    setControls((current) => ({ ...current, highRiskThreshold: Number(event.target.value) }))
                  }
                  className="mt-3 w-full"
                />
                <p className="mt-2 text-sm text-cyber-red">{controls.highRiskThreshold}%</p>
                <p className="mt-2 text-xs text-slate-400">
                  {controls.highRiskThreshold > 70
                    ? "High strictness can increase false positives during peak traffic."
                    : "Lower strictness improves recall but needs analyst review."}
                </p>
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule._id} className="rounded-3xl border border-cyber-line bg-slate-950/35 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-white">{rule.name}</h4>
                  <p className="mt-1 text-sm text-slate-400">{rule.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      rule.enabled
                        ? "border-cyber-neon/40 bg-cyber-neon/10 text-cyber-neon"
                        : "border-cyber-red/40 bg-cyber-red/10 text-cyber-red"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={() => toggleRule(rule)}
                    className="rounded-2xl border border-cyber-blue/50 px-4 py-2 text-sm text-cyber-blue"
                  >
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Feedback Loop" subtitle="Send analyst feedback to improve detections">
        <form className="space-y-4" onSubmit={submitFeedback}>
          <input
            value={feedback.recordId}
            onChange={(event) => setFeedback((current) => ({ ...current, recordId: event.target.value }))}
            placeholder="Record ID"
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3"
          />
          <select
            value={feedback.label}
            onChange={(event) => setFeedback((current) => ({ ...current, label: event.target.value }))}
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3"
          >
            <option value="true_positive">True Positive</option>
            <option value="false_positive">False Positive</option>
            <option value="false_negative">False Negative</option>
          </select>
          <textarea
            rows="5"
            value={feedback.notes}
            onChange={(event) => setFeedback((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Analyst notes"
            className="w-full rounded-2xl border border-cyber-line bg-slate-950/60 px-4 py-3"
          />
          <button className="w-full rounded-2xl bg-cyber-neon px-4 py-3 font-semibold text-slate-950">
            Submit Feedback
          </button>
        </form>
      </Panel>
    </div>
  );
}
