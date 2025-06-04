// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./utils/createAuthContext";
import { AuthProvider } from "./utils/AuthProvider";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Unlock from "./pages/Unlock";

import StudioLayout from "./components/StudioLayout";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/Accounts";           // pastikan ada file Accounts.jsx
import SchemasPage from "./pages/Schemas";
import DataExplorerPage from "./pages/DataExplorer";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rute Home ("/") */}
        <Route
          path="/"
          element={
            <RequireUnlock>
              <Home />
            </RequireUnlock>
          }
        />

        {/* SignIn */}
        <Route path="/signin" element={<SignIn />} />

        {/* Unlock */}
        <Route path="/unlock" element={<Unlock />} />

        {/* Dashboard & children dibawah "/dashboard" */}
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <StudioLayout isLoggedIn={true} userName="Samuel" />
            </RequireAuth>
          }
        />

        {/* Redirect semua path yang tidak ditemukan ke "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// Wrapper untuk Home: jika ada encrypted data tapi belum unlock → redirect ke /unlock
function RequireUnlock({ children }) {
  const { isAuthenticated } = React.useContext(AuthContext);
  const hasEncrypted = !!localStorage.getItem("encryptedPrivateKey");

  if (hasEncrypted && !isAuthenticated) {
    return <Navigate to="/unlock" replace />;
  }
  return children;
}

// Wrapper untuk dashboard dan children:
//   - Jika belum pernah sign in (tidak ada encrypted) → redirect ke /signin
//   - Jika ada encrypted tapi belum unlock → redirect ke /unlock
//   - Jika sudah unlock → render StudioLayout (with nested routes)
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