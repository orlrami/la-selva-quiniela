import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Accent = "gold" | "teal" | "green" | "danger" | "neutral";

interface StatCardProps {
  label: string;
  value: number;
  accent?: Accent;
  icon?: ReactNode;
  suffix?: ReactNode;
  helper?: string;
}

const iconBoxClasses: Record<Accent, string> = {
  gold: "text-[var(--accent-gold)] border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/12",
  teal: "text-[var(--accent-teal)] border-[var(--accent-teal)]/35 bg-[var(--accent-teal)]/12",
  green:
    "text-[var(--accent-green)] border-[var(--accent-green)]/35 bg-[var(--accent-green)]/12",
  danger:
    "text-[var(--accent-danger)] border-[var(--accent-danger)]/35 bg-[var(--accent-danger)]/12",
  neutral: "text-[var(--foreground)] border-white/15 bg-white/[0.06]",
};

const valueColor: Record<Accent, string> = {
  gold: "text-[var(--accent-gold)]",
  teal: "text-[var(--accent-teal)]",
  green: "text-[var(--accent-green)]",
  danger: "text-[var(--accent-danger)]",
  neutral: "text-[var(--foreground)]",
};

export function StatCard({
  label,
  value,
  accent = "neutral",
  icon,
  suffix,
  helper,
}: StatCardProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          {label}
        </p>
        {icon ? (
          <span
            className={cn(
              "grid size-9 place-items-center rounded-lg border",
              iconBoxClasses[accent],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-semibold leading-none tabular-nums",
            valueColor[accent],
          )}
        >
          {value}
        </span>
        {suffix ? (
          <span className="text-sm text-[var(--muted-foreground)]">{suffix}</span>
        ) : null}
      </div>
      {helper ? (
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">{helper}</p>
      ) : null}
    </div>
  );
}
