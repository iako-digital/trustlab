"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { VerdictBadge } from "@/components/verdict-badge";
import { LOCALES, type Claim, type ClaimStatus, type Locale, type Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["fake", "manipulative", "true"];

export function Analytics({ claims: all }: { claims: Claim[] }) {
  const { t } = useI18n();
  // Rejected submissions are not part of the published/queue statistics.
  const claims = all.filter((c) => c.state !== "rejected");

  const published = claims.filter((c) => c.status !== "pending");
  const pending = claims.filter((c) => c.status === "pending");

  const byStatus = (s: ClaimStatus) => claims.filter((c) => c.status === s).length;
  const byLang = (l: Locale) => published.filter((c) => c.sourceLang === l).length;
  const maxLang = Math.max(1, ...LOCALES.map(byLang));

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5 text-verdict-true" />}
        value={published.length}
        label={t("admin.statTotal")}
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-verdict-pending" />}
        value={pending.length}
        label={t("admin.statPending")}
      />
      <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card transform transition-smooth hover:-translate-y-1">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          {t("admin.statByStatus")}
        </p>
        <div className="space-y-2">
          {VERDICTS.map((s) => (
            <div key={s} className="flex items-center justify-between">
              <VerdictBadge status={s} size="sm" />
              <span className="font-serif text-lg font-semibold text-ink">{byStatus(s)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card lg:col-span-3 transform transition-smooth hover:-translate-y-1">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          {t("admin.statByLanguage")}
        </p>
        <div className="space-y-3">
          {LOCALES.map((l) => (
            <div key={l} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-ink-soft">{t(`common.language.${l}`)}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(byLang(l) / maxLang) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-sm text-ink">{byLang(l)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card transform transition-smooth hover:-translate-y-1">
      <div className="mb-2 flex items-center gap-2">{icon}</div>
      <p className="font-serif text-4xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
