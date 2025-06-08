
// src/utils/AccountContext.jsx
import React, { createContext, useState } from "react";

// Context and Provider for tracking selected account
export const AccountContext = createContext({
  selectedAccount: null,
  setSelectedAccount: () => {}
});

export function AccountProvider({ children }) {
  const [selectedAccount, setSelectedAccount] = useState(null);

  return (
    <AccountContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </AccountContext.Provider>
  );
}