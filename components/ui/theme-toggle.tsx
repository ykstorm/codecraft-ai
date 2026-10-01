"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  // Client-mount gate (server snapshot false, client true) — avoids rendering a
  // theme-dependent icon during SSR, which would hydrate-mismatch. No effect, so
  // no setState-in-effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="cursor-pointer"
      onClick={() => {
        setTheme(theme === "light" ? "dark" : "light");
      }}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-black" />
      ) : (
        <Sun className="h-5 w-5 text-white" color="white" />
      )}
    </div>
  );
}
