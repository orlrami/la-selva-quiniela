"use client";

import { useSyncExternalStore } from "react";
import { ClipboardCheck, Crown, Lock } from "lucide-react";

import { predictionMessages } from "@/lib/predictions/messages";
import { cn } from "@/lib/utils";

export type PredictionPhase = "groups" | "knockout";

interface PhaseTabsProps {
  active: PredictionPhase;
  onChange: (phase: PredictionPhase) => void;
  knockoutTotals: { completed: number; total: number };
  groupTotals: { completed: number; total: number };
  knockoutOpensAt: string;
}

function useNow() {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 1000);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => Date.now(),
  );
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function PhaseTabs({
  active,
  onChange,
  knockoutTotals,
  groupTotals,
  knockoutOpensAt,
}: PhaseTabsProps) {
  const now = useNow();
  const opensAt = new Date(knockoutOpensAt).getTime();
  const isKnockoutLocked = now < opensAt;
  const remaining = opensAt - now;

  return (
    <div
      role="tablist"
      aria-label="Fases del torneo"
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === "groups"}
        onClick={() => onChange("groups")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
          active === "groups"
            ? "border-[var(--accent-teal)]/40 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]"
            : "border-white/12 bg-white/[0.04] text-[var(--muted-foreground)] hover:border-white/22 hover:text-[var(--foreground)]",
        )}
      >
        <ClipboardCheck className="size-4" aria-hidden />
        {predictionMessages.phase.groups}
        <span className="ml-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold tabular-nums">
          {groupTotals.completed}/{groupTotals.total}
        </span>
      </button>

      {isKnockoutLocked ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)]">
          <Lock className="size-4" aria-hidden />
          {predictionMessages.phase.knockout}
          <span className="ml-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold tabular-nums">
            {formatCountdown(remaining)}
          </span>
        </div>
      ) : (
        <button
          type="button"
          role="tab"
          aria-selected={active === "knockout"}
          onClick={() => onChange("knockout")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
            active === "knockout"
              ? "border-[var(--accent-gold)]/45 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
              : "border-white/12 bg-white/[0.04] text-[var(--muted-foreground)] hover:border-white/22 hover:text-[var(--foreground)]",
          )}
        >
          <Crown className="size-4" aria-hidden />
          {predictionMessages.phase.knockout}
          <span className="ml-1 animate-pulse rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Live
          </span>
          <span className="ml-0.5 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold tabular-nums">
            {knockoutTotals.completed}/{knockoutTotals.total}
          </span>
        </button>
      )}
    </div>
  );
}
