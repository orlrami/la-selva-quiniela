"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface ScoreStepperProps {
  value: number | null;
  onChange: (next: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}

const MAX_SCORE = 20;

export function ScoreStepper({
  value,
  onChange,
  disabled = false,
  ariaLabel,
}: ScoreStepperProps) {
  const current = value ?? 0;
  const decrementDisabled = disabled || current <= 0;
  const incrementDisabled = disabled || current >= MAX_SCORE;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] p-1",
        disabled && "opacity-60",
      )}
    >
      <button
        type="button"
        disabled={decrementDisabled}
        onClick={() => onChange(Math.max(0, current - 1))}
        aria-label={`Restar a ${ariaLabel}`}
        className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-white/[0.08] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "min-w-10 text-center text-2xl font-bold leading-none tabular-nums",
          value === null && "text-[var(--muted-foreground)]",
        )}
      >
        {value === null ? "—" : value}
      </span>
      <button
        type="button"
        disabled={incrementDisabled}
        onClick={() => onChange(current + 1)}
        aria-label={`Sumar a ${ariaLabel}`}
        className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-white/[0.08] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
