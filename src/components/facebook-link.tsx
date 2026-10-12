"use client";

import { Facebook } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61595182117272";

/** Icon link to the official TrustLab Facebook page (header and footer). */
export function FacebookLink({ className }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={FACEBOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("social.facebook")}
      title={t("social.facebook")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-smooth hover:-translate-y-0.5 hover:bg-paper-tint hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      <Facebook className="h-[18px] w-[18px]" strokeWidth={2} />
    </a>
  );
}
