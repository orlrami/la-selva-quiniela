import { cn } from "@/lib/utils";
import { TeamFlag } from "@/components/teams/team-flag";
import type { StatsDesignProps } from "./types";
import type {
  RevealCategory,
  RevealOption,
  RevealPicker,
} from "@/lib/bonus/reveal";
import type { PlayerStatRow } from "@/lib/stats/data";
import { Crown, Lock, Sparkles, Target, Trophy } from "lucide-react";

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

/** Small circular avatar chip coloured by the picker. */
function AvatarChip({ picker }: { picker: RevealPicker }) {
  return (
    <span
      title={picker.name}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm",
        picker.isCurrentUser &&
          "ring-2 ring-[var(--accent-gold)] ring-offset-1 ring-offset-[var(--background)]",
      )}
      style={{ backgroundColor: picker.avatarColor }}
    >
      {initial(picker.name)}
    </span>
  );
}

/** Emoji-in-a-circle stand-in for player categories (no flag). */
function PlayerGlyph({ emoji }: { emoji: string }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-base leading-none">
      {emoji}
    </span>
  );
}

/* ───────────────────────── Player stats ───────────────────────── */

function PodiumPlace({
  row,
  place,
  isCurrentUser,
}: {
  row: PlayerStatRow;
  place: 1 | 2 | 3;
  isCurrentUser: boolean;
}) {
  const isFirst = place === 1;
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  const accent =
    place === 1
      ? "var(--accent-gold)"
      : place === 2
        ? "var(--accent-teal)"
        : "var(--muted-foreground)";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center rounded-xl border bg-white/[0.04] px-2 text-center",
        isFirst ? "order-2 pb-5 pt-6" : "order-1 pb-4 pt-5",
        place === 3 && "order-3",
        isFirst ? "border-[var(--accent-gold)]/40" : "border-white/10",
        isCurrentUser && "ring-1 ring-[var(--accent-gold)]/60",
      )}
      style={isFirst ? { boxShadow: "0 0 24px -8px var(--accent-gold)" } : undefined}
    >
      {isFirst && (
        <Crown
          className="absolute -top-3 h-6 w-6 text-[var(--accent-gold)]"
          strokeWidth={2.2}
          aria-hidden
        />
      )}
      <span className={cn("leading-none", isFirst ? "text-3xl" : "text-2xl")}>
        {medal}
      </span>
      <p
        className={cn(
          "mt-2 line-clamp-2 font-semibold leading-tight text-[var(--foreground)]",
          isFirst ? "text-sm" : "text-xs",
        )}
      >
        {row.name}
      </p>
      <p
        className={cn("mt-1 font-extrabold tabular-nums", isFirst ? "text-2xl" : "text-xl")}
        style={{ color: accent }}
      >
        {row.points}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
        pts
      </p>
    </div>
  );
}

function RankRow({
  row,
  rank,
  isCurrentUser,
}: {
  row: PlayerStatRow;
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5",
        isCurrentUser && "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/[0.06]",
      )}
    >
      <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-[var(--muted-foreground)]">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {row.name}
          {isCurrentUser && (
            <span className="ml-1 text-[var(--accent-gold)]">· tú</span>
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--muted-foreground)]">
          <span>
            {row.accuracy}% aciertos
            <span className="opacity-60"> ({row.graded})</span>
          </span>
          <span aria-hidden>·</span>
          <span>{row.exact} exactos</span>
          <span aria-hidden>·</span>
          <span className="text-[var(--accent-teal)]">{row.groupPositions} grupos</span>
          {row.bestStage && (
            <>
              <span aria-hidden>·</span>
              <span className="text-[var(--accent-teal)]">{row.bestStage}</span>
            </>
          )}
        </p>
      </div>
      <span className="shrink-0 text-base font-extrabold tabular-nums text-[var(--foreground)]">
        {row.points}
      </span>
    </div>
  );
}

