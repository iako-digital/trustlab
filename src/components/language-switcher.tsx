"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<Locale, string> = { ka: "ქარ", hy: "Հայ", en: "EN" };

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-paper-line bg-paper-card p-0.5 shadow-sm">
      <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-ink-faint" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "min-h-8 rounded-[8px] px-2.5 py-1 text-xs sm:min-h-0 sm:px-2 font-medium transform transition-smooth",
            locale === l
              ? "bg-ink text-paper hover:scale-105"
              : "text-ink-soft hover:bg-paper hover:-translate-y-0.5",
          )}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
