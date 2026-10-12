import { useId } from "react";
import { cn } from "@/lib/utils";

/** The TrustLab shield-and-magnifier mark. Same artwork as public/logo-mark.svg. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  const shield = `${id}-shield`;
  const inner = `${id}-inner`;
  return (
    <svg viewBox="0 0 100 120" aria-hidden className={cn("h-9 w-auto shrink-0", className)}>
      <defs>
        <linearGradient id={shield} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DB4FF" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id={inner} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6F1FF" />
          <stop offset="1" stopColor="#A9CCFF" />
        </linearGradient>
      </defs>
      <path d="M50 3 91 18v40c0 26-20 45-41 59C29 103 9 84 9 58V18z" fill="#0B2D5B" />
      <path d="M50 10 84 22.5V58c0 22-17 38-34 50C33 96 16 80 16 58V22.5z" fill={`url(#${shield})`} />
      <path d="M50 18 77 28v30c0 17-13 31-27 41C36 89 23 75 23 58V28z" fill={`url(#${inner})`} />
      <path d="M71 70 87 87" stroke="#0B2D5B" strokeWidth="13" strokeLinecap="round" />
      <path d="M71 70 87 87" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
      <circle cx="54" cy="52" r="25" fill="#F4F9FF" stroke="#0B2D5B" strokeWidth="6" />
      <path d="M41 51 51 61 67 44" fill="none" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="41" cy="51" r="4" fill="#10B981" />
      <circle cx="51" cy="61" r="4" fill="#10B981" />
      <circle cx="67" cy="44" r="4" fill="#10B981" />
    </svg>
  );
}

/** Mark + two-tone wordmark. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="font-sans text-[19px] font-extrabold leading-none tracking-tight">
        <span className="text-brand-navy">Trust</span>
        <span className="text-accent">Lab</span>
      </span>
    </span>
  );
}
