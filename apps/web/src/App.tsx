import { Navigate, Route, Routes } from "react-router-dom";
import DashboardShell from "./components/dashboard/DashboardShell";
import Dashboard from "./pages/Dashboard";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<DashboardShell />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<DashboardPlaceholder />} />
        <Route path="approvals" element={<DashboardPlaceholder />} />
        <Route path="report" element={<DashboardPlaceholder />} />
        <Route path="score" element={<DashboardPlaceholder />} />
        <Route path="audit" element={<DashboardPlaceholder />} />
        <Route path="alerts" element={<DashboardPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
