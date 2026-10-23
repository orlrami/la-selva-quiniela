import { rulesMessages } from "@/lib/rules/messages";
import { cn } from "@/lib/utils";

export interface ScoringTableRow {
  key: string;
  label: string;
  description: string;
  points: number;
  accent?: "gold" | "teal" | "muted";
}

interface ScoringTableProps {
  rows: ScoringTableRow[];
}

const pointsAccent = {
  gold: "text-[var(--accent-gold)]",
  teal: "text-[var(--accent-teal)]",
  muted: "text-[var(--muted-foreground)]",
} as const;

export function ScoringTable({ rows }: ScoringTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:px-5">
        <span>{rulesMessages.scoring.columnTrigger}</span>
        <span>{rulesMessages.scoring.columnPoints}</span>
      </div>
      <ul className="divide-y divide-white/8">
        {rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-5"
          >
            <div className="grid gap-1">
              <p className="text-sm font-semibold leading-tight">{row.label}</p>
              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                {row.description}
              </p>
            </div>
            <p
              className={cn(
                "text-right text-2xl font-bold leading-none tabular-nums",
                pointsAccent[row.accent ?? "muted"],
              )}
            >
              {row.points}{" "}
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                {rulesMessages.scoring.pointsSuffix}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
