// src/pages/Accounts.jsx
import React, { useState } from "react";

export default function AccountsPage() {
  const [address, setAddress] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setAccountData(null);

    const addr = address.trim();
    if (!addr) {
      setError("Masukkan address account terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      // Ambil token JWT dari localStorage (jika ada)
      const token = localStorage.getItem("authToken");
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Panggil GET /accounts/:id
      const res = await fetch(`http://localhost:3000/accounts/${encodeURIComponent(addr)}`, {
        method: "GET",
        headers
      });

      if (res.status === 401) {
        // Unauthorized: user belum login / token invalid
        setError("Anda perlu login terlebih dahulu untuk mengakses data account.");
        setLoading(false);
        return;
      }

      if (res.status === 404) {
        setError("Account tidak ditemukan di backend.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // Kesalahan lain (misal 400, 500)
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Terjadi kesalahan saat menghubungi server.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setAccountData(data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data account.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "auto" }}>
      <h2 style={{ fontSize: "22px", color: "#333333" }}>Cari Account</h2>

      <form onSubmit={handleSearch} style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Masukkan account address"
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #CBD5E0",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3182CE",
            color: "#FFF",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Mencari..." : "Cari"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#E53E3E", marginTop: "12px" }}>{error}</p>
      )}

      {accountData && (
        <div style={{ marginTop: "24px", backgroundColor: "#F7FAFC", padding: "16px", borderRadius: "4px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#2D3748" }}>Detail Account:</h3>
          <pre style={{ fontSize: "14px", color: "#2D3748", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(accountData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}