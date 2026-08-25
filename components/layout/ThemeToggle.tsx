"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// The anti-flash script (app/layout.tsx) sets/removes the "light" class on
// <html> before hydration. useSyncExternalStore reads that DOM state directly
// instead of mirroring it into local state in an effect, so there's no
// setState-in-effect cascade and no hydration mismatch: React uses
// getServerSnapshot for the first client render (matching the server), then
// re-syncs to the real class right after mount.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("light");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isLight = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isLight;
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {
      // localStorage unavailable (private mode, disabled storage) — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className="nav-link inline-flex h-11 w-11 items-center justify-center"
    >
      {isLight ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
