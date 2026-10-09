"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VerdictBadge } from "@/components/verdict-badge";
import { useI18n } from "@/lib/i18n";
import { useStore, type PublishInput } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import type { Claim, Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["fake", "manipulative", "true"];

export function ClaimEditor({ claim }: { claim: Claim }) {
  const { locale, t } = useI18n();
  const { publishClaim, rejectClaim } = useStore();

  const [status, setStatus] = useState<Verdict | null>(null);
  const [titleKa, setTitleKa] = useState(claim.title.ka);
  const [titleHy, setTitleHy] = useState(claim.title.hy);
  const [titleEn, setTitleEn] = useState(claim.title.en);
  const [ka, setKa] = useState("");
  const [hy, setHy] = useState("");
  const [en, setEn] = useState("");
  const [sources, setSources] = useState("");
  const [error, setError] = useState(false);

  const publish = () => {
    if (!status) {
      setError(true);
      return;
    }
    const payload: PublishInput = {
      title: { ka: titleKa || claim.title.ka, hy: titleHy || claim.title.hy, en: titleEn || claim.title.en },
      status,
      explanation: { ka, hy, en },
      sources: sources
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      verifiedBy: t("admin.reviewedBy"),
    };
    publishClaim(claim.id, payload);
  };

  return (
    <div className="rounded-2xl border border-paper-line bg-paper-card shadow-card transform transition-smooth hover:-translate-y-1">
      {/* Submitted content */}
      <div className="border-b border-paper-line p-5">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          <span>
            {t(`category.${claim.category}`)} · {claim.sourceLang.toUpperCase()} ·{" "}
            {t(`submit.type${cap(claim.submissionType)}`)}
          </span>
          <span>{formatDate(claim.submittedAt, locale)}</span>
        </div>
        <h3 className="font-serif text-lg font-semibold text-ink">{claim.title[locale]}</h3>
        <p className="mt-1.5 text-sm text-ink-soft">{claim.claim[locale]}</p>
        {claim.sourceUrl && (
          <a
            href={claim.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block break-all text-xs text-brand underline"
          >
            {claim.sourceUrl}
          </a>
        )}
      </div>

      {/* Verdict + response */}
      <div className="space-y-4 p-5">
        <div>
          <Label>{t("admin.assignVerdict")}</Label>
          <div className="flex flex-wrap gap-2">
            {VERDICTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setStatus(v);
                  setError(false);
                }}
                className={cn(
                  "rounded-2xl border p-1.5 transition-all",
                  status === v ? "border-ink ring-1 ring-ink" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <VerdictBadge status={v} />
              </button>
            ))}
          </div>
          {error && <p className="mt-1 text-xs text-verdict-fake">{t("submit.required")}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <TitleField label="KA" value={titleKa} onChange={setTitleKa} />
          <TitleField label="HY" value={titleHy} onChange={setTitleHy} />
          <TitleField label="EN" value={titleEn} onChange={setTitleEn} />
        </div>

        <div>
          <Label>{t("admin.writeResponseKa")}</Label>
          <Textarea value={ka} onChange={(e) => setKa(e.target.value)} />
        </div>
        <div>
          <Label>{t("admin.writeResponseHy")}</Label>
          <Textarea value={hy} onChange={(e) => setHy(e.target.value)} />
        </div>
        <div>
          <Label>{t("admin.writeResponseEn")}</Label>
          <Textarea value={en} onChange={(e) => setEn(e.target.value)} />
        </div>
        <div>
          <Label>{t("admin.sourcesLabel")}</Label>
          <Textarea
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder={"https://…\nhttps://…"}
            className="min-h-[72px] font-mono text-xs"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button variant="ghost" size="sm" onClick={() => rejectClaim(claim.id)} className="text-verdict-fake">
            <Trash2 className="h-4 w-4" />
            {t("admin.reject")}
          </Button>
          <Button variant="brand" onClick={publish}>
            {t("admin.publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TitleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="font-mono text-[11px] tracking-widest text-ink-faint">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
