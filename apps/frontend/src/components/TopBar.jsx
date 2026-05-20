import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";

export function TopBar() {
  const { user, logout } = useAuth();
  const {
    globalSearch,
    notifications,
    markNotificationsRead,
    searchLevel,
    searchLoading,
    setGlobalSearch,
    setSearchLevel,
    simulateAttack
  } = useUI();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  function toggleNotifications() {
    setShowNotifications((current) => {
      const next = !current;
      if (next) {
        markNotificationsRead();
      }
      return next;
    });
  }

  return (
    <header className="relative z-50 flex flex-wrap items-center justify-between gap-4 border-b border-cyber-line bg-cyber-panel/40 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyber-blue">AI Compliance Command</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Live monitoring and enforcement</h2>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        <input
          value={globalSearch}
          onChange={(event) => setGlobalSearch(event.target.value)}
          placeholder="Search logs..."
          className="min-w-[220px] flex-1 rounded-2xl border border-cyber-line bg-slate-950/50 px-4 py-2 text-sm text-slate-300 outline-none transition focus:border-cyber-blue md:max-w-sm"
        />
        <select
          value={searchLevel}
          onChange={(event) => setSearchLevel(event.target.value)}
          className="rounded-2xl border border-cyber-line bg-slate-950/50 px-4 py-2 text-sm text-slate-300 outline-none"
        >
          <option value="">All Levels</option>
          <option value="info">INFO</option>
          <option value="warning">WARNING</option>
          <option value="critical">CRITICAL</option>
        </select>
        {searchLoading ? <span className="text-sm text-cyber-neon">Searching logs...</span> : null}
        <button
          onClick={simulateAttack}
          className="rounded-2xl bg-cyber-amber px-4 py-2 text-sm font-medium text-slate-950 transition hover:brightness-110"
        >
          Simulate Attack
        </button>
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="rounded-2xl border border-cyber-line bg-slate-950/50 px-4 py-2 text-sm text-slate-300"
          >
            Bell
            {unreadCount ? (
              <span className="ml-2 inline-flex min-w-6 justify-center rounded-full bg-cyber-red px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          {showNotifications ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-80 rounded-[1.5rem] border border-cyber-line bg-cyber-panel/95 p-4 shadow-neon">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <button
                  onClick={() => {
                    markNotificationsRead();
                    setShowNotifications(false);
                  }}
                  className="rounded-xl border border-cyber-line px-3 py-1 text-xs text-slate-300"
                >
                  Close
                </button>
              </div>
              <div className="max-h-72 space-y-3 overflow-auto">
                {notifications.length ? (
                  notifications.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-cyber-line bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-cyber-blue">{item.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{item.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No notifications yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-cyber-line bg-slate-950/50 px-4 py-2 text-sm text-slate-300">
          {user?.name} · {user?.role}
        </div>
        <button
          onClick={logout}
          className="rounded-2xl border border-cyber-red/50 px-4 py-2 text-sm text-cyber-red hover:bg-cyber-red/10"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
