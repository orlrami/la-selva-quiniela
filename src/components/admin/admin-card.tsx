import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  accent?: "gold" | "teal" | "neutral";
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const accentClasses = {
  gold: "border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]",
  teal: "border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]",
  neutral: "border-white/12 bg-white/[0.05] text-[var(--foreground)]",
} as const;

export function AdminCard({
  title,
  description,
  icon,
  accent = "neutral",
  action,
  children,
  className,
}: AdminCardProps) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon ? (
            <span
              className={cn(
                "grid size-10 place-items-center rounded-lg border",
                accentClasses[accent],
              )}
            >
              {icon}
            </span>
          ) : null}
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
