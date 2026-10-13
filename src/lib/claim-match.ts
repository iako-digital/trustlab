import type { Claim, Locale } from "@/lib/types";

/**
 * Conservative text-to-claim matcher, a port of extension/matcher.js: a message
 * only matches when it shares most of a claim's distinctive words, so false
 * positives stay rare. Georgian/Armenian are heavily inflected, so words are
 * compared by their first STEM letters.
 */
const MIN_SHARED = 4;
const MIN_RATIO = 0.6;
const STEM = 5;

function tokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (w.length >= 4) out.add(w.slice(0, STEM));
  }
  return out;
}

export interface ClaimIndexEntry {
  claim: Claim;
  sets: Set<string>[];
}

const LOCALES: Locale[] = ["ka", "hy", "en"];

export function buildClaimIndex(claims: Claim[]): ClaimIndexEntry[] {
  return claims.map((claim) => ({
    claim,
    sets: LOCALES.map((l) => tokens(`${claim.title[l] ?? ""} ${claim.claim[l] ?? ""}`)).filter(
      (s) => s.size >= MIN_SHARED,
    ),
  }));
}

export function findClaimMatch(index: ClaimIndexEntry[], text: string): Claim | null {
  const post = tokens(text);
  if (post.size < MIN_SHARED) return null;
  let best: Claim | null = null;
  let bestScore = 0;
  for (const entry of index) {
    for (const set of entry.sets) {
      let shared = 0;
      for (const tkn of set) if (post.has(tkn)) shared++;
      const ratio = shared / set.size;
      if (shared >= MIN_SHARED && ratio >= MIN_RATIO && ratio > bestScore) {
        best = entry.claim;
        bestScore = ratio;
      }
    }
  }
  return best;
}
