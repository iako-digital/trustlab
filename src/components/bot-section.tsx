"use client";

import { useState } from "react";
import { Bot, Send, MessageCircle, ShieldCheck, ThumbsUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/** Bot username without "@" (matches the handle shown in the card). */
const TELEGRAM_BOT = (process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "TrustLabBot").replace(/^@/, "");
const TELEGRAM_URL = `https://t.me/${TELEGRAM_BOT}`;
/** International format, digits only (e.g. 995555123456). Unset until a real number exists. */
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
const WHATSAPP_URL = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : null;

const STEPS = [
  { key: "step1", icon: Send },
  { key: "step2", icon: ShieldCheck },
  { key: "step3", icon: ThumbsUp },
] as const;

const WHATSAPP_CLASS =
  "inline-flex items-center gap-2 rounded-card bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-smooth hover:-translate-y-0.5 hover:bg-[#20bd5a] active:scale-95";

export function BotSection() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <section className="container py-8 sm:py-10">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-ink text-paper shadow-card glow-soft">
              <Bot className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                {t("bot.eyebrow")}
              </p>
              <h2 className="mt-1.5 font-serif text-2xl font-semibold leading-snug text-ink">
                {t("bot.title")}
              </h2>
            </div>
          </div>
          <span className="rounded-2xl border border-paper-line bg-paper px-3 py-1.5 font-mono text-xs text-ink-soft">
            {t("bot.handle")}
          </span>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          {t("bot.subtitle")}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {t("bot.description")}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ key, icon: Icon }, i) => (
            <div
              key={key}
              className="relative rounded-card border border-paper-line bg-paper p-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-card text-brand shadow-card">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-medium text-ink">{t(`bot.${key}Title`)}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t(`bot.${key}Desc`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {WHATSAPP_URL ? (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={WHATSAPP_CLASS}
            >
              <MessageCircle className="h-4 w-4" />
              {t("bot.whatsappCta")}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            // No WhatsApp number configured yet: explain instead of linking nowhere.
            <button onClick={() => setOpen(true)} className={WHATSAPP_CLASS}>
              <MessageCircle className="h-4 w-4" />
              {t("bot.whatsappCta")}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-card bg-[#229ED9] px-4 py-2.5 text-sm font-medium text-white transition-smooth hover:-translate-y-0.5 hover:bg-[#1e8ec2] active:scale-95"
          >
            <Send className="h-4 w-4" />
            {t("bot.telegramCta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t("bot.modalTitle")}>
        <h3 className="pr-6 font-serif text-lg font-semibold text-ink">{t("bot.modalTitle")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("bot.modalBody")}</p>
        <Button variant="default" className="mt-5" onClick={() => setOpen(false)}>
          {t("bot.modalClose")}
        </Button>
      </Modal>
    </section>
  );
}
