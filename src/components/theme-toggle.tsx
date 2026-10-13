"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n";
import { THEME_KEY } from "@/lib/theme";

/**
 * Sun/Moon button. The icon is swapped with CSS (`dark:` variant), so it needs no
 * client state and cannot mismatch during hydration. The choice is saved in
 * localStorage; until the user clicks, the page follows the system preference.
 */
export function ThemeToggle() {
  const t = useT();

  // While no explicit choice is saved, follow live changes of the system theme.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        // storage blocked: fall through and follow the system
      }
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // private mode: the toggle still works for this visit
    }
    window.setTimeout(() => root.classList.remove("theme-fade"), 300);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      title={t("theme.toggle")}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-smooth hover:-translate-y-0.5 hover:bg-paper-tint hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:h-9 sm:w-9"
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" strokeWidth={2} />
      <Sun className="hidden h-[18px] w-[18px] dark:block" strokeWidth={2} />
    </button>
  );
}
