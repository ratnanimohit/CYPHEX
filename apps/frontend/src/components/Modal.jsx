export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-cyber-line bg-cyber-panel p-6 shadow-[0_0_40px_rgba(57,160,255,0.14)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-cyber-line px-4 py-2 text-sm text-slate-300 transition hover:border-cyber-blue hover:text-white"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
