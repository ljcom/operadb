// src/pages/SignIn.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateCustomSeedPhrase, customSeedToPrivateKey } from "../utils/generateCustomSeed";
import { encryptPrivateKey } from "../utils/auth";
import { AuthContext } from "../utils/createAuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  // Jika sudah login (authenticatied), langsung ke Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // State untuk “tab” (create atau import)
  const [mode, setMode] = useState("create"); // “create” atau “import”

  // Seed phrase (12 kata)
  const [seedPhrase, setSeedPhrase] = useState("");
  // PrivateKeyHex setelah derive
  const [privateKeyHex, setPrivateKeyHex] = useState("");
  // State password
  const [password, setPassword] = useState("");
  // Status loading & error
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle “Create Seed”: generate 12 kata
  const handleCreateSeed = async () => {
    setError(null);
    try {
      const phrase = await generateCustomSeedPhrase();
      setSeedPhrase(phrase);
      // Derive privateKeyHex langsung
      const pk = customSeedToPrivateKey(phrase);
      setPrivateKeyHex(pk);
    } catch {
      setError("Gagal generate seed.");
    }
  };

  // Handle “Import Seed”: user paste di textarea
  const handleImportSeed = (e) => {
    setError(null);
    const phrase = e.target.value.trim().toLowerCase();
    setSeedPhrase(phrase);
    // Derive privateKeyHex
    try {
      const pk = customSeedToPrivateKey(phrase);
      setPrivateKeyHex(pk);
    } catch {
      setError("Seed phrase custom tidak valid.");
      setPrivateKeyHex("");
    }
  };

  // Setelah punya seedPhrase & privateKeyHex, user inputkan “password” untuk enkripsi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!seedPhrase || !privateKeyHex) {
      setError("Seed phrase belum ada atau tidak valid.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      const encrypted = await encryptPrivateKey(privateKeyHex, password);
      // Simpan di localStorage:
      localStorage.setItem(
        "encryptedPrivateKey",
        JSON.stringify({
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        })
      );
      // Redirect ke Home (atau langsung ke Dashboard)
      navigate("/");
    } catch (e) {
      console.error(e);
      setError("Gagal enkripsi data.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "480px", margin: "auto" }}>
      <h1 style={{ fontSize: "28px", color: "#222" }}>Sign In / Register</h1>

      {/* Tab switcher */}
      <div style={{ marginTop: "24px", display: "flex", gap: "16px" }}>
        <button
          onClick={() => setMode("create")}
          style={{
            padding: "8px 16px",
            backgroundColor: mode === "create" ? "#3182CE" : "#E2E8F0",
            color: mode === "create" ? "#FFF" : "#2D3748",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create Seed
        </button>
        <button
          onClick={() => setMode("import")}
          style={{
            padding: "8px 16px",
            backgroundColor: mode === "import" ? "#3182CE" : "#E2E8F0",
            color: mode === "import" ? "#FFF" : "#2D3748",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Import Seed
        </button>
      </div>

      {/* Isi konten sesuai mode */}
      <div style={{ marginTop: "24px" }}>
        {mode === "create" ? (
          <div>
            <button
              onClick={handleCreateSeed}
              style={{
                padding: "8px 16px",
                backgroundColor: "#38A169",
                color: "#FFF",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Generate Seed Phrase
            </button>
            {seedPhrase && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "16px", color: "#2D3748" }}>
                  Seed Phrase (12 kata custom):
                </p>
                <pre
                  style={{
                    backgroundColor: "#F7FAFC",
                    padding: "12px",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {seedPhrase}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "16px", color: "#2D3748", marginBottom: "8px" }}>
              Paste 12 kata seed custom Anda:
            </p>
            <textarea
              rows="3"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #CBD5E0",
                fontSize: "14px",
              }}
              placeholder="masukkan 12 kata seed custom..."
              onChange={handleImportSeed}
            />
            {seedPhrase && !privateKeyHex && (
              <p style={{ color: "#E53E3E", marginTop: "8px" }}>
                Seed phrase tidak valid.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Jika sudah punya seedPhrase & privateKeyHex, tampilkan form password */}
      {seedPhrase && privateKeyHex && (
        <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
          <p style={{ fontSize: "16px", color: "#2D3748" }}>
            Masukkan password untuk melindungi private key Anda:
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 karakter)"
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
            {loading ? "Menyimpan..." : "Register & Encrypt"}
          </button>
        </form>
      )}
    </div>
  );
}