// src/pages/Accounts.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../utils/createAuthContext";

export default function AccountsPage() {
  const { wallet, authToken } = useContext(AuthContext);
  const [addressToSearch, setAddressToSearch] = useState("");
  const [namespace, setNamespace]   = useState("");
  const [email, setEmail]           = useState("");
  const [accountData, setAccountData] = useState(null);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const headers = {
    "Content-Type": "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` })
  };

  
  const handleSearch = async e => {
    e.preventDefault();
    setError(""); setAccountData(null);
    if (!addressToSearch.trim()) {
      return setError("Masukkan account ID atau address untuk dicari.");
    }
    setLoading(true);
    try {
      const res  = await fetch(
        `http://localhost:3000/accounts/${encodeURIComponent(addressToSearch)}`,
        { method: "GET", headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat account.");
      setAccountData(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLoadActive = async () => {
    setError(""); setAccountData(null); setLoading(true);
    try {
      const res  = await fetch("http://localhost:3000/accounts/me", {
        method: "GET", headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal muat akun aktif.");
      setAccountData(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCreateAccount = async e => {
    e.preventDefault();
    setError(""); setAccountData(null);

    if (!wallet) {
      return setError("Harap unlock wallet dulu sebelum membuat akun.");
    }
    if (!namespace.trim() || !email.trim()) {
      return setError("Namespace dan email wajib diisi.");
    }

    setLoading(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const message   = `account.create:${email}:${timestamp}`;
      const signature = await wallet.signMessage(message);
      const address   = wallet.address;

      const payload = {
        namespace,
        email,
        password: "dummy",
        address,
        signature,
        timestamp
      };
      const res  = await fetch("http://localhost:3000/accounts", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat akun.");
      setAccountData(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "auto" }}>
      <h2>🔍 Cari Account</h2>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={addressToSearch}
          onChange={e => setAddressToSearch(e.target.value)}
          placeholder="Account ID atau address"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #CBD5E0" }}
        />
        <button disabled={loading}>{loading ? "..." : "Cari"}</button>
      </form>

      <button onClick={handleLoadActive} disabled={loading}>
        🔄 Load Akun Aktif
      </button>

      <hr style={{ margin: "24px 0" }} />

      {wallet ? (
        <>
          <h3>➕ Buat Akun Baru</h3>
          <form onSubmit={handleCreateAccount} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={namespace}
              onChange={e => setNamespace(e.target.value)}
              placeholder="Namespace (e.g. openfeast)"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email kontak"
            />
            <button disabled={loading}>
              {loading ? "Membuat..." : "Buat Akun"}
            </button>
          </form>
        </>
      ) : (
        <p style={{ color: "#E53E3E", marginTop: 12 }}>
          ⚠️ Harap unlock wallet dulu untuk membuat akun baru.
        </p>
      )}

      {error && <p style={{ color: "#E53E3E", marginTop: 12 }}>⚠️ {error}</p>}

      {accountData && (
        <div style={{ marginTop: 24, padding: 16, background: "#F7FAFC", borderRadius: 4 }}>
          <h4>Detail Account</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(accountData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}