export function StatusPill({ value }) {
  const styles = {
    Compliant: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    Violation: "border-cyber-red/40 bg-cyber-red/10 text-cyber-red",
    Low: "border-cyber-neon/40 bg-cyber-neon/10 text-cyber-neon",
    Medium: "border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber",
    High: "border-cyber-red/40 bg-cyber-red/10 text-cyber-red",
    Sensitive: "border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue",
    "Non-Sensitive": "border-slate-500/40 bg-slate-500/10 text-slate-300",
    open: "border-cyber-red/40 bg-cyber-red/10 text-cyber-red",
    acknowledged: "border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber",
    resolved: "border-cyber-neon/40 bg-cyber-neon/10 text-cyber-neon"
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[value] || "border-cyber-line text-slate-300"}`}>
      {value}
    </span>
  );
}
