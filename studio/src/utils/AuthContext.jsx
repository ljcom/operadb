// src/utils/createAuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { Wallet } from "ethers";

// Context and Provider for authentication (unlocking keystore)
export const AuthContext = createContext({
  wallet: null,
  walletAddress: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [wallet, setWallet]                 = useState(null);
  const [walletAddress, setWalletAddress]   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, check if keystore exists: require unlock
  useEffect(() => {
    const encrypted = localStorage.getItem("encryptedPrivateKey");
    if (encrypted) {
      setIsAuthenticated(false);
      setWalletAddress(null);
    }
  }, []);

  // Unlock keystore
  const login = async (password) => {
    const raw = localStorage.getItem("encryptedPrivateKey");
    if (!raw) throw new Error("Tidak ada data terenkripsi—silakan daftar ulang.");
    const w = await Wallet.fromEncryptedJson(raw, password);
    setWallet(w);
    setWalletAddress(w.address);
    setIsAuthenticated(true);
  };

  // Clear session
  const logout = () => {
    localStorage.removeItem("encryptedPrivateKey");
    setWallet(null);
    setWalletAddress(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ wallet, walletAddress, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

