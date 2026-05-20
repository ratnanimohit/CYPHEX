import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LogsViewerPage } from "./pages/LogsViewerPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { WorkflowPage } from "./pages/WorkflowPage";

function ProtectedRoutes() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/logs" element={<LogsViewerPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
      </Route>
    </Routes>
  );
}
