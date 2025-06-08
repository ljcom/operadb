// src/utils/createAuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { Wallet } from "ethers";

// 1) Export the context
export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [wallet, setWallet]             = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // on mount, if there’s a keystore, user still needs to unlock
  useEffect(() => {
    const encrypted = localStorage.getItem("encryptedPrivateKey");
    if (encrypted) {
      setIsAuthenticated(false);
      setWalletAddress(null);
    }
  }, []);

  // 2) Provide a login(password) function
  const login = async (password) => {
    const encrypted = localStorage.getItem("encryptedPrivateKey");
    if (!encrypted) {
      throw new Error("Tidak ada data terenkripsi—silakan daftar ulang.");
    }
    const w = await Wallet.fromEncryptedJson(encrypted, password);
    setWallet(w);
    setWalletAddress(w.address);
    setIsAuthenticated(true);
  };

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