import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { GEMINI_TTS_MODEL, geminiGenerate } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const MAX_CHARS = 1200;

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

/**
 * Server-side text-to-speech fallback for the Smart Reader, used when the
 * browser has no voice for the text's language (typically Georgian/Armenian).
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
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Text-to-speech is not configured." }, { status: 503 });
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

  const res = await geminiGenerate(GEMINI_TTS_MODEL, {
    contents: [{ parts: [{ text: text.trim() }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
    },
  });
  if (!res || !res.ok) {
    console.error("[tts] Gemini request failed:", res?.status ?? "no response", res ? (await res.text().catch(() => "")).slice(0, 300) : "");
    return NextResponse.json({ error: "Text-to-speech failed." }, { status: 502 });
  }

  const payload = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
  } | null;
  const inline = payload?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) {
    console.error("[tts] Gemini returned no audio");
    return NextResponse.json({ error: "No audio returned." }, { status: 502 });
  }

  let audio: Uint8Array = Buffer.from(inline.data, "base64");
  const mime = inline.mimeType ?? "";
  if (!mime.includes("wav")) {
    // e.g. "audio/L16;codec=pcm;rate=24000"
    const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
    audio = pcmToWav(audio, rate);
  }

  return new NextResponse(audio as BodyInit, {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
  });
}
