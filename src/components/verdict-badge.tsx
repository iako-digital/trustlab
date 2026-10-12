"use client";

import { CircleCheck, CircleSlash, TriangleAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { ClaimStatus } from "@/lib/types";

const STYLES: Record<
  ClaimStatus,
  { wrap: string; icon: typeof CircleCheck }
> = {
  fake: {
    wrap: "border-verdict-fake/40 bg-verdict-fakebg text-verdict-fakeink shadow-[0_8px_24px_rgba(239,68,68,0.14)]",
    icon: CircleSlash,
  },
  manipulative: {
    wrap: "border-verdict-manip/40 bg-verdict-manipbg text-verdict-manipink shadow-[0_8px_24px_rgba(217,119,6,0.14)]",
    icon: TriangleAlert,
  },
  true: {
    wrap: "border-verdict-true/40 bg-verdict-truebg text-verdict-trueink shadow-[0_8px_24px_rgba(16,185,129,0.16)]",
    icon: CircleCheck,
  },
  pending: {
    wrap: "border-verdict-pending/30 bg-verdict-pendingbg text-verdict-pending shadow-[0_8px_24px_rgba(71,85,105,0.10)]",
    icon: Clock,
  },
};

/**
 * The signature element: a verdict rendered as an editorial stamp —
 * ruled border, tinted field, uppercase letter-spaced label.
 */
export function VerdictBadge({
  status,
  size = "md",
  className,
}: {
  status: ClaimStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = useT();
  const { wrap, icon: Icon } = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border font-mono font-medium uppercase tracking-[0.10em] shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[12px]",
        wrap,
        "transition-smooth",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} strokeWidth={2.25} />
      {t(`status.${status}`)}
    </span>
  );
}
