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

/**
 * POSTs to Gemini generateContent. One retry on 429/503: those are the
 * "high demand" spikes the API recommends retrying. Returns null when the
 * key is missing or the network fails.
 */
export async function geminiGenerate(model: string, body: unknown): Promise<Response | null> {
  const apiKey = process.env.GEMINI_API_KEY;
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
export async function geminiText(body: unknown): Promise<TextResult> {
  const failures: string[] = [];
  let last: { res: Response | null; model: string } = { res: null, model: TEXT_MODELS[0] };
  for (const model of TEXT_MODELS) {
    const res = await geminiGenerate(model, body);
    last = { res, model };
    if (res?.ok) return { ...last, failures };
    const detail = res ? (await res.clone().text().catch(() => "")).slice(0, 200) : "network error / no key";
    failures.push(`${model}: ${res?.status ?? "no response"} ${detail.replace(/\s+/g, " ")}`);
    // Only these statuses are model-specific; anything else (400, 401, 403) will fail everywhere.
    if (res && ![404, 429, 503].includes(res.status)) break;
  }
  return { ...last, failures };
}
