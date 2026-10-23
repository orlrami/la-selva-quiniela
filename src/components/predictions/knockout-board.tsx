"use client";

import type { KnockoutBoardData } from "@/lib/predictions/data";

import { KnockoutPickCard } from "./knockout-pick-card";

interface KnockoutBoardProps {
  data: KnockoutBoardData;
}

export function KnockoutBoard({ data }: KnockoutBoardProps) {
  const hasAny = data.rounds.some((r) => r.total > 0);
  if (!hasAny) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted-foreground)]">
        Las eliminatorias se activarán cuando termine la fase de grupos.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {data.rounds.map((round) => (
        <section
          key={round.stage}
          aria-label={round.label}
          className="grid gap-3"
        >
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              {round.label}
            </h3>
            <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)] tabular-nums">
              {round.completed}/{round.total} listos
            </span>
          </header>
          <div className="grid gap-3">
            {round.matches.map((match) => (
              <KnockoutPickCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
