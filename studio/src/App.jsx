// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./utils/AuthProvider";
import { AuthContext } from "./utils/AuthContext";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Unlock from "./pages/Unlock";

import StudioLayout from "./components/StudioLayout";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/Accounts";
import SchemasPage from "./pages/Schemas";
import DataExplorerPage from "./pages/DataExplorer";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 1) Halaman awal ("/"): kalau sudah pernah simpan encrypted tapi belum unlock → /unlock; kalau belum ada encrypted → Home */}
        <Route
          path="/"
          element={
            <RequireUnlock>
              <Home />
            </RequireUnlock>
          }
        />

        {/* 2) /signin */}
        <Route path="/signin" element={<SignIn />} />

        {/* 3) /unlock */}
        <Route path="/unlock" element={<Unlock />} />

        {/* 4) Semua route di bawah "/dashboard/*" → render StudioLayout + Outlet */}
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <StudioLayout isLoggedIn={true} userName="Samuel" />
            </RequireAuth>
          }
        >
          {/* "/dashboard" → Dashboard.jsx */}
          <Route index element={<Dashboard />} />

          {/* "/dashboard/accounts" → AccountsPage.jsx */}
          <Route path="accounts" element={<AccountsPage />} />

          {/* "/dashboard/schemas" → SchemasPage.jsx */}
          <Route path="schemas" element={<SchemasPage />} />

          {/* "/dashboard/data-explorer" → DataExplorerPage.jsx */}
          <Route path="data-explorer" element={<DataExplorerPage />} />

          {/* "/dashboard/settings" → SettingsPage.jsx */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 5) Semua path lain → redirect ke "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// Wrapper: jika pernah registrasi (ada encrypted) tapi belum unlock → /unlock
function RequireUnlock({ children }) {
  const { isAuthenticated } = React.useContext(AuthContext);
  const hasEncrypted = !!localStorage.getItem("encryptedPrivateKey");
  if (hasEncrypted && !isAuthenticated) {
    return <Navigate to="/unlock" replace />;
  }
  return children;
}

// Wrapper: jika belum pernah registrasi → /signin; kalau sudah registrasi tapi belum unlock → /unlock
function RequireAuth({ children }) {
  const { isAuthenticated } = React.useContext(AuthContext);
  const hasEncrypted = !!localStorage.getItem("encryptedPrivateKey");
  if (!hasEncrypted) {
    return <Navigate to="/signin" replace />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/unlock" replace />;
  }
  return children;
}