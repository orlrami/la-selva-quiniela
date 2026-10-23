import { Crown } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { LeaderboardRow as LeaderboardRowData } from "@/lib/leaderboard/data";
import { leaderboardMessages } from "@/lib/leaderboard/messages";
import { cn } from "@/lib/utils";

interface LeaderboardRowProps {
  row: LeaderboardRowData;
}

function rankBadgeClasses(rank: number, isCurrentUser: boolean): string {
  if (rank === 1) {
    return "bg-[var(--accent-gold)] text-[#121006]";
  }
  if (rank === 2) {
    return "bg-[#c0c8d2] text-[#0d1116]";
  }
  if (rank === 3) {
    return "bg-[#cd7f32] text-white";
  }
  return isCurrentUser
    ? "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
    : "bg-white/[0.08] text-[var(--muted-foreground)]";
}

export function LeaderboardRow({ row }: LeaderboardRowProps) {
  const stats = [
    `${row.exactScores} ${leaderboardMessages.row.exactShort}`,
    `${row.correctOutcomes} ${leaderboardMessages.row.correctShort}`,
    `${row.missingPredictions} ${leaderboardMessages.row.missingShort}`,
  ].join(" · ");

  return (
    <article
      className={cn(
        "grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-xl border p-3 transition sm:gap-4 sm:p-4",
        row.isCurrentUser
          ? "border-[var(--accent-gold)]/45 bg-[var(--accent-gold)]/8"
          : "border-white/10 bg-white/[0.04] hover:border-white/20",
      )}
    >
      <span
        aria-label={`Posición ${row.rank}`}
        className={cn(
          "grid size-9 place-items-center rounded-full text-sm font-bold tabular-nums shadow-sm",
          rankBadgeClasses(row.rank, row.isCurrentUser),
        )}
      >
        {row.rank === 1 ? (
          <Crown className="size-4" aria-hidden />
        ) : (
          row.rank
        )}
      </span>
      <Avatar name={row.avatarName} color={row.avatarColor} size="md" />
      <div className="min-w-0 grid gap-1">
        <p className="truncate text-base font-semibold leading-tight">
          {row.displayName}
          {row.isCurrentUser ? (
            <span className="ml-2 rounded-full bg-[var(--accent-gold)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
              {leaderboardMessages.row.youBadge}
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-[var(--muted-foreground)]">
          {row.completedPredictions === 0 && row.points === 0
            ? leaderboardMessages.row.noActivity
            : stats}
        </p>
      </div>
      <div className="grid text-right">
        <span className="text-2xl font-bold leading-none tabular-nums">
          {row.points}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {leaderboardMessages.row.pointsLabel}
        </span>
      </div>
    </article>
  );
}
