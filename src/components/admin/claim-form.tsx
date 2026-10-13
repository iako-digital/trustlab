"use client";

import { useRef, useState, type FormEvent } from "react";
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
  const [error, setError] = useState<string | null>(null);

  // A published claim must keep a verdict; a pending one may be saved without.
  const published = claim !== undefined && claim.status !== "pending";

  const setLoc = (key: "title" | "claim" | "explanation", l: Locale, value: string) =>
    setV((p) => ({ ...p, [key]: { ...p[key], [l]: value } }));

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
