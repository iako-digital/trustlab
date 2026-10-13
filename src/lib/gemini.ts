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

/**
 * Ordered, de-duplicated key pool for a job: its dedicated key, then GEMINI_API_KEY, then the
 * comma-separated backups in GEMINI_API_KEYS. Keys live only in the environment, never in code.
 */
export function geminiKeyPool(kind?: GeminiKeyKind): string[] {
  const backups = (process.env.GEMINI_API_KEYS ?? "").split(",");
  const all = [kind ? process.env[KEY_ENV[kind]] : undefined, process.env.GEMINI_API_KEY, ...backups];
  return [...new Set(all.map((k) => k?.trim()).filter((k): k is string => !!k))];
}

/** The first key of the pool; undefined means Gemini is not configured. */
export function geminiKey(kind?: GeminiKeyKind): string | undefined {
  return geminiKeyPool(kind)[0];
}

/** Keys that just failed (quota / rejected) are skipped for a while, per server instance. */
const coolingUntil = new Map<string, number>();
const QUOTA_COOLDOWN_MS = 60_000;
const REJECTED_COOLDOWN_MS = 10 * 60_000;

/** Failures that mean "this key cannot serve the request": move on to the next key. */
async function keyProblem(res: Response): Promise<"quota" | "rejected" | null> {
  if (res.status === 429) return "quota";
  if (res.status === 401 || res.status === 403) return "rejected";
  if (res.status === 400) {
    const text = await res.clone().text().catch(() => "");
    if (/API key (not valid|expired)|API_KEY_INVALID/i.test(text)) return "rejected";
  }
  return null;
}

/**
 * POSTs to Gemini generateContent, rotating through the key pool: on 429 (quota) or
 * 401/403 (rejected key) the next key is tried. One retry per key on 503 ("high demand").
 * Returns null when no key is configured or the network fails.
 */
export async function geminiGenerate(
  model: string,
  body: unknown,
  kind?: GeminiKeyKind,
): Promise<Response | null> {
  const pool = geminiKeyPool(kind);
  if (pool.length === 0) return null;
  const now = Date.now();
  const ready = pool.filter((k) => (coolingUntil.get(k) ?? 0) <= now);
  const keys = ready.length > 0 ? ready : pool; // everything cooling: still try, in order

  let last: Response | null = null;
  for (const apiKey of keys) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${BASE}/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(45_000),
        });
        if (res.status === 503 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        const problem = res.ok ? null : await keyProblem(res);
        if (problem) {
          coolingUntil.set(apiKey, Date.now() + (problem === "quota" ? QUOTA_COOLDOWN_MS : REJECTED_COOLDOWN_MS));
          console.error(`[gemini] key #${pool.indexOf(apiKey) + 1}/${pool.length} ${problem} on ${model}; trying next`);
          last = res;
          break; // next key
        }
        return res;
      } catch {
        if (attempt === 1) return last;
      }
    }
  }
  return last;
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
