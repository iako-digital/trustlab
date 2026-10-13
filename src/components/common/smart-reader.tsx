"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { detectLang } from "@/lib/detect-lang";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/types";

const BCP47: Record<Locale, string> = { ka: "ka-GE", hy: "hy-AM", en: "en-US" };
const NATIVE_CHUNK = 200; // Chrome silently stops long utterances; speak sentence-sized pieces.
const SERVER_CHUNK = 1000; // /api/tts accepts up to 1200 characters.
const SERVER_MAX_CHUNKS = 4;
const GTTS_CHUNK = 180; // translate_tts accepts roughly 200 characters per request.
const GTTS_MAX_CHUNKS = 12;
const VOICE_WAIT_MS = 600; // Chrome loads the voice list asynchronously.
// Tiny silent WAV, played inside the click to unlock audio (Safari/iOS block play() after an await).
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/** The page can hold many readers; only one may speak at a time. */
let stopActive: (() => void) | null = null;

export { detectLang };

/** Splits into pieces of at most `max` characters, preferring sentence ends. */
function chunkText(text: string, max: number): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?។።…]+[.!?។።…]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  const push = () => {
    if (cur.trim()) out.push(cur.trim());
    cur = "";
  };
  for (const s of sentences) {
    if (cur && cur.length + s.length > max) push();
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) {
        cur = s.slice(i, i + max);
        push();
      }
    } else {
      cur += s;
    }
  }
  push();
  return out;
}

const norm = (l: string) => l.toLowerCase().replace("_", "-");

/** Best installed voice for a language: exact (ka-GE, hy-AM, en-US) first, then any `ka`/`hy`/`en-*`. */
function findVoice(voices: SpeechSynthesisVoice[], lang: Locale): SpeechSynthesisVoice | undefined {
  const exact = norm(BCP47[lang]);
  return (
    voices.find((v) => norm(v.lang) === exact) ??
    voices.find((v) => norm(v.lang) === lang || norm(v.lang).startsWith(`${lang}-`))
  );
}

/** The voice list is empty on first load in Chrome; wait briefly for `voiceschanged`. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, VOICE_WAIT_MS);
    synth.addEventListener("voiceschanged", done);
  });
}

type Status = "idle" | "loading" | "playing" | "paused";
type Engine = "native" | "gemini" | "gtts";

interface SmartReaderProps {
  /** Plain text to read. */
  text: string;
  /** Override the auto-detected language of `text`. */
  lang?: Locale;
  /** Smaller button for cards. */
  compact?: boolean;
  className?: string;
}

/**
 * Read-aloud control. Engine order:
 *  1. the browser's Speech Synthesis, when it has a voice for the language;
 *  2. server-side TTS (/api/tts, Gemini), which covers Georgian and Armenian;
 *  3. Google Translate TTS played straight from the browser, as a last resort when
 *     the server engine is unavailable (quota, not configured, network).
 * The main button toggles play / pause / resume; the square button stops.
 */
