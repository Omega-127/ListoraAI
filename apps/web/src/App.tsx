import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import DashboardShell from "./components/dashboard/DashboardShell";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Approvals from "./pages/Approvals";
import Report from "./pages/Report";
import Score from "./pages/Score";
import Audit from "./pages/Audit";
import Alerts from "./pages/Alerts";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Users from "./pages/Users";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="report" element={<Report />} />
          <Route path="score" element={<Score />} />
          <Route path="audit" element={<Audit />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
