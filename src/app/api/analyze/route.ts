import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_INPUT_LENGTH = 6000;

const SYSTEM_PROMPT = `You are an expert AI Fact-Checking Assistant for "TrustLab", a platform dedicated to identifying disinformation, manipulative narratives, and propaganda in the South Caucasus region (specifically Georgia and Armenia).

YOUR ROLE:
Analyze the input text, link content, or claim provided by the user and evaluate its potential risk of being fake news, manipulation, or hate speech.

EVALUATION CRITERIA:
1. Emotional & Provocative Language: Look for sensationalized words, outrage bait, or panic-inducing phrasing.
2. Ethnic & Regional Polarization: Detect subtle hate speech, ethnic stereotyping, or anti-peace narratives targeting Georgians, Armenians, or regional minorities.
3. Lack of Sources/Context: Check if the text presents unverified rumors, outdated photos/events framed as recent, or quotes without attribution.
4. Logical Fallacies: Identify false dilemmas, strawman arguments, or misleading statistics.

OUTPUT FORMAT:
You MUST respond strictly in valid JSON format with the following structure:
{
  "riskScore": <number from 0 to 100>,
  "riskLevel": "<'Low' | 'Medium' | 'High'>",
  "redFlags": [<array of suspicious words/phrases>],
  "explanationKA": "<Detailed summary in GEORGIAN>",
  "explanationHY": "<Detailed summary in ARMENIAN>",
  "explanationEN": "<Detailed summary in ENGLISH>"
}

TONE: Be objective, neutral, and fact-based.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    riskScore: {
      type: "NUMBER",
      description: "Number from 0 to 100.",
    },
    riskLevel: { type: "STRING", enum: ["Low", "Medium", "High"] },
    redFlags: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Array of suspicious words/phrases.",
    },
    explanationKA: { type: "STRING", description: "Detailed summary in Georgian." },
    explanationHY: { type: "STRING", description: "Detailed summary in Armenian." },
    explanationEN: { type: "STRING", description: "Detailed summary in English." },
  },
  required: ["riskScore", "riskLevel", "redFlags", "explanationKA", "explanationHY", "explanationEN"],
};

interface AnalyzeResult {
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  redFlags: string[];
  explanationKA: string;
  explanationHY: string;
  explanationEN: string;
}

function isAnalyzeResult(value: unknown): value is AnalyzeResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.riskScore === "number" &&
    (v.riskLevel === "Low" || v.riskLevel === "Medium" || v.riskLevel === "High") &&
    Array.isArray(v.redFlags) &&
    v.redFlags.every((f) => typeof f === "string") &&
    typeof v.explanationKA === "string" &&
    typeof v.explanationHY === "string" &&
    typeof v.explanationEN === "string"
  );
}

/**
 * Admin-only: the Gemini key and quota belong to the editorial team. Auth is
 * enforced twice (middleware + here). The key is read from the server env only.
 * The result is a risk signal for a human editor — never a published verdict.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const limited = rateLimit(`analyze:${admin.userId}`, 10, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Field 'text' is required." }, { status: 400 });
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `Field 'text' must be ${MAX_INPUT_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  let geminiRes: Response;
  try {
    geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the Gemini API." }, { status: 502 });
  }

  if (!geminiRes.ok) {
    return NextResponse.json(
      { error: `Gemini API request failed (${geminiRes.status}).` },
      { status: 502 },
    );
  }

  let payload: unknown;
  try {
    payload = await geminiRes.json();
  } catch {
    return NextResponse.json({ error: "Gemini API returned an invalid response." }, { status: 502 });
  }

  const raw = (
    payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof raw !== "string") {
    return NextResponse.json({ error: "Gemini API returned no content." }, { status: 502 });
  }

  let result: unknown;
  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Gemini API returned malformed JSON." }, { status: 502 });
  }

  if (!isAnalyzeResult(result)) {
    return NextResponse.json(
      { error: "Gemini API response did not match the expected shape." },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
