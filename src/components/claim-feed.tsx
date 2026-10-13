"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ClaimCard } from "@/components/claim-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, LOCALES, type Category, type Locale, type Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["fake", "manipulative", "true"];
const ALL = "all";

export function ClaimFeed() {
  const { locale, t } = useI18n();
  const { claims, ready } = useStore();

  const [lang, setLang] = useState<Locale | typeof ALL>(ALL);
  const [category, setCategory] = useState<Category | typeof ALL>(ALL);
  const [status, setStatus] = useState<Verdict | typeof ALL>(ALL);
  const [query, setQuery] = useState("");

  const published = useMemo(
    () => claims.filter((c) => c.status !== "pending"),
    [claims],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return published.filter((c) => {
      if (lang !== ALL && c.sourceLang !== lang) return false;
      if (category !== ALL && c.category !== category) return false;
      if (status !== ALL && c.status !== status) return false;
      if (q) {
        const hay = (c.title[locale] + " " + c.claim[locale]).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [published, lang, category, status, query, locale]);

  const hasFilters = lang !== ALL || category !== ALL || status !== ALL || query !== "";
  const clear = () => {
    setLang(ALL);
    setCategory(ALL);
    setStatus(ALL);
    setQuery("");
  };

  const countLabel = filtered.length === 1 ? "home.resultsOne" : "home.resultsOther";

  return (
    <div>
      {/* Filter toolbar */}
      <div className="rounded-2xl border border-paper-line bg-paper-card p-3 shadow-card transform transition-smooth hover:-translate-y-1">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("filter.search")}
              className="pl-9"
            />
          </div>
          <Select value={lang} onChange={(e) => setLang(e.target.value as Locale | typeof ALL)}>
            <option value={ALL}>{t("filter.language")}: {t("filter.all")}</option>
            {LOCALES.map((l) => (
              <option key={l} value={l}>{t(`common.language.${l}`)}</option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category | typeof ALL)}>
            <option value={ALL}>{t("filter.category")}: {t("filter.all")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`category.${c}`)}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as Verdict | typeof ALL)}>
            <option value={ALL}>{t("filter.status")}: {t("filter.all")}</option>
            {VERDICTS.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Result count + clear */}
      <div className="mb-4 mt-4 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-faint">
          {ready ? t(countLabel, { count: filtered.length }) : "…"}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear} className="text-ink-faint">
            <X className="h-3.5 w-3.5" />
            {t("home.clear")}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-paper-line bg-paper-card py-16 text-center text-ink-faint">
          {t("home.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ClaimCard key={c.id} claim={c} />
          ))}
        </div>
      )}
    </div>
  );
}
