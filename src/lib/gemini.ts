import "server-only";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
export const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";

/**
 * Text models tried in order. Free-tier quota is per model, so when the primary
 * is exhausted (429) or retired (404) the next one usually still answers.
 * (gemini-1.5-* and gemini-2.0-* are retired; 2.5-* is closed to new keys.)
 */
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-lite-latest"];
export const TEXT_MODELS = [...new Set([GEMINI_MODEL, ...FALLBACK_MODELS])];

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Dedicated keys per job; each falls back to GEMINI_API_KEY when its own key is not set. */
export type GeminiKeyKind = "translate" | "search" | "verify";
const KEY_ENV: Record<GeminiKeyKind, string> = {
  translate: "GEMINI_TRANSLATE_KEY",
  search: "GEMINI_SEARCH_KEY",
  verify: "GEMINI_VERIFY_KEY",
};
export function geminiKey(kind?: GeminiKeyKind): string | undefined {
  return (kind && process.env[KEY_ENV[kind]]?.trim()) || process.env.GEMINI_API_KEY || undefined;
}

/**
 * POSTs to Gemini generateContent. One retry on 429/503: those are the
 * "high demand" spikes the API recommends retrying. Returns null when the
 * key is missing or the network fails.
 */
export async function geminiGenerate(
  model: string,
  body: unknown,
  kind?: GeminiKeyKind,
): Promise<Response | null> {
  const apiKey = geminiKey(kind);
  if (!apiKey) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45_000),
      });
      if ((res.status === 503 || res.status === 429) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      return res;
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

export interface TextResult {
  res: Response | null;
  /** The model that produced `res` (or the last one tried). */
  model: string;
  /** Why the last attempt failed, for logs: "<model>: <status> <message>". */
  failures: string[];
}

/** Like geminiGenerate, but falls through TEXT_MODELS on 404/429/503. */
export async function geminiText(body: unknown, kind?: GeminiKeyKind): Promise<TextResult> {
  const failures: string[] = [];
  let last: { res: Response | null; model: string } = { res: null, model: TEXT_MODELS[0] };
  for (const model of TEXT_MODELS) {
    const res = await geminiGenerate(model, body, kind);
    last = { res, model };
    if (res?.ok) return { ...last, failures };
    const detail = res ? (await res.clone().text().catch(() => "")).slice(0, 200) : "network error / no key";
    failures.push(`${model}: ${res?.status ?? "no response"} ${detail.replace(/\s+/g, " ")}`);
    // Only these statuses are model-specific; anything else (400, 401, 403) will fail everywhere.
    if (res && ![404, 429, 503].includes(res.status)) break;
  }
  return { ...last, failures };
}
