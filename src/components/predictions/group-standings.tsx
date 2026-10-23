import { Check, X } from "lucide-react";

import { TeamFlag } from "@/components/teams/team-flag";
import type { TeamStandingRow } from "@/lib/predictions/data";
import { cn } from "@/lib/utils";

interface GroupStandingsProps {
  groupCode: string;
  rows: TeamStandingRow[];
  /** Real final order (teamIds) once the group is closed; enables green/red. */
  actualOrder?: string[] | null;
  /** Whether the user predicted EVERY match of this group. */
  predictedComplete?: boolean;
}

const COLS = ["J", "G", "E", "P", "GF", "GC", "DG", "Pts"] as const;

export function GroupStandings({ groupCode, rows, actualOrder, predictedComplete }: GroupStandingsProps) {
  if (rows.length === 0) return null;
  // Only show the green/red result overlay when the group is closed AND the user
  // predicted the whole group — a partial prediction has no meaningful order, and
  // this keeps it consistent with the leaderboard "pos. grupo" / "top-2" stats.
  const showResults = !!actualOrder && actualOrder.length > 0 && !!predictedComplete;
  const correctCount = showResults
    ? rows.filter((r) => actualOrder![r.position - 1] === r.team.id).length
    : 0;
  // Top-2 (clasificados): the two qualifiers right, in any order.
  const top2Correct =
    showResults && rows.length >= 2 && (() => {
      const pred = new Set([rows[0].team.id, rows[1].team.id]);
      return actualOrder!.slice(0, 2).every((t) => pred.has(t));
    })();

  return (
    <section
      aria-label={`Standings — Group ${groupCode}`}
      className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
    >
      <header className="border-b border-white/10 px-4 py-2.5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
          Grupo {groupCode}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
          {showResults ? `Cerrado · ${correctCount}/${rows.length} posiciones correctas` : "Según tus pronósticos"}
        </p>
        {showResults ? (
          <p
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]",
              top2Correct ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {top2Correct ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
            {top2Correct ? "Acertaste los clasificados (top-2)" : "Fallaste los clasificados"}
          </p>
        ) : null}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8 text-[var(--muted-foreground)]">
              <th className="py-2 pl-4 pr-2 text-left font-medium">Selección</th>
              {COLS.map((col) => (
                <th
                  key={col}
                  className={cn(
                    "w-9 py-2 text-center font-medium",
                    col === "Pts" && "text-[var(--accent-teal)]",
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const correct = showResults ? actualOrder![row.position - 1] === row.team.id : null;
              return (
              <tr
                key={row.team.id}
                className={cn(
                  "border-b border-white/6 last:border-b-0 transition",
                  correct === true
                    ? "bg-emerald-500/[0.12]"
                    : correct === false
                      ? "bg-rose-500/[0.12]"
                      : row.position <= 2
                        ? "bg-[var(--accent-teal)]/[0.04]"
                        : "bg-transparent",
                )}
              >
                <td className="py-2 pl-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center font-semibold tabular-nums text-[var(--muted-foreground)]">
                      {row.position}
                    </span>
                    <TeamFlag
                      teamCode={row.team.code}
                      teamName={row.team.name}
                      size="sm"
                    />
                    <span className="truncate font-semibold text-[var(--foreground)]">
                      {row.team.name}
                    </span>
                    {correct === true ? (
                      <Check className="size-3.5 shrink-0 text-emerald-400" aria-label="Posición correcta" />
                    ) : correct === false ? (
                      <X className="size-3.5 shrink-0 text-rose-400" aria-label="Posición incorrecta" />
                    ) : null}
                  </div>
                </td>
                <StatCell value={row.mp} />
                <StatCell value={row.w} />
                <StatCell value={row.d} />
                <StatCell value={row.l} />
                <StatCell value={row.gf} />
                <StatCell value={row.ga} />
                <StatCell value={row.gd} highlight={row.gd > 0} />
                <td className="w-9 py-2 text-center font-bold tabular-nums text-[var(--accent-teal)]">
                  {row.pts}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <td
      className={cn(
        "w-9 py-2 text-center tabular-nums",
        highlight
          ? "font-semibold text-[var(--foreground)]"
          : "text-[var(--muted-foreground)]",
      )}
    >
      {value}
    </td>
  );
}
