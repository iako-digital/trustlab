import "server-only";
import { LOCALES, type Locale, type Verdict } from "@/lib/types";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are an AI assistant for the fact-checking editors of "TrustLab", which debunks disinformation in the South Caucasus (Georgia and Armenia).
You receive a submitted claim. Propose, for a HUMAN editor to review:
- verdict: "fake", "manipulative" or "true"
- evidenceSummary: what is known about the claim, what evidence supports or contradicts it, and what remains unverified (English, factual, neutral; do not invent sources)
- a short neutral headline (title) and a fact-check explanation in Georgian (ka), Armenian (hy) and English (en)
Be honest about uncertainty. Never present guesses as established facts. The editor makes the final decision.`;

const str = { type: "STRING" };
const loc = {
  type: "OBJECT",
  properties: { ka: str, hy: str, en: str },
  required: ["ka", "hy", "en"],
};
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["fake", "manipulative", "true"] },
    evidenceSummary: str,
    title: loc,
    explanation: loc,
  },
  required: ["verdict", "evidenceSummary", "title", "explanation"],
};

export interface GeneratedSuggestion {
  verdict: Verdict;
  evidenceSummary: string;
  translation: { title: Record<Locale, string>; explanation: Record<Locale, string> };
  model: string;
}

export type SuggestError = "not_configured" | "upstream";

function isLoc(v: unknown): v is Record<Locale, string> {
  return (
    !!v && typeof v === "object" && LOCALES.every((l) => typeof (v as Record<string, unknown>)[l] === "string")
  );
}

export async function generateSuggestion(
  claimText: string,
): Promise<{ ok: true; value: GeneratedSuggestion } | { ok: false; error: SuggestError }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: claimText }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
      }),
    });
    if (!res.ok) return { ok: false, error: "upstream" };
    const payload = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== "string") return { ok: false, error: "upstream" };
    const r = JSON.parse(raw) as Record<string, unknown>;
    if (
      (r.verdict !== "fake" && r.verdict !== "manipulative" && r.verdict !== "true") ||
      typeof r.evidenceSummary !== "string" ||
      !isLoc(r.title) ||
      !isLoc(r.explanation)
    ) {
      return { ok: false, error: "upstream" };
    }
    return {
      ok: true,
      value: {
        verdict: r.verdict,
        evidenceSummary: r.evidenceSummary.slice(0, 5000),
        translation: {
          title: { ka: r.title.ka.slice(0, 300), hy: r.title.hy.slice(0, 300), en: r.title.en.slice(0, 300) },
          explanation: r.explanation,
        },
        model: GEMINI_MODEL,
      },
    };
  } catch {
    return { ok: false, error: "upstream" };
  }
}
