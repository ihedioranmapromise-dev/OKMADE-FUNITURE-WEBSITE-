"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { THEME_COOKIE, THEME_DEFAULT } from "./theme-constants";

const ThemeContext = createContext({
  theme: THEME_DEFAULT,
  toggle: () => {},
  setTheme: () => {},
});

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function writeCookie(name, value) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function ThemeProvider({ children, initialTheme = THEME_DEFAULT }) {
  const [theme, setThemeState] = useState(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cookieVal = readCookie(THEME_COOKIE);
    if (cookieVal === "dark" || cookieVal === "light") {
      setThemeState(cookieVal);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    writeCookie(THEME_COOKIE, theme);
  }, [theme, mounted]);

  const setTheme = (t) => setThemeState(t === "dark" ? "dark" : "light");
  const toggle = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
