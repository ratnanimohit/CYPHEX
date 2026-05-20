export function MetricCard({ title, value, accent = "neon", subtitle }) {
  const accentMap = {
    neon: "border-cyber-neon/40 text-cyber-neon",
    blue: "border-cyber-blue/40 text-cyber-blue",
    amber: "border-cyber-amber/40 text-cyber-amber",
    red: "border-cyber-red/40 text-cyber-red"
  };

  return (
    <div className="stat-card card glow rounded-3xl border border-cyber-line bg-cyber-panel/70 p-5 shadow-neon">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className={`text-4xl font-semibold ${accentMap[accent]}`}>{value}</p>
        {subtitle ? <span className="text-xs text-slate-400">{subtitle}</span> : null}
      </div>
    </div>
  );
}
