"use client";

import { QuizApp } from "@/components/quiz-app";
import { useT } from "@/lib/i18n";

export default function QuizPage() {
  const t = useT();
  return (
    <>
      <section className="border-b border-paper-line">
        <div className="container py-10 text-center sm:py-14">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brand">
            {t("quiz.metaTitle")}
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-semibold leading-[1.15] text-ink sm:text-[38px]">
            {t("quiz.title")}
          </h1>
        </div>
      </section>
      <section className="container py-10 sm:py-14">
        <QuizApp />
      </section>
    </>
  );
}
