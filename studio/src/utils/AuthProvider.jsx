import React, { useEffect, useState } from "react";
import { AuthContext } from "./createAuthContext";
import { decryptPrivateKey } from "./auth";

const STORAGE_KEY = "encryptedPrivateKey";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [privateKey, setPrivateKey] = useState(null);

  useEffect(() => {
    setIsAuthenticated(false);
    setPrivateKey(null);
  }, []);

  const login = async (password) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No data to decrypt");

    const { ciphertext, iv, salt } = JSON.parse(raw);
    const privateKeyHex = await decryptPrivateKey(
      { ciphertext, iv, salt },
      password
    );
    setPrivateKey(privateKeyHex);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setPrivateKey(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, privateKey, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}