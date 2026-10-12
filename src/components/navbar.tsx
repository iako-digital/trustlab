"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Navbar() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-gradient-to-b from-paper-card/95 to-paper/80 shadow-[0_1px_0_rgba(11,45,91,0.04),0_8px_24px_-18px_rgba(11,45,91,0.35)] backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="TrustLab" className="flex items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Logo />
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
