import { useState } from "react";

export default function Workflow() {
  const steps = [
    "Upload File",
    "Scan Data",
    "Detect Threats",
    "Generate Report"
  ];
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="workflow">
      <h1>WORKFLOW</h1>

      <div className="steps">
        {steps.map((step, i) => (
          <div key={i} className="step">
            <div
              className={`box ${i === activeStep ? "active" : ""}`}
              onClick={() => setActiveStep(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setActiveStep(i);
                }
              }}
            >
              {step}
            </div>
            {i !== steps.length - 1 && <div className="arrow">↓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
