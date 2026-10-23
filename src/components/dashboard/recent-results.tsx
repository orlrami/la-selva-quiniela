import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamFlag } from "@/components/teams/team-flag";
import type { DashboardRecentResult } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";

interface RecentResultsProps {
  results: DashboardRecentResult[];
}

function ResultRow({ result }: { result: DashboardRecentResult }) {
  const pred = result.prediction;
  const hasPick = pred !== null;
  const correctOutcome = pred?.correctOutcome ?? false;
  const exactScore = pred?.exactScore ?? false;
  const points = pred?.points ?? 0;

  const tint = correctOutcome
    ? "border-[var(--accent-green)]/40 bg-[var(--accent-green)]/8"
    : hasPick
      ? "border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/8"
      : "border-white/10 bg-white/[0.03]";

  const scoreColor = exactScore
    ? "text-[var(--accent-green)]"
    : correctOutcome
      ? "text-[var(--accent-gold)]"
      : "text-[var(--accent-danger)]";

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
        tint,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <TeamFlag
          teamCode={result.homeTeam.code}
          teamName={result.homeTeam.name}
          size="sm"
        />
        <span className="font-semibold">{result.homeTeam.code}</span>
        <span className="font-bold tabular-nums text-[var(--foreground)]">
          {result.finalScore.homeScore}–{result.finalScore.awayScore}
        </span>
        <span className="font-semibold">{result.awayTeam.code}</span>
        <TeamFlag
          teamCode={result.awayTeam.code}
          teamName={result.awayTeam.name}
          size="sm"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        {hasPick ? (
          <span className={cn("font-bold tabular-nums", scoreColor)}>
            {pred!.homeScore}–{pred!.awayScore}
          </span>
        ) : (
          <span className="text-[var(--muted-foreground)]">—</span>
        )}
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-bold uppercase tracking-[0.12em]",
            points > 0
              ? "border-[var(--accent-green)]/40 bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
              : "border-white/12 bg-white/[0.05] text-[var(--muted-foreground)]",
          )}
        >
          {points > 0 ? `+${points}` : "0"} pts
        </span>
      </div>
    </li>
  );
}

export function RecentResults({ results }: RecentResultsProps) {
  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="grid size-10 place-items-center rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]">
          <History className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-lg">Resultados recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2">
          {results.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
