"use client";

import { ClaimFeed } from "@/components/claim-feed";
import { VerdictBadge } from "@/components/verdict-badge";
import { QuizBanner } from "@/components/quiz-banner";
import { ExtensionSection } from "@/components/extension-section";
import { BotSection } from "@/components/bot-section";
import { useT } from "@/lib/i18n";

export default function HomePage() {
  const t = useT();
  return (
    <>
      {/* Hero — the thesis is the verdict system itself */}
      <section className="border-b border-paper-line">
        <div className="container py-12 sm:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge status="fake" />
            <VerdictBadge status="manipulative" />
            <VerdictBadge status="true" />
          </div>
          <h1 className="mt-5 max-w-3xl font-serif text-3xl font-semibold leading-[1.15] text-ink sm:text-[42px]">
            {t("home.title")}
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-soft sm:text-lg">
            {t("home.subtitle")}
          </p>
        </div>
      </section>

      <QuizBanner />

      <section className="container py-8 sm:py-10">
        <ClaimFeed />
      </section>

      <ExtensionSection />
      <BotSection />
    </>
  );
}
