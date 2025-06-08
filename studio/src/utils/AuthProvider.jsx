// src/utils/createAuthContext.jsx
import React, { useState, useEffect } from "react";
import { AuthContext }        from "./createAuthContext";
import { Wallet } from "ethers";

const STORAGE_KEY = "encryptedPrivateKey";

export function AuthProvider({ children }) {
  const [wallet, setWallet]             = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, lihat kalau ada keystore → anggap user perlu unlock
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setIsAuthenticated(false);
      setWallet(null);
    }
  }, []);

  // 1️⃣ Unlock: hanya decrypt keystore, set wallet & address
  const login = async (password) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("🔑 No keystore found — please Sign In first.");
    const w = await Wallet.fromEncryptedJson(raw, password);
    setWallet(w);
    setIsAuthenticated(true);
  };

  // logout: bersihkan session
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setWallet(null);
    setIsAuthenticated(false);
  };


  return (
    <AuthContext.Provider value={{ wallet, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}