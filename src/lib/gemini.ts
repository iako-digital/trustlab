import "server-only";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
export const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";

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
