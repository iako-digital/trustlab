"use client";

import { useRef, useState, type FormEvent } from "react";
import { Languages, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import type { ActResult, ClaimFormValue } from "@/lib/admin-api";
import { CATEGORIES, LOCALES, type Claim, type Locale, type Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["fake", "manipulative", "true"];

function initial(claim?: Claim): ClaimFormValue {
  return {
    title: claim?.title ?? { ka: "", hy: "", en: "" },
    claim: claim?.claim ?? { ka: "", hy: "", en: "" },
    explanation: claim?.explanation ?? { ka: "", hy: "", en: "" },
    category: claim?.category ?? "society",
    sourceLang: claim?.sourceLang ?? "ka",
    sourceUrl: claim?.sourceUrl ?? "",
    sources: claim?.sources ?? [],
    tags: claim?.tags ?? [],
    coverImageUrl: claim?.coverImageUrl ?? "",
    verdict: claim && claim.status !== "pending" ? claim.status : null,
  };
}

/** Create / edit form for a claim. Used inside a modal on the admin dashboard. */
export function ClaimForm({
  claim,
  onSubmit,
  onCancel,
}: {
  /** Omit to create a new claim. */
  claim?: Claim;
  onSubmit: (v: ClaimFormValue) => Promise<ActResult>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [v, setV] = useState<ClaimFormValue>(() => initial(claim));
  const [sourcesText, setSourcesText] = useState((claim?.sources ?? []).join("\n"));
  const [tagsText, setTagsText] = useState((claim?.tags ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiBusy, setAiBusy] = useState<"translate" | "verify" | null>(null);
  const [aiNote, setAiNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [suggestion, setSuggestion] = useState<{ verdict: Verdict; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A published claim must keep a verdict; a pending one may be saved without.
  const published = claim !== undefined && claim.status !== "pending";

  const setLoc = (key: "title" | "claim" | "explanation", l: Locale, value: string) =>
    setV((p) => ({ ...p, [key]: { ...p[key], [l]: value } }));

  /** POSTs to an admin AI route. Never saves anything: results only fill the form. */
  async function callAi<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as T & { code?: string };
      if (res.ok) return j;
      setAiNote({
        ok: false,
        text: j.code === "not_configured" ? t("admin.aiNotConfigured") : res.status === 429 ? t("admin.aiTooMany") : t("admin.aiFailed"),
      });
    } catch {
      setAiNote({ ok: false, text: t("admin.aiFailed") });
    }
    return null;
  }

  const aiInput = () => ({
    from: v.sourceLang,
    title: v.title[v.sourceLang],
    claim: v.claim[v.sourceLang],
    explanation: v.explanation[v.sourceLang],
  });
  const aiReady = () => {
    const ok = v.title[v.sourceLang].trim() !== "" && v.claim[v.sourceLang].trim() !== "";
    if (!ok) setAiNote({ ok: false, text: t("admin.aiNeedSource", { lang: v.sourceLang.toUpperCase() }) });
    return ok;
  };

  const autoTranslate = async () => {
    if (aiBusy || !aiReady()) return;
    setAiBusy("translate");
    setAiNote(null);
    const j = await callAi<{ translations: Partial<Record<Locale, Record<"title" | "claim" | "explanation", string>>> }>(
      "/api/admin/translate",
      aiInput(),
    );
    if (j) {
      setV((p) => {
        const next = { ...p, title: { ...p.title }, claim: { ...p.claim }, explanation: { ...p.explanation } };
        for (const l of LOCALES) {
          const tr = j.translations[l];
          if (!tr || l === p.sourceLang) continue;
          next.title[l] = tr.title;
          next.claim[l] = tr.claim;
          next.explanation[l] = tr.explanation;
        }
        return next;
      });
      setAiNote({ ok: true, text: t("admin.translateDone") });
    }
    setAiBusy(null);
  };

  const verifyWithAi = async () => {
    if (aiBusy || !aiReady()) return;
    setAiBusy("verify");
    setAiNote(null);
    setSuggestion(null);
    const j = await callAi<{ verdict: Verdict; summary: string; tags: string[]; sources: string[] }>(
      "/api/admin/verify-agent",
      aiInput(),
    );
    if (j) {
      // Sources and tags are merged into the editable fields. The verdict is only
      // proposed: choosing it (and saving) is the human decision that publishes.
      setSourcesText((cur) => {
        const have = cur.split("\n").map((x) => x.trim()).filter(Boolean);
        return [...new Set([...have, ...j.sources])].slice(0, 20).join("\n");
      });
      setTagsText((cur) => {
        const have = cur.split(",").map((x) => x.trim()).filter(Boolean);
        return [...new Set([...have, ...j.tags])].slice(0, 10).join(", ");
      });
      setSuggestion({ verdict: j.verdict, summary: j.summary });
      setAiNote({ ok: true, text: t("admin.verifyDone", { count: j.sources.length }) });
    }
    setAiBusy(null);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const j = (await res.json().catch(() => ({}))) as { url?: string; code?: string };
      if (res.ok && j.url) setV((p) => ({ ...p, coverImageUrl: j.url! }));
      else setUploadError(j.code === "migration_missing" ? t("admin.migrationMissing") : t("admin.coverUploadFailed"));
    } catch {
      setUploadError(t("admin.coverUploadFailed"));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await onSubmit({
      ...v,
      sources: sourcesText.split("\n").map((x) => x.trim()).filter(Boolean),
      tags: tagsText.split(",").map((x) => x.trim()).filter(Boolean),
    });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.code === "invalid"
          ? t("admin.formInvalid")
          : res.code === "migration_missing"
            ? t("admin.migrationMissing")
            : t("admin.actionError"),
      );
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 pr-1">
      <h3 className="pr-6 font-serif text-lg font-semibold text-ink">
        {claim ? t("admin.editClaim") : t("admin.newClaim")}
      </h3>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="cf-verdict">{t("admin.assignVerdict")}</Label>
          <Select
            id="cf-verdict"
            value={v.verdict ?? ""}
            onChange={(e) => setV({ ...v, verdict: (e.target.value || null) as Verdict | null })}
          >
            {!published && <option value="">{t("admin.saveAsPending")}</option>}
            {VERDICTS.map((x) => (
              <option key={x} value={x}>
                {t(`status.${x}`)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cf-cat">{t("filter.category")}</Label>
          <Select
            id="cf-cat"
            value={v.category}
            onChange={(e) => setV({ ...v, category: e.target.value as ClaimFormValue["category"] })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cf-lang">{t("submit.language")}</Label>
          <Select
            id="cf-lang"
            value={v.sourceLang}
            onChange={(e) => setV({ ...v, sourceLang: e.target.value as Locale })}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-brand/40 bg-paper p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" size="sm" disabled={aiBusy !== null} onClick={autoTranslate}>
            <Languages className="h-4 w-4" />
            {aiBusy === "translate" ? t("admin.aiBusy") : t("admin.autoTranslate")}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={aiBusy !== null} onClick={verifyWithAi}>
            <Search className="h-4 w-4" />
            {aiBusy === "verify" ? t("admin.verifyBusy") : t("admin.verifyWithAi")}
          </Button>
        </div>
        <p className="text-[11px] leading-snug text-ink-faint">
          <Sparkles className="mr-1 inline h-3 w-3" />
          {t("admin.aiDraftNote", { lang: v.sourceLang.toUpperCase() })}
        </p>
        {aiNote && (
          <p
            role={aiNote.ok ? "status" : "alert"}
            className={aiNote.ok ? "text-xs text-verdict-trueink" : "text-xs text-verdict-fakeink"}
          >
            {aiNote.text}
          </p>
        )}
        {suggestion && (
          <div className="rounded-xl border border-paper-line bg-paper-card p-3 text-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
              {t("admin.aiSuggestedVerdict")}: <span className="font-semibold text-ink">{t(`status.${suggestion.verdict}`)}</span>
            </p>
            {suggestion.summary && (
              <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-ink-soft">
                {suggestion.summary}
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              disabled={v.verdict === suggestion.verdict}
              onClick={() => setV((p) => ({ ...p, verdict: suggestion.verdict }))}
            >
              {v.verdict === suggestion.verdict ? t("admin.aiVerdictApplied") : t("admin.aiApplyVerdict")}
            </Button>
          </div>
        )}
      </div>

      {LOCALES.map((l) => (
        <fieldset key={l} className="space-y-2 rounded-2xl border border-paper-line p-3">
          <legend className="px-1 font-mono text-[11px] tracking-widest text-ink-faint">
            {l.toUpperCase()}
          </legend>
          <Input
            aria-label={`${l.toUpperCase()} ${t("admin.fieldTitle")}`}
            placeholder={t("admin.fieldTitle")}
            value={v.title[l]}
            maxLength={300}
            required
            onChange={(e) => setLoc("title", l, e.target.value)}
          />
          <Textarea
            aria-label={`${l.toUpperCase()} ${t("admin.fieldClaim")}`}
            placeholder={t("admin.fieldClaim")}
            value={v.claim[l]}
            required
            onChange={(e) => setLoc("claim", l, e.target.value)}
          />
          <Textarea
            aria-label={`${l.toUpperCase()} ${t("admin.fieldExplanation")}`}
            placeholder={t("admin.fieldExplanation")}
            value={v.explanation[l]}
            onChange={(e) => setLoc("explanation", l, e.target.value)}
          />
        </fieldset>
      ))}

      <div>
        <Label htmlFor="cf-cover">{t("admin.coverImage")}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="cf-cover"
            type="url"
            placeholder={t("admin.coverImageUrl")}
            value={v.coverImageUrl}
            onChange={(e) => setV({ ...v, coverImageUrl: e.target.value })}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("admin.coverUpload")}
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="ghost"
            className="shrink-0"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? t("admin.coverUploading") : t("admin.coverUpload")}
          </Button>
        </div>
        {uploadError && (
          <p role="alert" className="mt-1 text-xs text-verdict-fakeink">
            {uploadError}
          </p>
        )}
        {v.coverImageUrl && (
          <div className="mt-2 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary remote URL */}
            <img
              src={v.coverImageUrl}
              alt=""
              className="h-24 w-40 rounded-xl border border-paper-line object-cover"
            />
            <Button type="button" variant="ghost" onClick={() => setV({ ...v, coverImageUrl: "" })}>
              {t("admin.coverRemove")}
            </Button>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="cf-url">{t("admin.fieldSourceUrl")}</Label>
        <Input
          id="cf-url"
          type="url"
          placeholder="https://…"
          value={v.sourceUrl}
          onChange={(e) => setV({ ...v, sourceUrl: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="cf-sources">{t("admin.sourcesLabel")}</Label>
        <Textarea
          id="cf-sources"
          value={sourcesText}
          onChange={(e) => setSourcesText(e.target.value)}
          placeholder={"https://…\nhttps://…"}
          className="min-h-[72px] font-mono text-xs"
        />
      </div>
      <div>
        <Label htmlFor="cf-tags">{t("admin.tags")}</Label>
        <Input
          id="cf-tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder={t("admin.tagsHelp")}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-verdict-fakeink">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          {t("admin.cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={busy}>
          {busy ? t("admin.aiBusy") : t("admin.save")}
        </Button>
      </div>
    </form>
  );
}
