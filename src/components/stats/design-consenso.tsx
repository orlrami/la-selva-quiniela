import { cn } from "@/lib/utils";
import { TeamFlag } from "@/components/teams/team-flag";
import type { StatsDesignProps } from "./types";
import { Trophy, Target, CheckCircle2, Lock, Unlock, Users } from "lucide-react";

import type {
  RevealCategory,
  RevealOption,
  RevealPicker,
} from "@/lib/bonus/reveal";
import type { PlayerStatRow } from "@/lib/stats/data";

function initial(name: string): string {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

function PickerChip({ picker }: { picker: RevealPicker }) {
  return (
    <span
      title={picker.name}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm",
        picker.isCurrentUser &&
          "ring-2 ring-[var(--accent-gold)] ring-offset-1 ring-offset-[#0c1410]",
      )}
      style={{ backgroundColor: picker.avatarColor }}
    >
      {initial(picker.name)}
    </span>
  );
}

function PickerStack({ pickers }: { pickers: RevealPicker[] }) {
  const shown = pickers.slice(0, 5);
  const extra = pickers.length - shown.length;
  return (
    <div className="flex shrink-0 items-center -space-x-1.5">
      {shown.map((p) => (
        <PickerChip key={p.userId} picker={p} />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] px-1 text-[10px] font-semibold text-[var(--muted-foreground)]">
          +{extra}
        </span>
      )}
    </div>
  );
}

function OptionBar({
  option,
  isLeader,
  isPlayerCat,
  emoji,
}: {
  option: RevealOption;
  isLeader: boolean;
  isPlayerCat: boolean;
  emoji: string;
}) {
  const youPicked = option.pickers.some((p) => p.isCurrentUser);
  const barColor = isLeader
    ? "bg-[var(--accent-gold)]"
    : "bg-[var(--accent-teal)]/55";
  const width = Math.max(option.share, 4);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isPlayerCat ? (
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[3px] bg-white/[0.06] text-xs">
              {emoji}
            </span>
          ) : option.teamCode ? (
            <TeamFlag
              teamCode={option.teamCode}
              teamName={option.label}
              size="sm"
            />
          ) : null}
          <span
            className={cn(
              "truncate text-sm font-medium text-[var(--foreground)]",
              youPicked && "text-[var(--accent-gold)]",
            )}
          >
            {option.label}
          </span>
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <span
            className={cn(
              "text-base font-extrabold tabular-nums",
              isLeader
                ? "text-[var(--accent-gold)]"
                : "text-[var(--foreground)]",
            )}
          >
            {Math.round(option.share)}%
          </span>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            ·{option.count}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${width}%` }}
          />
        </div>
        <PickerStack pickers={option.pickers} />
      </div>
    </div>
  );
}

function CategoryBlock({ cat }: { cat: RevealCategory }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{cat.emoji}</span>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--foreground)]">
            {cat.label}
          </h3>
        </div>
        <span className="rounded-full bg-[var(--accent-gold)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-gold)]">
          {cat.points} pts
        </span>
      </header>

      {cat.options.length > 0 ? (
        <div className="space-y-3">
          {cat.options.map((opt, i) => (
            <OptionBar
              key={opt.key}
              option={opt}
              isLeader={i === 0}
              isPlayerCat={cat.isPlayer}
              emoji={cat.emoji}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Nadie ha elegido todavía.
        </p>
      )}

      <footer className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-[var(--muted-foreground)]">
        <span>
          {cat.picked} eligieron · {cat.missing.length} sin elegir
        </span>
        {cat.missing.length > 0 && <PickerStack pickers={cat.missing} />}
      </footer>
    </section>
  );
}

function RankBar({
  row,
  rank,
  leaderPoints,
  isCurrentUser,
}: {
  row: PlayerStatRow;
  rank: number;
  leaderPoints: number;
  isCurrentUser: boolean;
}) {
  const width =
    leaderPoints > 0 ? Math.max((row.points / leaderPoints) * 100, 6) : 6;
  const isLeader = rank === 1;

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        isCurrentUser
          ? "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/[0.06]"
          : "border-white/10 bg-white/[0.04]",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums",
              isLeader
                ? "bg-[var(--accent-gold)] text-[#0c1410]"
                : "bg-white/[0.08] text-[var(--muted-foreground)]",
            )}
          >
            {rank}
          </span>
          <span
            className={cn(
              "truncate text-sm font-semibold text-[var(--foreground)]",
              isCurrentUser && "text-[var(--accent-gold)]",
            )}
          >
            {row.name}
            {isCurrentUser && (
              <span className="ml-1 text-[11px] font-normal text-[var(--muted-foreground)]">
                (tú)
              </span>
            )}
          </span>
        </div>
        <span className="shrink-0 text-base font-extrabold tabular-nums text-[var(--accent-gold)]">
          {row.points}
          <span className="ml-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
            pts
          </span>
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={cn(
            "h-full rounded-full",
            isLeader ? "bg-[var(--accent-gold)]" : "bg-[var(--accent-teal)]/55",
          )}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-[var(--accent-teal)]" />
          {Math.round(row.accuracy)}% aciertos
          <span className="opacity-70">({row.graded})</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Target className="h-3 w-3 text-[var(--accent-gold)]" />
          {row.exact} exactos
        </span>
        <span className="inline-flex items-center gap-1">
          <Trophy className="h-3 w-3 text-[var(--accent-teal)]" />
          {row.groupPositions} grupos
        </span>
        {row.bestStage && (
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3 text-[var(--muted-foreground)]" />
            {row.bestStage}
          </span>
        )}
      </div>
    </div>
  );
}

export function DesignConsenso({
  stats,
  reveal,
  currentUserId,
}: StatsDesignProps) {
  const leaderPoints = stats.rows.length > 0 ? stats.rows[0].points : 0;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
              Predicciones Especiales
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                reveal.locked
                  ? "bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]"
                  : "bg-white/[0.06] text-[var(--muted-foreground)]",
              )}
            >
              {reveal.locked ? (
                <>
                  <Unlock className="h-3 w-3" /> Revelado
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Bloqueado
                </>
              )}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-[var(--muted-foreground)]">
            <Users className="h-3.5 w-3.5" />
            Consenso del grupo · {reveal.totalPlayers} jugadores
          </p>
        </header>

        <div className="space-y-3">
          {reveal.categories.map((cat) => (
            <CategoryBlock key={cat.category} cat={cat} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
            Tabla de Rendimiento
          </h2>
          <p className="text-[13px] text-[var(--muted-foreground)]">
            Puntos, aciertos y resultados exactos
          </p>
        </header>

        {stats.rows.length > 0 ? (
          <div className="space-y-2.5">
            {stats.rows.map((row, i) => (
              <RankBar
                key={row.userId}
                row={row}
                rank={i + 1}
                leaderPoints={leaderPoints}
                isCurrentUser={row.userId === currentUserId}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted-foreground)]">
            Aún no hay puntuaciones.
          </p>
        )}
      </section>
    </div>
  );
}
