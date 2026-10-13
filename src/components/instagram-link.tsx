"use client";

import { Instagram } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const INSTAGRAM_URL = "https://www.instagram.com/trustlab._?psln=YmxhYjF0OTd3cDF1&utm_source=qr";

/** Icon link to the official TrustLab Instagram page (header and footer). */
export function InstagramLink({ className }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("social.instagram")}
      title={t("social.instagram")}
      className={cn(
        "inline-flex h-10 w-10 items-center sm:h-9 sm:w-9 justify-center rounded-full text-ink-soft transition-smooth hover:-translate-y-0.5 hover:bg-paper-tint hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      <Instagram className="h-[18px] w-[18px]" strokeWidth={2} />
    </a>
  );
}
