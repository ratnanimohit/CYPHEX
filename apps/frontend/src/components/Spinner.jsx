export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-blue/30 border-t-cyber-neon" />
      <span>{label}</span>
    </div>
  );
}
