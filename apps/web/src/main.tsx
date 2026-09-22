import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthProvider";
import { AppToaster } from "./components/AppToaster";
import { ConfirmProvider } from "./components/ConfirmProvider";
import { Analytics } from "./components/Analytics";
import { AppRouter } from "./app/router";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ConfirmProvider>
            <Analytics />
            <AppRouter />
            <AppToaster />
          </ConfirmProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
