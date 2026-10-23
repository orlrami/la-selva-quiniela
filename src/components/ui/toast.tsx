import * as React from "react";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "info" | "success" | "warning";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  info: "border-[var(--accent-teal)]/35 bg-[var(--accent-teal)]/10 text-[var(--foreground)]",
  success: "border-[var(--accent-green)]/35 bg-[var(--accent-green)]/10 text-[var(--foreground)]",
  warning: "border-[var(--accent-danger)]/35 bg-[var(--accent-danger)]/10 text-[var(--foreground)]",
};

const variantIcons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export function Toast({
  title,
  description,
  variant = "info",
  className,
  ...props
}: ToastProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-16 items-start gap-3 rounded-xl border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="grid gap-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="text-sm leading-5 text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
