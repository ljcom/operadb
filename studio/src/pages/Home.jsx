// src/pages/Home.jsx
import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../utils/AuthContext"; // named import

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]); // tambahkan navigate ke dependency array

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "28px", color: "#222" }}>Selamat datang di OperaDB Studio</h1>
      {isAuthenticated ? (
        <div style={{ marginTop: "16px" }}>
          <p>Anda sudah login. Klik tombol di bawah untuk logout.</p>
          <button
            onClick={logout}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#E53E3E",
              color: "#FFF",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "16px" }}>
          <p>Silakan <Link to="/signin">Sign In</Link> untuk melanjutkan.</p>
        </div>
      )}
    </div>
  );
}