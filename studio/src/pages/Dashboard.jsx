// src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard() {
  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "auto" }}>
      {/* Pesan Selamat datang hanya muncul di Dashboard */}
      <h2 style={{ fontSize: "24px", color: "#333", marginBottom: "16px" }}>
        Selamat datang, pengguna!
      </h2>
      <p style={{ color: "#555", marginBottom: "32px" }}>
        Di sini Anda dapat melihat ringkasan Dashboard, statistik, atau tautan cepat.
      </p>

      {/* Konten Dashboard Anda */}
      <div style={{ padding: "16px", backgroundColor: "#F7FAFC", borderRadius: "4px" }}>
        {/* Misalnya card summary, dll. */}
        <p>(Konten Dashboard…)</p>
      </div>
    </div>
  );
}