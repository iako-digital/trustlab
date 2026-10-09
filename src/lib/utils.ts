import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Hand-rolled instead of Intl.DateTimeFormat: ICU locale data (and thus the
// formatted string) can differ between the Node server and the browser,
// which causes React hydration mismatches. Fixed month tables + UTC getters
// guarantee the server and client always render the same string.
const MONTHS: Record<string, string[]> = {
  ka: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
  hy: ["հունվ", "փետ", "մար", "ապր", "մայ", "հունս", "հուլ", "օգս", "սեպ", "հոկ", "նոյ", "դեկ"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function formatDate(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const months = MONTHS[locale] ?? MONTHS.en;
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function newId() {
  return "c_" + Math.random().toString(36).slice(2, 9);
}
