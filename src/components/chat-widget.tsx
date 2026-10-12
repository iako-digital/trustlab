"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const MAX_CHARS = 1000;
const MAX_HISTORY = 10; // the server accepts at most 12 messages

/** Floating assistant, bottom right. Conversation lives only in memory. */
export function ChatWidget() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-MAX_HISTORY) }),
      });
      const json = (await res.json().catch(() => ({}))) as { reply?: string; code?: string };
      if (res.ok && json.reply) {
        setMessages([...next, { role: "assistant", content: json.reply }]);
      } else {
        setError(
          json.code === "rate_limited"
            ? t("chat.rateLimited")
            : json.code === "not_configured"
              ? t("chat.notConfigured")
              : t("chat.error"),
        );
      }
    } catch {
      setError(t("chat.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          role="dialog"
          aria-label={t("chat.title")}
          className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-paper-line bg-paper-card shadow-card"
        >
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-paper">
            <div>
              <p className="text-sm font-semibold">{t("chat.title")}</p>
              <p className="text-[11px] opacity-80">{t("chat.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("chat.close")}
              className="rounded-full p-1.5 hover:bg-paper/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="rounded-2xl bg-paper px-3 py-2 text-sm text-ink-soft">{t("chat.welcome")}</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user" ? "bg-ink text-paper" : "bg-paper text-ink",
                  )}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {busy && <p className="text-xs text-ink-faint">{t("chat.thinking")}</p>}
            {error && (
              <p role="alert" className="text-xs text-verdict-fakeink">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-paper-line p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder={t("chat.placeholder")}
              aria-label={t("chat.placeholder")}
              className="h-10 min-w-0 flex-1 rounded-2xl border border-paper-line bg-paper-card px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t("chat.send")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("chat.close") : t("chat.open")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-ink text-paper shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
