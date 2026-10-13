import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { GEMINI_TTS_MODEL, geminiGenerate } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 1200;
const GTTS_CHUNK = 180; // translate_tts accepts roughly 200 characters per request
const LANGS = ["ka", "hy", "en"];

/** Splits into pieces of at most `max` characters, preferring sentence ends. */
function pieces(text: string, max: number): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?។።…]+[.!?។።…]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > max) {
      out.push(cur.trim());
      cur = "";
    }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

/** Fallback voice: Google Translate TTS (MP3). MP3 frames can simply be concatenated. */
async function googleTts(text: string, lang: string): Promise<Uint8Array | null> {
  try {
    const bufs: Uint8Array[] = [];
    for (const piece of pieces(text, GTTS_CHUNK)) {
      const res = await fetch(
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(piece)}`,
        { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10_000) },
      );
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("audio")) return null;
      bufs.push(new Uint8Array(await res.arrayBuffer()));
    }
    return bufs.length ? new Uint8Array(Buffer.concat(bufs)) : null;
  } catch {
    return null;
  }
}

/** Wraps raw 16-bit mono PCM in a WAV container so <audio> can play it. */
function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return new Uint8Array(Buffer.concat([header, pcm]));
}

/** Gemini TTS; returns a WAV, or null when unconfigured or failing (the caller then falls back). */
async function geminiVoice(text: string): Promise<Uint8Array | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  const res = await geminiGenerate(GEMINI_TTS_MODEL, {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
    },
  });
  if (!res || !res.ok) {
    console.error("[tts] Gemini request failed:", res?.status ?? "no response", res ? (await res.text().catch(() => "")).slice(0, 300) : "");
    return null;
  }
  const payload = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
  } | null;
  const inline = payload?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) {
    console.error("[tts] Gemini returned no audio");
    return null;
  }
  let audio: Uint8Array = Buffer.from(inline.data, "base64");
  const mime = inline.mimeType ?? "";
  if (!mime.includes("wav")) {
    // e.g. "audio/L16;codec=pcm;rate=24000"
    const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
    audio = pcmToWav(audio, rate);
  }
  return audio;
}

/**
 * Server-side text-to-speech fallback for the Smart Reader, used when the
 * browser has no voice for the text's language (typically Georgian/Armenian).
 * Tries Gemini first (WAV), then Google Translate TTS (MP3).
 * Public, so it is rate-limited and capped in length; it only voices text
 * the caller already has and never calls an LLM to generate content.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`tts:${clientIp(req)}`, 10, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string" || !text.trim() || text.length > MAX_CHARS) {
    return NextResponse.json({ error: "Invalid text." }, { status: 400 });
  }

  const lang = (body as { lang?: unknown }).lang;
  const language = typeof lang === "string" && LANGS.includes(lang) ? lang : "en";

  // 1. Gemini voice (WAV).
  const wav = await geminiVoice(text.trim());
  if (wav) return new NextResponse(wav as BodyInit, { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });

  // 2. Fallback: Google Translate TTS (MP3).
  const mp3 = await googleTts(text.trim(), language);
  if (mp3) return new NextResponse(mp3 as BodyInit, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });

  return NextResponse.json({ error: "Text-to-speech failed." }, { status: 502 });
}
