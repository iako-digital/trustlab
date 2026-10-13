import type { Locale } from "@/lib/types";

/** Georgian and Armenian have their own scripts; anything else is read as English. */
export function detectLang(text: string): Locale {
  let ka = 0;
  let hy = 0;
  let other = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if ((c >= 0x10a0 && c <= 0x10ff) || (c >= 0x1c90 && c <= 0x1cbf) || (c >= 0x2d00 && c <= 0x2d2f)) ka++;
    else if (c >= 0x0530 && c <= 0x058f) hy++;
    else if (/\p{L}/u.test(ch)) other++;
  }
  if (ka >= hy && ka > other / 2 && ka > 0) return "ka";
  if (hy > ka && hy > other / 2) return "hy";
  return "en";
}
