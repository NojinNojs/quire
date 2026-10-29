import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./features/error/ErrorBoundary";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/themes.css";
import "./styles/app.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("root element missing");

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

import "./styles/catalog.css";
import "./styles/error.css";
import "./styles/nav.css";
import "./styles/motion.css";
