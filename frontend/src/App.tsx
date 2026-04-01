import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import BillingDashboard from "./pages/BillingDashboard";
import PharmacyDashboard from "./pages/PharmacyDashboard";

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const RoleRoute: React.FC<{ role: string; children: React.ReactElement }> = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            {user?.role === "ADMIN" ? (
              <AdminDashboard />
            ) : user?.role === "DOCTOR" ? (
              <DoctorDashboard />
            ) : user?.role === "BILLING" ? (
              <BillingDashboard />
            ) : user?.role === "PHARMACY" ? (
              <PharmacyDashboard />
            ) : (
              <ReceptionDashboard />
            )}
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleRoute role="ADMIN">
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/reception"
        element={
          <RoleRoute role="RECEPTION">
            <ReceptionDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <RoleRoute role="DOCTOR">
            <DoctorDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <RoleRoute role="BILLING">
            <BillingDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/pharmacy"
        element={
          <RoleRoute role="PHARMACY">
            <PharmacyDashboard />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;

