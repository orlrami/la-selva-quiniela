"use client";

import { useState } from "react";
import { ChevronRight, Crown, Lock, PencilLine } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { TeamFlag } from "@/components/teams/team-flag";
import { KnockoutPickCard } from "@/components/predictions/knockout-pick-card";
import type { LiveR32Match, LiveSlot } from "@/lib/predictions/live-bracket";
import type { KnockoutMatch } from "@/lib/predictions/data";
import { cn } from "@/lib/utils";

interface Props {
  live: LiveR32Match;
  ko: KnockoutMatch | null;
}

/** One decluttered slot row: a team (🔒 confirmed, 👑 advanced, muted if knocked
 *  out) or just the position label when no team yet. */
function SlotLine({ slot, isWinner, decided }: { slot: LiveSlot; isWinner?: boolean; decided?: boolean }) {
  if (slot.team) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs font-semibold",
          isWinner || (!decided && slot.locked) ? "text-[var(--accent-gold)]" : "text-[var(--muted-foreground)]",
        )}
      >
        {slot.locked && !decided ? <Lock className="size-3 shrink-0" aria-hidden /> : null}
        <TeamFlag teamCode={slot.team.code} teamName={slot.team.name} size="sm" />
        <span className="truncate">{slot.team.shortName}</span>
        {isWinner ? <Crown className="ml-auto size-3 shrink-0" aria-label="Avanza" /> : null}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
      <span className="truncate">{slot.label || "Por definir"}</span>
      {slot.candidates.length > 0 ? (
        <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--accent-teal)]">· en disputa</span>
      ) : null}
    </div>
  );
}

/** Read-only candidate list for a provisional slot, shown inside the sheet. */
function SlotCandidates({ slot }: { slot: LiveSlot }) {
  if (slot.locked && slot.team) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10 px-2.5 py-2 text-sm font-semibold text-[var(--accent-gold)]">
        <Lock className="size-3.5" aria-hidden />
        <TeamFlag teamCode={slot.team.code} teamName={slot.team.name} size="sm" />
        {slot.team.name}
      </div>
    );
  }
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-semibold text-[var(--foreground)]">
        {slot.label || "Por definir"}
        {slot.candidates.length > 0 ? <span className="text-[var(--accent-teal)]"> · en disputa</span> : null}
      </p>
      {slot.candidates.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)]">Por confirmar</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {slot.candidates.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-1 text-xs">
              <TeamFlag teamCode={t.code} teamName={t.name} size="sm" />
              {t.shortName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BracketMatchCard({ live, ko }: Props) {
  const [open, setOpen] = useState(false);
  const canPredict = !!(ko && ko.homeTeam && ko.awayTeam && !ko.isLocked);
  const hasPick = !!(ko?.prediction && ko.prediction.homeScore !== null && ko.prediction.awayScore !== null);

  const title = canPredict && ko?.homeTeam && ko?.awayTeam
    ? `${ko.homeTeam.shortName} vs ${ko.awayTeam.shortName}`
    : `${live.home.label} vs ${live.away.label}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "grid w-full gap-1.5 rounded-lg border p-2 text-left transition active:scale-[0.99]",
          canPredict
            ? "border-[var(--accent-teal)]/40 bg-[var(--accent-teal)]/[0.06] hover:border-[var(--accent-teal)]/60"
            : "border-white/10 bg-white/[0.04] hover:border-white/20",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            {live.bracketSlot}
          </span>
          {live.finalScore ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums text-[var(--foreground)]">
              {live.finalScore.home}–{live.finalScore.away}
              {live.decidedByPenalties ? (
                <span className="rounded bg-[var(--accent-teal)]/15 px-1 text-[8px] font-bold uppercase tracking-wide text-[var(--accent-teal)]">
                  pen
                </span>
              ) : null}
            </span>
          ) : canPredict ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent-teal)]">
              <PencilLine className="size-3" aria-hidden />
              {hasPick ? `${ko!.prediction!.homeScore}-${ko!.prediction!.awayScore}` : "Pronosticar"}
            </span>
          ) : (
            <ChevronRight className="size-3 text-[var(--muted-foreground)]" aria-hidden />
          )}
        </div>
        <SlotLine slot={live.home} isWinner={!!live.advancerTeamId && live.home.team?.id === live.advancerTeamId} decided={!!live.finalScore} />
        <SlotLine slot={live.away} isWinner={!!live.advancerTeamId && live.away.team?.id === live.advancerTeamId} decided={!!live.finalScore} />
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={canPredict ? "Deja tu marcador y el ganador." : "Este cruce aún no está confirmado."}
      >
        {canPredict && ko ? (
          <KnockoutPickCard match={ko} />
        ) : (
          <div className="grid gap-3">
            <SlotCandidates slot={live.home} />
            <SlotCandidates slot={live.away} />
            <p className="text-xs leading-5 text-[var(--muted-foreground)]">
              Podrás pronosticarlo en cuanto los dos equipos estén confirmados.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
