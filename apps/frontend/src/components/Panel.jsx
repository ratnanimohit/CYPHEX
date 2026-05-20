export function Panel({ title, subtitle, action, children }) {
  return (
    <section className="card rounded-3xl border border-cyber-line bg-cyber-panel/75 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
