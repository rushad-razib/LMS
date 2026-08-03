import { useEffect, type ReactNode } from "react";

type ThemeRootProps = {
  theme: "light" | "dark";
  children: ReactNode;
};

export function ThemeRoot({ theme, children }: ThemeRootProps) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);

  return <div data-theme={theme}>{children}</div>;
}
