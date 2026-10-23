import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimateUIProvider } from "@animate-ui/react/provider";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  const observer = new MutationObserver(() => {
    const cl = document.documentElement.classList;
    if (cl.contains("dark") && cl.contains("light")) {
      cl.remove("light");
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AnimateUIProvider tempo={1} checkAnimation="draw">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AnimateUIProvider>
    </ThemeProvider>
  </StrictMode>,
);
