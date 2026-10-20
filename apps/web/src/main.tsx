import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AnimateUIProvider } from "@animate-ui/react/provider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnimateUIProvider tempo={1} checkAnimation="draw">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AnimateUIProvider>
  </StrictMode>,
);
