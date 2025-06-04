// src/utils/createAuthContext.js
import { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  privateKey: null,
  login: async () => {},
  logout: () => {},
});