export function SmartReader({ text, lang, compact = false, className }: SmartReaderProps) {
  const t = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const run = useRef(0); // bumped on stop/restart so stale callbacks do nothing
  const engine = useRef<Engine | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  /** One element, unlocked by the click, reused for every chunk. */
  const player = useRef<HTMLAudioElement | null>(null);
  const objectUrls = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    run.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    audio.current?.pause();
    audio.current = null;
    player.current = null;
    objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.current = [];
    engine.current = null;
  }, []);

  const stop = useCallback(() => {
    cleanup();
    if (stopActive === stop) stopActive = null;
    setStatus("idle");
    setProgress(0);
  }, [cleanup]);

  // Stop speaking when the card/page goes away or the text changes.
  useEffect(() => stop, [stop, text]);

  const playNative = (chunks: string[], language: Locale, voices: SpeechSynthesisVoice[], token: number) => {
    const synth = window.speechSynthesis;
    const voice = findVoice(voices, language);
    const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
    let done = 0;
    engine.current = "native";

    const speak = (i: number) => {
      if (token !== run.current) return;
      if (i >= chunks.length) return stop();
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.lang = voice?.lang ?? BCP47[language];
      if (voice) u.voice = voice;
      u.onstart = () => token === run.current && setStatus("playing");
      u.onboundary = (e) => {
        if (token === run.current) setProgress((done + e.charIndex) / total);
      };
      u.onend = () => {
        done += chunks[i].length;
        if (token === run.current) setProgress(done / total);
        speak(i + 1);
      };
      u.onerror = (e) => {
        if (token !== run.current || e.error === "canceled" || e.error === "interrupted") return;
        // Native engine failed: continue with the server engines from the start.
        void playRemote(language, token);
      };
      synth.speak(u);
    };
    speak(0);
  };

  /** Plays audio pieces in order, prefetching the next. Resolves true if anything played. */
  const playPieces = async (
    count: number,
    urlFor: (i: number) => Promise<string>,
    token: number,
  ): Promise<{ finished: boolean; started: boolean }> => {
    let started = false;
    try {
      let next = urlFor(0);
      next.catch(() => {}); // a prefetch we abandon must not surface as an unhandled rejection
      for (let i = 0; i < count; i++) {
        const url = await next;
        if (token !== run.current) return { finished: false, started };
        if (i + 1 < count) {
          next = urlFor(i + 1);
          next.catch(() => {});
        }
        const el = player.current ?? new Audio();
        player.current = el;
        audio.current = el;
        el.src = url;
        await new Promise<void>((resolve, reject) => {
          el.ontimeupdate = () => {
            if (token === run.current && el.duration) setProgress((i + el.currentTime / el.duration) / count);
          };
          el.onplaying = () => {
            started = true;
            if (token === run.current) setStatus("playing");
          };
          el.onended = () => resolve();
          el.onerror = () => reject(new Error("audio"));
          el.play().catch(reject);
        });
        if (token !== run.current) return { finished: false, started };
      }
    } catch (e) {
      throw Object.assign(e instanceof Error ? e : new Error("audio"), { started });
    }
    return { finished: true, started };
  };

  const playRemote = async (language: Locale, token: number) => {
    if (token !== run.current) return;
    setStatus("loading");
    setProgress(0);
    const clean = text.replace(/\s+/g, " ").trim();

    // Engine 2: Gemini TTS through our API.
    engine.current = "gemini";
    const parts = chunkText(clean, SERVER_CHUNK).slice(0, SERVER_MAX_CHUNKS);
    try {
      const r = await playPieces(
        parts.length,
        async (i) => {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: parts[i], lang: language }),
          });
          if (!res.ok) throw new Error(String(res.status));
          const url = URL.createObjectURL(await res.blob());
          objectUrls.current.push(url);
          return url;
        },
        token,
      );
      if (token !== run.current) return;
      if (r.finished) return stop();
    } catch (e) {
      if (token !== run.current) return;
      // Audio that already started playing is not restarted on another engine.
      if ((e as { started?: boolean }).started) {
        setError(true);
        return stop();
      }
    }

    // Engine 3: Google Translate TTS, played directly by the browser.
    if (token !== run.current) return;
    engine.current = "gtts";
    setProgress(0);
    const small = chunkText(clean, GTTS_CHUNK).slice(0, GTTS_MAX_CHUNKS);
    try {
      await playPieces(
        small.length,
        async (i) =>
          `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(small[i])}`,
        token,
      );
      if (token === run.current) stop();
    } catch {
      if (token !== run.current) return;
      setError(true);
      stop();
    }
  };

  const start = async () => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    stopActive?.(); // silence any other reader first
    cleanup();
    stopActive = stop;
    setError(false);
    setProgress(0);
    setStatus("loading");

    // Unlock audio playback while we are still inside the user gesture.
    const el = new Audio(SILENT_WAV);
    player.current = el;
    void el.play().catch(() => {});

    const language = lang ?? detectLang(clean);
    const token = run.current;
    const voices = await loadVoices();
    if (token !== run.current) return;

    if (findVoice(voices, language)) {
      playNative(chunkText(clean, NATIVE_CHUNK), language, voices, token);
    } else {
      void playRemote(language, token);
    }
  };

  const togglePause = () => {
    if (status === "playing") {
      if (engine.current === "native") window.speechSynthesis.pause();
      else audio.current?.pause();
      setStatus("paused");
    } else if (status === "paused") {
      if (engine.current === "native") window.speechSynthesis.resume();
      else void audio.current?.play();
      setStatus("playing");
    }
  };

  const active = status !== "idle";
  const pct = Math.round(Math.min(1, progress) * 100);
  const size = compact ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";
  const round = compact ? "h-8 w-8" : "h-10 w-10";
  const ring =
    "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
  const icon = "h-4 w-4 shrink-0";

  // One clearly labelled main button: idle -> play, playing -> pause, paused -> resume.
  const main =
    status === "idle"
      ? { label: t("reader.listen"), Icon: Volume2, onClick: start, style: "bg-ink text-paper hover:bg-brand" }
      : status === "loading"
        ? { label: t("reader.loading"), Icon: Loader2, onClick: stop, style: "bg-ink text-paper opacity-80" }
        : status === "playing"
          ? { label: t("reader.pause"), Icon: Pause, onClick: togglePause, style: "bg-brand text-white hover:bg-ink" }
          : { label: t("reader.resume"), Icon: Play, onClick: togglePause, style: "bg-verdict-manip text-white hover:bg-ink" };

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)} role="group" aria-label={t("reader.group")}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={main.onClick}
          aria-busy={status === "loading"}
          aria-pressed={status === "playing"}
          title={main.label}
          className={cn(ring, size, "gap-1.5 font-medium", main.style)}
        >
          <main.Icon className={cn(icon, status === "loading" && "animate-spin")} aria-hidden />
          <span className={cn(compact && active && "sr-only")}>{main.label}</span>
        </button>
        {active && (
          <>
            <button
              type="button"
              onClick={stop}
              aria-label={t("reader.stop")}
              title={t("reader.stop")}
              className={cn(ring, round, "bg-ink text-paper hover:bg-brand")}
            >
              <Square className={icon} />
            </button>
            <div
              role="progressbar"
              aria-label={t("reader.progress")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-2 w-16 overflow-hidden rounded-full border border-ink bg-paper sm:w-32"
            >
              <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "loading" && t("reader.loading")}
        {status === "playing" && t("reader.playing")}
        {status === "paused" && t("reader.paused")}
      </span>
      {error && (
        <span role="alert" className="text-xs font-medium text-verdict-fakeink">
          {t("reader.unavailable")}
        </span>
      )}
    </div>
  );
}
