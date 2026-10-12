"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/types";

const BCP47: Record<Locale, string> = { ka: "ka-GE", hy: "hy-AM", en: "en-US" };
const NATIVE_CHUNK = 200; // Chrome silently stops long utterances; speak sentence-sized pieces.
const SERVER_CHUNK = 1000; // /api/tts accepts up to 1200 characters.
const SERVER_MAX_CHUNKS = 4;

/** The page can hold many readers; only one may speak at a time. */
let stopActive: (() => void) | null = null;

/** Georgian and Armenian have their own scripts; anything else is read as English. */
export function detectLang(text: string): Locale {
  let ka = 0;
  let hy = 0;
  let other = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if ((c >= 0x10a0 && c <= 0x10ff) || (c >= 0x1c90 && c <= 0x1cbf) || (c >= 0x2d00 && c <= 0x2d2f)) ka++;
    else if (c >= 0x0530 && c <= 0x058f) hy++;
    else if (/\p{L}/u.test(ch)) other++;
  }
  if (ka >= hy && ka > other / 2 && ka > 0) return "ka";
  if (hy > ka && hy > other / 2) return "hy";
  return "en";
}

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

function hasNativeVoice(lang: Locale): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const prefix = lang;
  return window.speechSynthesis
    .getVoices()
    .some((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
}

type Status = "idle" | "loading" | "playing" | "paused";

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
 * Read-aloud control for visually impaired users. Uses the browser's Web
 * Speech Synthesis when it has a voice for the text's language; otherwise
 * falls back to server-side TTS (/api/tts), which covers Georgian and Armenian
 * on devices that ship no voice for them.
 */
export function SmartReader({ text, lang, compact = false, className }: SmartReaderProps) {
  const t = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const run = useRef(0); // bumped on stop/restart so stale callbacks do nothing
  const engine = useRef<"native" | "audio" | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrls = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    run.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    audio.current?.pause();
    audio.current = null;
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

  const playNative = (chunks: string[], language: Locale, token: number) => {
    const synth = window.speechSynthesis;
    const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
    let done = 0;
    engine.current = "native";

    const speak = (i: number) => {
      if (token !== run.current) return;
      if (i >= chunks.length) return stop();
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.lang = BCP47[language];
      const voice = synth
        .getVoices()
        .find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(language));
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
        setError(true);
        stop();
      };
      synth.speak(u);
    };
    speak(0);
  };

  const playServer = async (chunks: string[], language: Locale, token: number) => {
    engine.current = "audio";
    setStatus("loading");
    const parts = chunks.slice(0, SERVER_MAX_CHUNKS);

    const fetchChunk = async (i: number): Promise<string> => {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parts[i], lang: language }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      objectUrls.current.push(url);
      return url;
    };

    try {
      let next = fetchChunk(0);
      for (let i = 0; i < parts.length; i++) {
        const url = await next;
        if (token !== run.current) return;
        if (i + 1 < parts.length) next = fetchChunk(i + 1); // prefetch while this one plays
        const el = new Audio(url);
        audio.current = el;
        await new Promise<void>((resolve, reject) => {
          el.ontimeupdate = () => {
            if (token === run.current && el.duration) setProgress((i + el.currentTime / el.duration) / parts.length);
          };
          el.onplaying = () => token === run.current && setStatus("playing");
          el.onended = () => resolve();
          el.onerror = () => reject(new Error("audio"));
          el.play().catch(reject);
        });
        if (token !== run.current) return;
      }
      stop();
    } catch {
      if (token !== run.current) return;
      setError(true);
      stop();
    }
  };

  const start = () => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    stopActive?.(); // silence any other reader first
    cleanup();
    stopActive = stop;
    setError(false);
    setProgress(0);

    const language = lang ?? detectLang(clean);
    const token = run.current;
    const speechOk = typeof window !== "undefined" && "speechSynthesis" in window;
    // English is assumed available even before the voice list has loaded.
    const native = speechOk && (hasNativeVoice(language) || (language === "en" && window.speechSynthesis.getVoices().length === 0));

    if (native) {
      setStatus("loading");
      playNative(chunkText(clean, NATIVE_CHUNK), language, token);
    } else {
      void playServer(chunkText(clean, SERVER_CHUNK), language, token);
    }
  };

  const togglePause = () => {
    if (status === "playing") {
      if (engine.current === "audio") audio.current?.pause();
      else window.speechSynthesis.pause();
      setStatus("paused");
    } else if (status === "paused") {
      if (engine.current === "audio") void audio.current?.play();
      else window.speechSynthesis.resume();
      setStatus("playing");
    }
  };

  // Some browsers load voices late; touching getVoices() early primes the list.
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const active = status !== "idle";
  const pct = Math.round(Math.min(1, progress) * 100);
  const btn =
    "inline-flex items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60";
  const size = compact ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";
  const round = compact ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)} role="group" aria-label={t("reader.group")}>
      <div className="flex items-center gap-2">
        {!active ? (
          <button type="button" onClick={start} className={cn(btn, size, "gap-1.5 font-medium")}>
            <span aria-hidden>🔊</span>
            <span>{t("reader.listen")}</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={togglePause}
              disabled={status === "loading"}
              aria-label={status === "paused" ? t("reader.resume") : t("reader.pause")}
              className={cn(btn, round)}
            >
              {status === "paused" ? <Play className="h-4 w-4" /> : status === "loading" ? <Volume2 className="h-4 w-4 animate-pulse" /> : <Pause className="h-4 w-4" />}
            </button>
            <button type="button" onClick={stop} aria-label={t("reader.stop")} className={cn(btn, round)}>
              <Square className="h-4 w-4" />
            </button>
            <div
              role="progressbar"
              aria-label={t("reader.progress")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-2 w-24 overflow-hidden rounded-full border border-ink bg-paper sm:w-32"
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
