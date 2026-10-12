"use client";

import Link from "next/link";
import { ArrowRight, FileText, Link2, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SmartReader } from "@/components/common/smart-reader";
import { VerdictBadge } from "@/components/verdict-badge";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import type { Claim } from "@/lib/types";

const TYPE_ICON = { link: Link2, text: FileText, image: ImageIcon };

export function ClaimCard({ claim }: { claim: Claim }) {
  const { locale, t } = useI18n();
  const TypeIcon = TYPE_ICON[claim.submissionType];

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-[0_2px_4px_rgba(15,27,45,0.06),0_16px_40px_-16px_rgba(15,27,45,0.22)]">
      {/* Case-file meta line */}
      <div className="flex items-center justify-between border-b border-paper-line px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5" />
          {t(`category.${claim.category}`)}
        </span>
        <span>{claim.sourceLang.toUpperCase()}</span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <VerdictBadge status={claim.status} className="mb-3 self-start" />
        <Link href={`/claim/${claim.id}`} className="block">
          <h3 className="font-serif text-lg font-semibold leading-snug text-ink group-hover:text-brand">
            {claim.title[locale]}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {claim.claim[locale]}
        </p>

        <SmartReader
          compact
          className="mt-3 self-start"
          text={`${t(`status.${claim.status}`)}. ${claim.title[locale]}. ${claim.claim[locale]}`}
        />

        <div className="mt-4 flex items-center justify-between border-t border-paper-line pt-3">
          <span className="font-mono text-[11px] text-ink-faint">
            {claim.verifiedAt
              ? t("card.verifiedOn", { date: formatDate(claim.verifiedAt, locale) })
              : formatDate(claim.submittedAt, locale)}
          </span>
          <Link
            href={`/claim/${claim.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:gap-1.5"
          >
            {t("card.readMore")}
            <ArrowRight className="h-3.5 w-3.5 transition-all" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
