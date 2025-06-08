// src/components/StudioLayout.jsx
import React, { useContext, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Layout,
  Database,
  Settings as SettingsIcon,
  User as UserIcon,
  X
} from "lucide-react";
import { AccountContext } from '../utils/AccountContext';

export default function StudioLayout({ isLoggedIn = true, userName = "User" }) {
  const location = useLocation();
  const { selectedAccount, setSelectedAccount } = useContext(AccountContext);

  const containerStyle = {
    display: "flex",
    height: "100vh",
    backgroundColor: "#F5F5F5",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const sidebarStyle = {
    width: "80px",
    backgroundColor: "#FFFFFF",
    borderRight: "1px solid #E0E0E0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "20px",
    boxSizing: "border-box",
    position: "relative",
  };
  const menuListStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
  };
  const iconButtonStyle = {
    width: "36px",
    height: "36px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transition: "color 0.2s",
  };
  const activeIconStyle = { color: "#000000" };
  const inactiveIconStyle = { color: "#555555" };
  const linkWrapper = { textDecoration: "none" };

  const footerStyle = {
    position: "absolute",
    bottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  };
  const userNameStyle = { fontSize: "12px", color: "#555555" };

  const mainContainer = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  };

  const headerStyle = {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E0E0E0",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const contentStyle = {
    padding: "24px 32px",
  };

  useEffect(() => {
    document.title = selectedAccount
      ? `Studio - ${selectedAccount}`
      : 'Studio';
  }, [selectedAccount]);

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <nav style={menuListStyle}>
          <Link to="/dashboard" style={linkWrapper}>
            <div
              style={{
                ...iconButtonStyle,
                ...(location.pathname === "/dashboard"
                  ? activeIconStyle
                  : inactiveIconStyle),
              }}
              title="Home"
            >
              <Home size={24} />
            </div>
          </Link>

          <Link to="/dashboard/accounts" style={linkWrapper}>
            <div
              style={{
                ...iconButtonStyle,
                ...(location.pathname.startsWith("/dashboard/accounts")
                  ? activeIconStyle
                  : inactiveIconStyle),
              }}
              title="Accounts"
            >
              <Users size={24} />
            </div>
          </Link>
          {selectedAccount && (
            <Link to="/dashboard/schemas" style={linkWrapper}>
              <div
                style={{
                  ...iconButtonStyle,
                  ...(location.pathname.startsWith("/dashboard/schemas")
                    ? activeIconStyle
                    : inactiveIconStyle),
                }}
                title="Schemas"
              >
                <Layout size={24} />
              </div>
            </Link>
          )}
          {selectedAccount && (
            <Link to="/dashboard/data-explorer" style={linkWrapper}>
              <div
                style={{
                  ...iconButtonStyle,
                  ...(location.pathname.startsWith("/dashboard/data-explorer")
                    ? activeIconStyle
                    : inactiveIconStyle),
                }}
                title="Data Explorer"
              >
                <Database size={24} />
              </div>
            </Link>
          )}

          <Link to="/dashboard/settings" style={linkWrapper}>
            <div
              style={{
                ...iconButtonStyle,
                ...(location.pathname.startsWith("/dashboard/settings")
                  ? activeIconStyle
                  : inactiveIconStyle),
              }}
              title="Settings"
            >
              <SettingsIcon size={24} />
            </div>
          </Link>
        </nav>

        {isLoggedIn && (
          <div style={footerStyle}>
            <div
              style={{ ...iconButtonStyle, ...inactiveIconStyle }}
              title={userName}
            >
              <UserIcon size={24} />
            </div>
            <div style={userNameStyle}>{userName}</div>
          </div>
        )}
      </aside>

      {/* Main section (header + Outlet) */}
      <div style={mainContainer}>
        <header style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1
              style={{ fontSize: "32px", fontWeight: 600, margin: 0, color: "#222" }}
            >
              {selectedAccount ? `Studio - ${selectedAccount}` : 'Studio'}
            </h1>
            {selectedAccount && (
              <X
                size={24}
                style={{ cursor: "pointer", marginLeft: "8px", color: "#E53E3E" }}
                title="Clear selected account"
                onClick={() => setSelectedAccount(null)}
              />
            )}
          </div>
        </header>
        <main style={contentStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}