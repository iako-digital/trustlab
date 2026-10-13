"use client";

import { Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { TELEGRAM_URL } from "@/lib/social";
import { cn } from "@/lib/utils";

/** Icon link to the TrustLab Telegram fact-checking bot (header and footer). */
export function TelegramLink({ className }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("social.telegram")}
      title={t("social.telegram")}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-smooth hover:-translate-y-0.5 hover:bg-paper-tint hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:h-9 sm:w-9",
        className,
      )}
    >
      <Send className="h-[18px] w-[18px]" strokeWidth={2} />
    </a>
  );
}
