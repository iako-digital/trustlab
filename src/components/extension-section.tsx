"use client";

import { useState } from "react";
import {
  Puzzle,
  ScanEye,
  ShieldCheck,
  Info,
  CircleCheck,
  CircleX,
  Download,
  Chrome,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";

const FEATURES = [
  { key: "feature1", icon: ScanEye },
  { key: "feature2", icon: ShieldCheck },
  { key: "feature3", icon: Info },
] as const;

export function ExtensionSection() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <section className="container py-8 sm:py-10">
      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-2">
          {/* Copy side */}
          <div className="p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-ink text-paper shadow-card glow-soft">
              <Puzzle className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {t("extension.eyebrow")}
            </p>
            <h2 className="mt-1.5 font-serif text-2xl font-semibold leading-snug text-ink">
              {t("extension.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
              {t("extension.subtitle")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {t("extension.description")}
            </p>

            <ul className="mt-5 flex flex-col gap-3.5">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-paper text-brand">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{t(`extension.${key}Title`)}</p>
                    <p className="text-sm leading-relaxed text-ink-soft">
                      {t(`extension.${key}Desc`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="brand" onClick={() => setOpen(true)}>
                <Download className="h-4 w-4" />
                {t("extension.install")}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
                <Chrome className="h-3.5 w-3.5" />
                {t("extension.comingSoon")}
              </span>
            </div>
          </div>

          {/* Mock preview side */}
          <div className="flex flex-col justify-center gap-4 border-t border-paper-line bg-paper p-6 sm:p-8 lg:border-l lg:border-t-0">
            <MockPost
              platform="Facebook"
              author={t("extension.mockFacebookUser")}
              verdict="true"
              label={t("extension.mockPostVerified")}
            />
            <MockPost
              platform="Telegram"
              author={t("extension.mockTelegramChannel")}
              verdict="fake"
              label={t("extension.mockPostFlagged")}
            />
          </div>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t("extension.modalTitle")}>
        <h3 className="pr-6 font-serif text-lg font-semibold text-ink">
          {t("extension.modalTitle")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("extension.modalBody")}</p>
        <Button variant="default" className="mt-5" onClick={() => setOpen(false)}>
          {t("extension.modalClose")}
        </Button>
      </Modal>
    </section>
  );
}

function MockPost({
  platform,
  author,
  verdict,
  label,
}: {
  platform: string;
  author: string;
  verdict: "true" | "fake";
  label: string;
}) {
  const good = verdict === "true";
  return (
    <div className="animate-fade-in relative rounded-card border border-paper-line bg-paper-card p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper font-mono text-[11px] font-semibold uppercase text-ink-faint">
          {platform[0]}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-ink">{author}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
            {platform}
          </p>
        </div>
      </div>
      <div className="mt-3 h-3 w-4/5 rounded-full bg-paper-line" />
      <div className="mt-2 h-3 w-3/5 rounded-full bg-paper-line" />

      <span
        className={
          "absolute -right-2 -top-2 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-card " +
          (good
            ? "border-verdict-true/40 bg-verdict-truebg text-verdict-true"
            : "border-verdict-fake/40 bg-verdict-fakebg text-verdict-fake")
        }
      >
        {good ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
        {label}
      </span>
    </div>
  );
}
