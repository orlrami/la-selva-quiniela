import { Crown } from "lucide-react";

import { TeamFlag } from "@/components/teams/team-flag";
import type { KnockoutMatch } from "@/lib/predictions/data";
import { cn } from "@/lib/utils";

interface BracketMatchProps {
  match: KnockoutMatch;
}

interface SlotProps {
  team: KnockoutMatch["homeTeam"];
  isWinner: boolean;
  isUserPick: boolean;
}

function TeamSlot({ team, isWinner, isUserPick }: SlotProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-[var(--muted-foreground)]">
        Por confirmar
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-semibold transition",
        isWinner
          ? "border-[var(--accent-gold)]/55 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
          : isUserPick
            ? "border-[var(--accent-teal)]/35 bg-[var(--accent-teal)]/8 text-[var(--foreground)]"
            : "border-white/10 bg-white/[0.04] text-[var(--foreground)]",
      )}
    >
      <TeamFlag teamCode={team.code} teamName={team.name} size="sm" />
      <span className="truncate">{team.shortName}</span>
      {isWinner ? (
        <Crown className="ml-auto size-3.5 shrink-0" aria-hidden />
      ) : null}
    </div>
  );
}

export function BracketMatch({ match }: BracketMatchProps) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const homeIsWinner =
    match.winnerTeamId !== null && home !== null && home.id === match.winnerTeamId;
  const awayIsWinner =
    match.winnerTeamId !== null && away !== null && away.id === match.winnerTeamId;
  const homeIsPick =
    match.pickedWinnerTeamId !== null &&
    home !== null &&
    home.id === match.pickedWinnerTeamId;
  const awayIsPick =
    match.pickedWinnerTeamId !== null &&
    away !== null &&
    away.id === match.pickedWinnerTeamId;

  return (
    <article className="grid gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {match.bracketSlot}
        {match.finalScore ? (
          <span className="ml-2 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-[var(--foreground)] tabular-nums">
            {match.finalScore.homeScore}–{match.finalScore.awayScore}
          </span>
        ) : null}
      </p>
      <TeamSlot team={home} isWinner={homeIsWinner} isUserPick={homeIsPick} />
      <TeamSlot team={away} isWinner={awayIsWinner} isUserPick={awayIsPick} />
    </article>
  );
}
