import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-card text-sm font-medium transform transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-brand hover:-translate-y-0.5 shadow-card active:scale-95",
        brand: "bg-brand text-white hover:bg-brand-navy hover:scale-105 active:scale-95 btn-primary-glow",
        outline: "border border-ink/25 bg-paper-card text-ink hover:border-brand hover:bg-paper-tint",
        ghost: "text-ink hover:bg-paper-tint",
        danger: "bg-verdict-fake text-white hover:bg-verdict-fake/90",
        subtle: "bg-paper text-ink-soft hover:bg-paper-line/60",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
