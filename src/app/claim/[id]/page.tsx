"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { VerdictBadge } from "@/components/verdict-badge";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const { locale, t } = useI18n();
  const { claims, ready } = useStore();

  const claim = claims.find((c) => c.id === params.id);

  if (!ready) {
    return <div className="container py-16 text-center text-ink-faint">…</div>;
  }

  if (!claim) {
    return (
      <div className="container max-w-2xl py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-brand">
          <ArrowLeft className="h-4 w-4" />
          {t("detail.back")}
        </Link>
        <p className="mt-6 text-ink-soft">{t("detail.notFound")}</p>
      </div>
    );
  }

  return (
    <article className="container max-w-3xl py-8 sm:py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-brand hover:gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t("detail.back")}
      </Link>

      {/* Case-file meta */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        <span>{t(`category.${claim.category}`)}</span>
        <span aria-hidden>·</span>
        <span>{claim.sourceLang.toUpperCase()}</span>
        {claim.verifiedAt && (
          <>
            <span aria-hidden>·</span>
            <span>{t("card.verifiedOn", { date: formatDate(claim.verifiedAt, locale) })}</span>
          </>
        )}
      </div>

      <div className="mt-4">
        <VerdictBadge status={claim.status} />
      </div>
      <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
        {claim.title[locale]}
      </h1>

      {/* The claim */}
      <section className="mt-8">
        <SectionLabel>{t("detail.theClaim")}</SectionLabel>
        <blockquote className="border-l-2 border-verdict-manip/50 bg-verdict-manipbg/50 py-3 pl-4 pr-3 text-lg leading-relaxed text-ink">
          {claim.claim[locale]}
        </blockquote>
        {claim.sourceUrl && (
          <a
            href={claim.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 break-all text-sm text-brand underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {t("detail.originalLink")}
          </a>
        )}
      </section>

      {/* Verdict + explanation */}
      {claim.status !== "pending" && (
        <section className="mt-8">
          <SectionLabel>{t("detail.explanation")}</SectionLabel>
          <div className="prose-editorial space-y-4 text-[17px] leading-[1.7] text-ink-soft">
            {(claim.explanation[locale] || claim.explanation[claim.sourceLang] || "")
              .split("\n")
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        </section>
      )}

      {/* Sources */}
      {claim.sources.length > 0 && (
        <section className="mt-8">
          <SectionLabel>{t("detail.sources")}</SectionLabel>
          <ul className="space-y-2">
            {claim.sources.map((src, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-brand underline"
                >
                  {src}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {claim.verifiedBy && (
        <p className="mt-10 border-t border-paper-line pt-5 font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
          {t("detail.verifiedBy", { name: claim.verifiedBy })}
        </p>
      )}
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
      {children}
    </h2>
  );
}
