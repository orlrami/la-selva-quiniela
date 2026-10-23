import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent-gold)] text-[#121006] shadow-[0_16px_36px_rgba(235,187,78,0.25)] hover:bg-[var(--accent-gold-strong)] focus-visible:outline-[var(--accent-gold)]",
        secondary:
          "border border-white/12 bg-white/[0.07] text-[var(--foreground)] hover:border-white/22 hover:bg-white/[0.11] focus-visible:outline-[var(--accent-teal)]",
        ghost:
          "text-[var(--muted-foreground)] hover:bg-white/[0.07] hover:text-[var(--foreground)] focus-visible:outline-[var(--accent-teal)]",
        danger:
          "bg-[var(--accent-danger)] text-white hover:bg-[#ef6841] focus-visible:outline-[var(--accent-danger)]",
      },
      size: {
        sm: "min-h-10 px-3 text-xs",
        md: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-base",
        icon: "size-11 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };
