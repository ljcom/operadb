// src/pages/Accounts.jsx
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../utils/createAuthContext";

export default function AccountsPage() {
  const { wallet, authToken } = useContext(AuthContext);

  const [myAccounts, setMyAccounts]         = useState([]);
  const [addressToSearch, setAddressToSearch] = useState("");
  const [namespace, setNamespace]             = useState("");
  const [email, setEmail]                     = useState("");
  const [accountData, setAccountData]         = useState(null);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);

  const headers = {
    "Content-Type": "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` })
  };

 // Fetch “My Accounts” via POST /accounts/me signature–based
 useEffect(() => {
   if (!wallet) return;
   const loadAccounts = async () => {
     setError("");
     setLoading(true);
     try {
       const timestamp = Math.floor(Date.now() / 1000);
       const message   = `accounts.me:${timestamp}`;
       const signature = await wallet.signMessage(message);

       const res = await fetch("http://localhost:3000/accounts/me", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ signature, timestamp })
       });
       const list = await res.json();
       if (!res.ok) throw new Error(list.error || "Gagal memuat daftar akun");
       setMyAccounts(list);
     } catch (err) {
       setError(err.message);
     }
     setLoading(false);
   };
   loadAccounts();
 }, [wallet]);

  // Cari account by ID/address
  const handleSearch = async e => {
    e.preventDefault();
    setError("");
    setAccountData(null);
    if (!addressToSearch.trim()) {
      setError("Masukkan account ID atau address untuk dicari.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/accounts/${encodeURIComponent(addressToSearch)}`,
        { method: "GET", headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat account.");
      setAccountData(data);


     // Setelah berhasil create, reload myAccounts
     const ts2 = Math.floor(Date.now() / 1000);
     const msg2 = `accounts.me:${ts2}`;
     const sig2 = await wallet.signMessage(msg2);
     const res2 = await fetch("http://localhost:3000/accounts/me", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ signature: sig2, timestamp: ts2 })
     });
     const list2 = await res2.json();
     if (!res2.ok) throw new Error(list2.error || "Gagal memuat daftar akun");
     setMyAccounts(list2);

    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Load detail akun aktif
  const handleLoadActive = async () => {
        setError(""); setMyAccounts([]); setLoading(true);
    try {
      // 1) Siapkan timestamp & message
      const timestamp = Math.floor(Date.now() / 1000);
      const message   = `accounts.me:${timestamp}`;
      // 2) Tanda tangani dengan PV-key
      const signature = await wallet.signMessage(message);

      // 3) Panggil POST /accounts/me
      const res = await fetch("http://localhost:3000/accounts/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, timestamp })
      });
      const list = await res.json();
      if (!res.ok) throw new Error(list.error || "Gagal muat daftar akun");

      // 4) Simpan ke state myAccounts
      setMyAccounts(list);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Buat akun baru
  const handleCreateAccount = async e => {
    e.preventDefault();
    setError("");
    setAccountData(null);

    if (!wallet) {
      setError("⚠️ Harap unlock wallet dulu sebelum membuat akun.");
      return;
    }
    if (!namespace.trim() || !email.trim()) {
      setError("Namespace dan email wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      // 1) Sign dengan format yang backend verifikasi
      const timestamp = Math.floor(Date.now() / 1000);
      const message   = `account.create:${email}:${timestamp}`;
      const signature = await wallet.signMessage(message);
      const address   = wallet.address;

      // 2) Kirim ke backend
      const payload = { namespace, email, password: "dummy", address, signature, timestamp };
      const res     = await fetch("http://localhost:3000/accounts", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat akun.");
      setAccountData(data);

      // 3) Refresh daftar My Accounts
      const listRes = await fetch("http://localhost:3000/accounts", { method: "GET", headers });
      if (!listRes.ok) throw new Error("Gagal memuat daftar akun");
      const listData = await listRes.json();
      setMyAccounts(listData);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "auto" }}>

      {/* My Accounts List */}
      <section style={{ marginBottom: 32 }}>
        <h3>🔑 My Accounts</h3>
        {myAccounts.length > 0 ? (
          myAccounts.map(acc => (
            <div key={acc.accountId}
                 style={{
                   padding: 8,
                   border: "1px solid #CBD5E0",
                   borderRadius: 4,
                   marginBottom: 8
                 }}>
              <strong>{acc.accountId}</strong><br/>
              Groups: <em>{acc.groups}</em>
            </div>
          ))
        ) : (
          <p style={{ color: "#666" }}>
            Tidak ada akun. Buat akun baru di bawah:
          </p>
        )}
      </section>

      {/* Search & Active */}
      <h2>🔍 Cari Account</h2>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={addressToSearch}
          onChange={e => setAddressToSearch(e.target.value)}
          placeholder="Account ID atau address"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #CBD5E0" }}
        />
        <button disabled={loading}>{loading ? "…" : "Cari"}</button>
      </form>
      <button onClick={handleLoadActive} disabled={loading}>
        🔄 Load Akun Aktif
      </button>

      <hr style={{ margin: "24px 0" }} />

      {/* Create New Account */}
      <h3>➕ Buat Akun Baru</h3>
      <form onSubmit={handleCreateAccount}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          {loading ? "Membuat…" : "Buat Akun"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#E53E3E", marginTop: 12 }}>⚠️ {error}</p>
      )}

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