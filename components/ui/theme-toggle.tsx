"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

// Switches between the light and dark palettes; next-themes stores the choice
// and stamps it on <html> as data-theme. Rendered only after mount: the server
// cannot know the stored choice, so its guess would not hydrate.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="theme-toggle" onClick={() => setTheme(next)}>
      Use {next} theme
    </button>
  );
}
