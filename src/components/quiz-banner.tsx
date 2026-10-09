"use client";

import Link from "next/link";
import { ShieldQuestion, ArrowRight, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

export function QuizBanner() {
  const t = useT();
  return (
    <section className="container py-8 sm:py-10">
      <Link
        href="/quiz"
        className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-card border border-paper-line bg-gradient-to-br from-ink to-[#1c2c47] p-6 text-paper shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,27,45,0.06),0_20px_48px_-16px_rgba(15,27,45,0.35)] sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/30 blur-3xl transition-smooth group-hover:bg-brand/40"
          aria-hidden
        />
        <div className="relative flex items-start gap-4 sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-paper/10 text-paper backdrop-blur-sm">
            <ShieldQuestion className="h-6 w-6" strokeWidth={2} />
          </span>
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60">
              <Sparkles className="h-3 w-3" />
              {t("quizBanner.eyebrow")}
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold leading-snug sm:text-2xl">
              {t("quizBanner.title")}
            </h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-paper/75">
              {t("quizBanner.subtitle")}
            </p>
          </div>
        </div>
        <span className="relative inline-flex shrink-0 items-center gap-2 rounded-2xl bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-smooth group-hover:gap-3">
          {t("quizBanner.cta")}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
