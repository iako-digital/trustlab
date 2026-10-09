"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Navbar() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-gradient-to-b from-paper/90 to-paper/75 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-ink text-paper shadow-card glow-soft">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-sans text-[17px] font-semibold text-ink">
              TrustLab
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-card hover:-translate-y-0.5 transition-smooth sm:inline-block"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/quiz"
            className="rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-card hover:-translate-y-0.5 transition-smooth"
          >
            {t("nav.quiz")}
          </Link>
          <Link
            href="/submit"
            className="rounded-2xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-card hover:-translate-y-0.5 transition-smooth"
          >
            {t("nav.submit")}
          </Link>
          <div className="ml-1">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
