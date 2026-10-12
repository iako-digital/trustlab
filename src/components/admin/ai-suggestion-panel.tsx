"use client";

import { useState } from "react";
import { Ban, Check, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VerdictBadge } from "@/components/verdict-badge";
import { useI18n } from "@/lib/i18n";
import type { ActResult, SuggestionDecision } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { LOCALES, type AiSuggestion, type Claim, type Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["fake", "manipulative", "true"];

/**
 * AI proposal for a pending claim. The AI never publishes: Approve, Edit and
 * Reject are admin decisions, each written to audit_log by the server.
 */
export function AiSuggestionPanel({
  claim,
  suggestion,
  onDecide,
  onGenerate,
}: {
  claim: Claim;
  suggestion: AiSuggestion | undefined;
  onDecide: (id: string, body: SuggestionDecision) => Promise<ActResult>;
  onGenerate: (claimId: string) => Promise<ActResult>;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AiSuggestion | null>(null);

  const run = async (fn: () => Promise<ActResult>, onOk?: () => void) => {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (res.ok) return onOk?.();
    setError(
      res.code === "incomplete"
        ? t("admin.aiIncomplete")
        : res.code === "rate_limited"
          ? t("admin.aiRateLimited")
          : res.code === "not_configured"
            ? t("admin.aiNotConfigured")
            : t("admin.actionError"),
    );
  };

  if (!suggestion) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-line bg-paper px-5 py-3">
        <span className="flex items-center gap-2 text-sm text-ink-faint">
          <Sparkles className="h-4 w-4" />
          {t("admin.aiNone")}
        </span>
        <div className="flex items-center gap-3">
          {error && <span role="alert" className="text-xs text-verdict-fake">{error}</span>}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => run(() => onGenerate(claim.id))}>
            {busy ? t("admin.aiGenerating") : t("admin.aiGenerate")}
          </Button>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setDraft(structuredClone(suggestion));
    setEditing(true);
    setError(null);
  };

  const save = () =>
    draft &&
    run(
      () =>
        onDecide(suggestion.id, {
          decision: "edit",
          verdict: draft.suggestedVerdict,
          evidenceSummary: draft.evidenceSummary,
          translation: draft.translation,
        }),
      () => setEditing(false),
    );

  const setField = (kind: "title" | "explanation", l: (typeof LOCALES)[number], v: string) =>
    setDraft((d) =>
      d && { ...d, translation: { ...d.translation, [kind]: { ...d.translation[kind], [l]: v } } },
    );

  return (
    <section
      aria-label={t("admin.aiTitle")}
      className="space-y-3 border-b border-paper-line bg-paper px-5 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          <Sparkles className="h-4 w-4" />
          {t("admin.aiTitle")}
          {suggestion.edited && (
            <span className="rounded-full bg-paper-line px-2 py-0.5 text-[10px] normal-case tracking-normal">
              {t("admin.aiEdited")}
            </span>
          )}
        </h4>
        <span className="text-xs text-ink-faint">{t("admin.aiPending")}</span>
      </div>

      {editing && draft ? (
        <div className="space-y-3">
          <div>
            <Label>{t("admin.aiVerdict")}</Label>
            <div className="flex flex-wrap gap-2">
              {VERDICTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={draft.suggestedVerdict === v}
                  onClick={() => setDraft({ ...draft, suggestedVerdict: v })}
                  className={cn(
                    "rounded-2xl border p-1.5 transition-all",
                    draft.suggestedVerdict === v
                      ? "border-ink ring-1 ring-ink"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <VerdictBadge status={v} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>{t("admin.aiEvidence")}</Label>
            <Textarea
              value={draft.evidenceSummary}
              maxLength={5000}
              onChange={(e) => setDraft({ ...draft, evidenceSummary: e.target.value })}
            />
          </div>
          {LOCALES.map((l) => (
            <div key={l} className="space-y-1.5">
              <Label className="font-mono text-[11px] tracking-widest text-ink-faint">
                {l.toUpperCase()}
              </Label>
              <Input
                aria-label={`${l.toUpperCase()} title`}
                value={draft.translation.title[l]}
                maxLength={300}
                onChange={(e) => setField("title", l, e.target.value)}
              />
              <Textarea
                aria-label={`${l.toUpperCase()} explanation`}
                value={draft.translation.explanation[l]}
                onChange={(e) => setField("explanation", l, e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <div className="mb-1 text-xs text-ink-faint">{t("admin.aiVerdict")}</div>
            <VerdictBadge status={suggestion.suggestedVerdict} />
          </div>
          {suggestion.evidenceSummary && (
            <div>
              <div className="mb-1 text-xs text-ink-faint">{t("admin.aiEvidence")}</div>
              <p className="whitespace-pre-wrap text-ink-soft">{suggestion.evidenceSummary}</p>
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-xs text-ink-faint">{t("admin.aiTranslations")}</summary>
            <div className="mt-2 space-y-3">
              {LOCALES.map((l) => (
                <div key={l}>
                  <div className="font-mono text-[11px] tracking-widest text-ink-faint">{l.toUpperCase()}</div>
                  <div className="font-medium text-ink">{suggestion.translation.title[l]}</div>
                  <p className="whitespace-pre-wrap text-ink-soft">{suggestion.translation.explanation[l]}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-verdict-fake">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {editing ? (
          <>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(false)}>
              {t("admin.cancel")}
            </Button>
            <Button variant="brand" size="sm" disabled={busy} onClick={save}>
              {busy ? t("admin.aiBusy") : t("admin.aiSave")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-verdict-fake"
              onClick={() => run(() => onDecide(suggestion.id, { decision: "reject" }))}
            >
              <Ban className="h-4 w-4" />
              {t("admin.aiReject")}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={startEdit}>
                <Pencil className="h-4 w-4" />
                {t("admin.aiEdit")}
              </Button>
              <Button
                variant="brand"
                size="sm"
                disabled={busy}
                onClick={() => run(() => onDecide(suggestion.id, { decision: "approve" }))}
              >
                <Check className="h-4 w-4" />
                {t("admin.aiApprove")}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
