import React, { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme?: Theme;
  setTheme?: (theme: Theme) => void;
};

// Minimal shim: just renders children and exposes a basic theme API.
export const ThemeProvider: React.FC<{
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};

export function useTheme(): { theme?: Theme; setTheme?: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const hasDomDark = document.documentElement.classList.contains("dark");
      setThemeState(hasDomDark || prefersDark ? "dark" : "light");
    } catch (e) {
      // no-op in non-browser
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      document.documentElement.classList.toggle("dark", t === "dark");
    } catch {}
  };

  return { theme, setTheme };
}
