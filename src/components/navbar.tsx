"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FacebookLink } from "@/components/facebook-link";
import { InstagramLink } from "@/components/instagram-link";

const LINK =
  "rounded-2xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-card hover:-translate-y-0.5 transition-smooth sm:py-2";

export function Navbar() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-gradient-to-b from-paper-card/95 to-paper/80 shadow-[0_1px_0_rgba(11,45,91,0.04),0_8px_24px_-18px_rgba(11,45,91,0.35)] backdrop-blur-md">
      {/* Phones: logo + socials/language on row 1, page links on row 2. sm+: one row. */}
      <div className="container flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link
          href="/"
          aria-label="TrustLab"
          className="flex min-w-0 items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Logo />
        </Link>
        <nav
          aria-label="Main"
          className="order-3 flex w-full items-center justify-center gap-1 border-t border-paper-line/70 pt-1 sm:order-2 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0"
        >
          <Link href="/" className={`${LINK} sm:inline-block`}>
            {t("nav.home")}
          </Link>
          <Link href="/quiz" className={LINK}>
            {t("nav.quiz")}
          </Link>
          <Link href="/submit" className={LINK}>
            {t("nav.submit")}
          </Link>
        </nav>
        <div className="order-2 flex shrink-0 items-center gap-0.5 sm:order-3 sm:gap-1">
          <FacebookLink />
          <InstagramLink />
          <div className="ml-1">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
