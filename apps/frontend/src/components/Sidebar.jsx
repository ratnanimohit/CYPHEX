import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Logs Viewer", to: "/logs" },
  { label: "Compliance Reports", to: "/reports" },
  { label: "Workflow", to: "/workflow" },
  { label: "Admin Panel", to: "/admin" }
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-cyber-line bg-cyber-panel/80 p-6 backdrop-blur lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-cyber-neon">Cyphex</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Cyber Privacy Grid</h1>
        <p className="mt-3 text-sm text-slate-400">
          Real-time compliance intelligence for sensitive data movement.
        </p>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl border px-4 py-3 text-sm transition ${
                isActive
                  ? "border-cyber-neon bg-cyber-panelAlt text-white shadow-neon"
                  : "border-cyber-line bg-slate-950/40 text-slate-300 hover:border-cyber-blue"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
