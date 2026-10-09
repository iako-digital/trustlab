"use client";

import { SubmissionForm } from "@/components/submission-form";
import { useT } from "@/lib/i18n";

export default function SubmitPage() {
  const t = useT();
  return (
    <div className="container max-w-2xl py-10 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
        {t("submit.title")}
      </h1>
      <p className="mb-7 mt-3 text-ink-soft">{t("submit.subtitle")}</p>
      <SubmissionForm />
    </div>
  );
}
