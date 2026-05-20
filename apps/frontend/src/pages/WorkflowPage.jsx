import { useEffect, useState } from "react";
import { Panel } from "../components/Panel";

const steps = [
  {
    title: "Upload",
    detail: "Ingest files, logs, API payloads, or cloud records into the monitoring pipeline."
  },
  {
    title: "Scan",
    detail: "Normalize content, isolate fields, and prepare records for policy-aware inspection."
  },
  {
    title: "Detect",
    detail: "Identify PII, classify data sensitivity, and score risk across compliance rules."
  },
  {
    title: "Report",
    detail: "Trigger alerts, generate audit-ready reports, and send evidence to governance teams."
  }
];

export function WorkflowPage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <Panel
      title="Cyphex Workflow"
      subtitle="A visual story of how sensitive data moves from ingestion to detection, enforcement, and reporting"
    >
      <div className="rounded-[2rem] border border-cyber-line bg-[radial-gradient(circle_at_top,rgba(57,160,255,0.14),transparent_35%),linear-gradient(180deg,rgba(3,7,18,0.94),rgba(3,7,18,1)),linear-gradient(rgba(57,160,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(57,160,255,0.04)_1px,transparent_1px)] bg-[length:auto,auto,28px_28px,28px_28px] p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-cyber-neon">Visual Pipeline</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[0.18em] text-white">UPLOAD TO REPORT</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div
                  className={`workflow-live-card w-full rounded-[1.75rem] border border-cyber-blue/30 bg-slate-950/60 p-5 text-center shadow-[0_0_22px_rgba(57,160,255,0.12)] transition duration-300 hover:-translate-y-1 hover:border-cyber-neon/40 ${index === activeStep ? "workflow-live-card-active" : ""}`}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-cyber-neon/40 bg-cyber-neon/10 text-sm font-semibold text-cyber-neon">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{step.detail}</p>
                </div>
                {index !== steps.length - 1 ? (
                  <div className="workflow-live-line mt-4 hidden md:block" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-cyber-line bg-cyber-panelAlt/50 p-5 text-center">
            <p className="text-lg font-medium text-cyber-neon">
              Cyphex monitors sensitive data in real-time, detects violations, and enforces compliance automatically.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
