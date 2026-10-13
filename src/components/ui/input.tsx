import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-2xl border border-paper-line bg-paper-card px-3 py-2 text-base text-ink sm:text-sm placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 transform transition-smooth hover:-translate-y-0.5 active:scale-98",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
