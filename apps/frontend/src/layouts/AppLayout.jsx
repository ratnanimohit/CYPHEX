import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";

export function AppLayout() {
  return (
    <div className="app min-h-screen">
      <Sidebar />
      <div className="main min-h-screen">
        <TopBar />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
