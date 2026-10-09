"use client";

import { useState } from "react";
import { CheckCircle2, Link2, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, LOCALES, type Category, type Locale, type SubmissionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { key: SubmissionType; icon: typeof Link2; label: string }[] = [
  { key: "link", icon: Link2, label: "submit.typeLink" },
  { key: "text", icon: FileText, label: "submit.typeText" },
  { key: "image", icon: ImageIcon, label: "submit.typeImage" },
];

export function SubmissionForm() {
  const { locale, t } = useI18n();
  const { addSubmission } = useStore();

  const [type, setType] = useState<SubmissionType>("link");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Category>("society");
  const [sourceLang, setSourceLang] = useState<Locale>(locale);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const titleMissing = touched && !title.trim();
  const contentMissing = touched && type !== "image" && !content.trim();
  const urlMissing = touched && (type === "link" || type === "image") && !url.trim();

  const submit = () => {
    setTouched(true);
    if (!title.trim()) return;
    if (type !== "image" && !content.trim()) return;
    if ((type === "link" || type === "image") && !url.trim()) return;

    addSubmission({
      title: title.trim(),
      claim: content.trim() || title.trim(),
      category,
      sourceLang,
      submissionType: type,
      sourceUrl: url.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setDone(true);
  };

  const reset = () => {
    setType("link");
    setTitle("");
    setContent("");
    setUrl("");
    setCategory("society");
    setSourceLang(locale);
    setNotes("");
    setTouched(false);
    setDone(false);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-verdict-true/30 bg-verdict-truebg p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-verdict-true" />
        <h2 className="font-serif text-xl font-semibold text-ink">{t("submit.successTitle")}</h2>
        <p className="mx-auto mt-2 max-w-prose text-sm text-ink-soft">{t("submit.successBody")}</p>
        <Button onClick={reset} variant="outline" className="mt-5">
          {t("submit.another")}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card sm:p-7 transform transition-smooth hover:-translate-y-1">
      {/* Type selector */}
      <Label>{t("submit.type")}</Label>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {TYPES.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            aria-pressed={type === key}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors",
              type === key
                ? "border-brand bg-brand/5 text-brand"
                : "border-paper-line text-ink-soft hover:bg-paper",
            )}
          >
            <Icon className="h-5 w-5" />
            {t(label)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">{t("submit.claimTitle")}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("submit.claimTitlePlaceholder")}
            aria-invalid={titleMissing}
            className={titleMissing ? "border-verdict-fake" : ""}
          />
          {titleMissing && <FieldError>{t("submit.required")}</FieldError>}
        </div>

        {(type === "link" || type === "image") && (
          <div>
            <Label htmlFor="url">{type === "image" ? t("submit.imageUrl") : t("submit.contentLink")}</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
              aria-invalid={urlMissing}
              className={urlMissing ? "border-verdict-fake" : ""}
            />
            {urlMissing && <FieldError>{t("submit.required")}</FieldError>}
          </div>
        )}

        {type !== "image" && (
          <div>
            <Label htmlFor="content">
              {type === "link" ? t("submit.claimTitle") : t("submit.contentText")}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("submit.contentText")}
              aria-invalid={contentMissing}
              className={contentMissing ? "border-verdict-fake" : ""}
            />
            {contentMissing && <FieldError>{t("submit.required")}</FieldError>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">{t("submit.category")}</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`category.${c}`)}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="lang">{t("submit.language")}</Label>
            <Select id="lang" value={sourceLang} onChange={(e) => setSourceLang(e.target.value as Locale)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>{t(`common.language.${l}`)}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">{t("submit.notes")}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("submit.notesPlaceholder")}
            className="min-h-[72px]"
          />
        </div>

        <Button onClick={submit} variant="brand" size="lg" className="w-full">
          {t("submit.send")}
        </Button>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-verdict-fake">{children}</p>;
}
