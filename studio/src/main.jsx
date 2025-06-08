import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App              from "./App";
import { AuthProvider } from "./utils/AuthProvider";   // ← point here
import { AccountProvider } from './utils/AccountContext'; 
import "./index.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <AccountProvider>    {/* ← di sini */}
        <App />
      </AccountProvider>
    </AuthProvider>
  </BrowserRouter>
);