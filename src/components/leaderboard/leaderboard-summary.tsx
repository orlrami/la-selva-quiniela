import { Avatar } from "@/components/ui/avatar";
import type { LeaderboardRow } from "@/lib/leaderboard/data";
import { leaderboardMessages } from "@/lib/leaderboard/messages";

interface LeaderboardSummaryProps {
  row: LeaderboardRow;
  totalMembers: number;
}

export function LeaderboardSummary({
  row,
  totalMembers,
}: LeaderboardSummaryProps) {
  return (
    <section
      aria-label={leaderboardMessages.summary.eyebrow}
      className="grid gap-4 rounded-xl border border-[var(--accent-gold)]/35 bg-gradient-to-br from-[rgba(231,189,84,0.10)] via-transparent to-transparent p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5"
    >
      <Avatar name={row.avatarName} color={row.avatarColor} size="lg" />
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">
          {leaderboardMessages.summary.eyebrow}
        </p>
        <p className="text-2xl font-semibold leading-tight sm:text-3xl">
          #{row.rank}{" "}
          <span className="text-base font-normal text-[var(--muted-foreground)]">
            {leaderboardMessages.summary.rankSuffix(totalMembers)}
          </span>
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {row.exactScores} {leaderboardMessages.row.exactShort} ·{" "}
          {row.correctOutcomes} {leaderboardMessages.row.correctShort} ·{" "}
          {row.missingPredictions} {leaderboardMessages.row.missingShort}
        </p>
      </div>
      <div className="grid text-right">
        <span className="text-4xl font-bold leading-none tabular-nums text-[var(--accent-gold)]">
          {row.points}
        </span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {leaderboardMessages.summary.points}
        </span>
      </div>
    </section>
  );
}
