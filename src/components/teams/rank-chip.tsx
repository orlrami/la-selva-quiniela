import { cn } from "@/lib/utils";

/**
 * Small "#9" pill showing a team's FIFA world ranking. Renders nothing when the
 * rank is unknown. `highlight` paints it gold to flag an upset (a lower-ranked
 * team beating a higher-ranked one).
 */
export function RankChip({
  rank,
  highlight = false,
  className,
}: {
  rank: number | null | undefined;
  highlight?: boolean;
  className?: string;
}) {
  if (rank == null) return null;
  return (
    <span
      title={`Ranking FIFA #${rank}`}
      className={cn(
        "inline-flex items-center rounded-[5px] border px-1 text-[9px] font-bold leading-[14px] tabular-nums",
        highlight
          ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
          : "border-white/12 bg-white/[0.05] text-[var(--muted-foreground)]",
        className,
      )}
    >
      #{rank}
    </span>
  );
}

/**
 * Returns which side pulled an upset (won despite a worse FIFA rank), or null.
 * Only meaningful once a match has a decided score.
 */
export function upsetSide(
  homeRank: number | null,
  awayRank: number | null,
  homeScore: number | null,
  awayScore: number | null,
): "home" | "away" | null {
  if (homeRank == null || awayRank == null) return null;
  if (homeScore == null || awayScore == null) return null;
  if (homeScore === awayScore) return null;
  const homeWon = homeScore > awayScore;
  // Higher rank number = weaker team. Upset when the weaker team wins.
  if (homeWon && homeRank > awayRank) return "home";
  if (!homeWon && awayRank > homeRank) return "away";
  return null;
}