function StatsRanking({
  rows,
  currentUserId,
}: {
  rows: PlayerStatRow[];
  currentUserId: string;
}) {
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <section>
      <header className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[var(--accent-gold)]" aria-hidden />
        <h2 className="text-lg font-bold text-[var(--foreground)]">Clasificación</h2>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
          Aún no hay puntos. La tabla aparecerá cuando empiecen los partidos.
        </p>
      ) : (
        <>
          {podium.length > 0 && (
            <div className="mb-3 grid grid-cols-3 items-end gap-2">
              {podium.map((row, i) => (
                <PodiumPlace
                  key={row.userId}
                  row={row}
                  place={(i + 1) as 1 | 2 | 3}
                  isCurrentUser={row.userId === currentUserId}
                />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((row, i) => (
                <RankRow
                  key={row.userId}
                  row={row}
                  rank={i + 4}
                  isCurrentUser={row.userId === currentUserId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ─────────────────────── Bonus reveal ─────────────────────── */

function ConsensusBar({
  option,
  isPlayer,
  emoji,
}: {
  option: RevealOption;
  isPlayer: boolean;
  emoji: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/[0.06] p-3">
      <div className="flex items-center gap-2.5">
        {isPlayer || !option.teamCode ? (
          <PlayerGlyph emoji={emoji} />
        ) : (
          <TeamFlag teamCode={option.teamCode} teamName={option.label} size="sm" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">
          {option.label}
        </span>
        <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--accent-gold)]">
          {option.count} · {Math.round(option.share)}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--accent-gold)]"
          style={{ width: `${Math.max(option.share, 4)}%` }}
        />
      </div>
    </div>
  );
}

function OptionGroup({
  option,
  isLeader,
  isPlayer,
  emoji,
}: {
  option: RevealOption;
  isLeader: boolean;
  isPlayer: boolean;
  emoji: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {isPlayer || !option.teamCode ? (
          <PlayerGlyph emoji={emoji} />
        ) : (
          <TeamFlag teamCode={option.teamCode} teamName={option.label} size="sm" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--foreground)]">
          {option.label}
        </span>
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold tabular-nums",
            isLeader ? "text-[var(--accent-gold)]" : "text-[var(--muted-foreground)]",
          )}
        >
          {option.count} · {Math.round(option.share)}%
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-1">
        {option.pickers.map((p) => (
          <AvatarChip key={p.userId} picker={p} />
        ))}
      </div>
    </div>
  );
}

function BonusReveal({
  reveal,
}: {
  reveal: StatsDesignProps["reveal"];
}) {
  return (
    <section>
      <header className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--accent-gold)]" aria-hidden />
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          Predicciones Especiales
        </h2>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          {reveal.locked ? (
            <>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Reveladas
            </>
          ) : (
            <>
              <Target className="h-3.5 w-3.5" aria-hidden />
              {reveal.totalPlayers} jugadores
            </>
          )}
        </span>
      </header>

      <div className="space-y-4">
        {reveal.categories.map((category) => (
          <CategoryCardWithTotal
            key={category.category}
            category={category}
            total={reveal.totalPlayers}
          />
        ))}
      </div>
    </section>
  );
}

/** Wrapper that injects the real total into the "X/total" line. */
function CategoryCardWithTotal({
  category,
  total,
}: {
  category: RevealCategory;
  total: number;
}) {
  const { isPlayer, emoji, options, picked } = category;
  const leader = options[0];
  const others = options.slice(1);

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <header className="mb-3 flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[var(--foreground)]">
            {category.label}
          </h3>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            {picked}/{total} eligieron
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/[0.08] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-teal)]">
          {category.points} pts
        </span>
      </header>

      {leader ? (
        <ConsensusBar option={leader} isPlayer={isPlayer} emoji={emoji} />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
          Nadie ha elegido todavía.
        </p>
      )}

      {(leader || others.length > 0) && (
        <div className="mt-3 space-y-3">
          {leader && (
            <OptionGroup option={leader} isLeader isPlayer={isPlayer} emoji={emoji} />
          )}
          {others.map((o) => (
            <OptionGroup
              key={o.key}
              option={o}
              isLeader={false}
              isPlayer={isPlayer}
              emoji={emoji}
            />
          ))}
        </div>
      )}
    </article>
  );
}

/* ──────────────────────────── Root ──────────────────────────── */

export function DesignPodio({ stats, reveal, currentUserId }: StatsDesignProps) {
  return (
    <div className="mx-auto max-w-md space-y-8 px-4 pb-10 pt-6">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-teal)]">
          La Selva Quiniela
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">
          {stats.quiniela.name}
        </h1>
      </header>

      <BonusReveal reveal={reveal} />

      <StatsRanking rows={stats.rows} currentUserId={currentUserId} />
    </div>
  );
}
