// src/pages/Unlock.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../utils/AuthContext";


export default function Unlock() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Jika tidak ada data terenkripsi, langsung ke Sign In
  useEffect(() => {
    const raw = localStorage.getItem("encryptedPrivateKey");
    if (!raw) {
      navigate("/signin");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1) Ambil raw keystore
    let raw = localStorage.getItem("encryptedPrivateKey");
    if (!raw) {
      setError("‼️ encryptedPrivateKey tidak ditemukan. Silakan daftar ulang.");
      setLoading(false);
      return;
    }

    // 2) Sanitasi key “Crypto” → “crypto” (legacy)
    try {
      const obj = JSON.parse(raw);
      if (obj.Crypto && !obj.crypto) {
        obj.crypto = obj.Crypto;
        delete obj.Crypto;
        raw = JSON.stringify(obj);
      }
    } catch {
      // jika JSON invalid, biarkan raw apa adanya
    }

    try {

      // Optional: kalau pakai authToken dari server
      await login(password, raw); // tetap panggil login jika perlu backend

      navigate("/accounts");
    } catch (err) {
      console.error(err);
      setError("Password salah atau dekripsi gagal.");
    }

    setLoading(false);
  };

  const handleClear = () => {
    // Hapus data terenkripsi dan redirect ke Sign In
    localStorage.removeItem("encryptedPrivateKey");
    navigate("/signin");
  };

  return (
    <div style={{ padding: "40px", maxWidth: "360px", margin: "auto" }}>
      <h1 style={{ fontSize: "28px", color: "#222" }}>Unlock Account</h1>
      <p style={{ marginTop: "16px", color: "#2D3748" }}>
        Masukkan password untuk membuka kunci private key Anda.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #CBD5E0",
            fontSize: "14px",
          }}
        />
        {error && (
          <p style={{ color: "#E53E3E", marginTop: "8px" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "12px",
            padding: "8px 16px",
            backgroundColor: "#3182CE",
            color: "#FFF",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Membuka..." : "Unlock"}
        </button>
      </form>

      {/* Tombol Clear Data */}
      <button
        onClick={handleClear}
        style={{
          marginTop: "16px",
          padding: "8px 16px",
          backgroundColor: "#E53E3E",
          color: "#FFF",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Clear Data
      </button>
    </div>
  );
}