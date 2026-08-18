import { useEffect, useState } from "react";
import { Toaster } from "sonner";

function readTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function AppToaster() {
  const [theme, setTheme] = useState<"light" | "dark">(readTheme);

  useEffect(() => {
    function sync() {
      setTheme(readTheme());
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      theme={theme}
      position="top-right"
      closeButton
      toastOptions={{
        className: "sonner-toast",
        style: {
          background: "var(--surface-elevated)",
          color: "var(--ink)",
          border: "1px solid var(--border)",
        },
      }}
    />
  );
}
