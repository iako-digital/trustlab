"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import en from "@/../messages/en.json";
import ka from "@/../messages/ka.json";
import hy from "@/../messages/hy.json";
import type { Locale } from "@/lib/types";

/**
 * Minimal, dependency-free i18n for the prototype.
 * Dictionaries live in /messages/*.json so they are ready to migrate to
 * next-intl later without rewriting any component copy.
 */

const DICTS: Record<Locale, Record<string, unknown>> = { en, ka, hy };
const STORAGE_KEY = "mbc.locale";

type Params = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Params) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function lookup(dict: Record<string, unknown>, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : undefined;
}

function interpolate(str: string, params?: Params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`,
  );
}

export function I18nProvider({
  children,
  initialLocale = "ka",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && DICTS[saved]) setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string, params?: Params) => {
    const str = lookup(DICTS[locale], key) ?? lookup(DICTS.en, key) ?? key;
    return interpolate(str, params);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Convenience hook: returns just the translate function. */
export function useT() {
  return useI18n().t;
}
