import { cn } from "@/lib/utils";
import { TeamFlag } from "@/components/teams/team-flag";
import type { StatsDesignProps } from "./types";
import { Lock, Trophy, Target, CheckCheck } from "lucide-react";

type Reveal = StatsDesignProps["reveal"];
type Category = Reveal["categories"][number];
type Option = Category["options"][number];
type Picker = Option["pickers"][number];
type StatRow = StatsDesignProps["stats"]["rows"][number];

/** A single player's pick within one category, resolved for the matrix grid. */
interface CellPick {
  option: Option | null;
  isCurrentUser: boolean;
}

/** A matrix row: one player, plus their pick per category (by category key). */
interface MatrixRow {
  userId: string;
  name: string;
  avatarColor: string;
  isCurrentUser: boolean;
  cells: Record<string, CellPick>;
}

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/** Build the unified player list across every category's pickers + missing. */
function buildMatrix(reveal: Reveal, currentUserId: string): MatrixRow[] {
  const players = new Map<string, MatrixRow>();

  const ensure = (p: Picker): MatrixRow => {
    let row = players.get(p.userId);
    if (!row) {
      row = {
        userId: p.userId,
        name: p.name,
        avatarColor: p.avatarColor,
        isCurrentUser: p.userId === currentUserId,
        cells: {},
      };
      players.set(p.userId, row);
    }
    return row;
  };

  for (const cat of reveal.categories) {
    for (const opt of cat.options) {
      for (const picker of opt.pickers) {
        const row = ensure(picker);
        row.cells[cat.category] = {
          option: opt,
          isCurrentUser: picker.isCurrentUser,
        };
      }
    }
    for (const miss of cat.missing) {
      ensure(miss);
    }
  }

  const rows = Array.from(players.values());
  rows.sort((a, b) => {
    if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1;
    return a.name.localeCompare(b.name, "es");
  });
  return rows;
}

/** Small circular avatar with the player's first initial. */
function Avatar({
  name,
  color,
  highlight,
}: {
  name: string;
  color: string;
  highlight: boolean;
}) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none text-white/95 shadow-sm",
        highlight && "ring-2 ring-[var(--accent-gold)] ring-offset-1 ring-offset-[#0b0f0d]"
      )}
      style={{ backgroundColor: color }}
    >
      {initial(name)}
    </span>
  );
}

/** Renders a single matrix cell pick (team flag or short player name). */
function PickCell({
  option,
  isPlayer,
  emoji,
}: {
  option: Option | null;
  isPlayer: boolean;
  emoji: string;
}) {
  if (!option) {
    return <span className="text-[var(--muted-foreground)]/50">—</span>;
  }
  if (!isPlayer && option.teamCode) {
    return (
      <span className="inline-flex items-center justify-center">
        <TeamFlag teamCode={option.teamCode} teamName={option.label} size="sm" />
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-[88px] items-center gap-1 truncate text-[11px] text-[var(--foreground)]">
      <span aria-hidden className="text-xs">
        {emoji}
      </span>
      <span className="truncate">{shortName(option.label)}</span>
    </span>
  );
}

/** Leading (consensus) pick for a category — its top option. */
function consensusOption(cat: Category): Option | null {
  return cat.options.length > 0 ? cat.options[0] : null;
}

export function DesignMatriz({ stats, reveal, currentUserId }: StatsDesignProps) {
  const matrix = buildMatrix(reveal, currentUserId);
  const cats = reveal.categories;

  return (
    <div className="space-y-6">
      {/* ============ SECTION 1: PREDICCIONES ESPECIALES (matrix) ============ */}
      <section className="space-y-3">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">
              Predicciones Especiales
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {reveal.totalPlayers}{" "}
              {reveal.totalPlayers === 1 ? "jugador" : "jugadores"} · 6 categorías
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
              reveal.locked
                ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                : "bg-white/[0.04] text-[var(--muted-foreground)]"
            )}
          >
            <Lock className="h-3 w-3" aria-hidden />
            {reveal.locked ? "Revelado" : "Bloqueado"}
          </span>
        </header>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="sticky left-0 z-20 min-w-[120px] bg-[#0b0f0d] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Jugador
                  </th>
                  {cats.map((cat) => (
                    <th
                      key={cat.category}
                      className="min-w-[104px] px-3 py-2.5 text-center align-bottom"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span aria-hidden className="text-sm leading-none">
                          {cat.emoji}
                        </span>
                        <span className="text-[10px] font-semibold leading-tight text-[var(--foreground)]">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-medium text-[var(--accent-teal)]">
                          {cat.picked}/{reveal.totalPlayers}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>

                {/* Sticky consensus row */}
                <tr className="border-b border-white/10 bg-[var(--accent-gold)]/[0.06]">
                  <th className="sticky left-0 z-20 bg-[#0c100e] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--accent-gold)]">
                    Consenso
                  </th>
                  {cats.map((cat) => {
                    const top = consensusOption(cat);
                    return (
                      <td
                        key={cat.category}
                        className="px-3 py-2 text-center"
                      >
                        {top ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <PickCell
                              option={top}
                              isPlayer={cat.isPlayer}
                              emoji={cat.emoji}
                            />
                            <span className="text-[9px] font-medium text-[var(--muted-foreground)]">
                              {Math.round(top.share)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--muted-foreground)]/50">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {matrix.map((row) => (
                  <tr
                    key={row.userId}
                    className={cn(
                      "border-b border-white/5 last:border-0",
                      row.isCurrentUser
                        ? "bg-[var(--accent-gold)]/[0.05]"
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 px-3 py-2",
                        row.isCurrentUser ? "bg-[#13100a]" : "bg-[#0b0f0d]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={row.name}
                          color={row.avatarColor}
                          highlight={row.isCurrentUser}
                        />
                        <span
                          className={cn(
                            "max-w-[80px] truncate text-xs font-medium",
                            row.isCurrentUser
                              ? "text-[var(--accent-gold)]"
                              : "text-[var(--foreground)]"
                          )}
                        >
                          {row.name}
                        </span>
                      </div>
                    </td>
                    {cats.map((cat) => {
                      const cell = row.cells[cat.category];
                      return (
                        <td
                          key={cat.category}
                          className="px-3 py-2 text-center"
                        >
                          <PickCell
                            option={cell?.option ?? null}
                            isPlayer={cat.isPlayer}
                            emoji={cat.emoji}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {matrix.length === 0 && (
                  <tr>
                    <td
                      colSpan={cats.length + 1}
                      className="px-3 py-6 text-center text-xs text-[var(--muted-foreground)]"
                    >
                      Aún no hay predicciones especiales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="px-1 text-[10px] text-[var(--muted-foreground)]">
          Desliza horizontalmente para ver todas las categorías. La fila dorada
          marca el consenso del grupo.
        </p>
      </section>

      {/* ============ SECTION 2: RANKING DE JUGADORES ============ */}
      <section className="space-y-3">
        <header>
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">
            Clasificación
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Puntos, aciertos y mejor ronda por jugador
          </p>
        </header>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-3 py-2.5">Jugador</th>
                  <th className="px-2 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3 w-3" aria-hidden />
                      Pts
                    </span>
                  </th>
                  <th className="px-2 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3 w-3" aria-hidden />
                      Aciertos
                    </span>
                  </th>
                  <th className="px-2 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1">
                      <CheckCheck className="h-3 w-3" aria-hidden />
                      Exactos
                    </span>
                  </th>
                  <th className="px-2 py-2.5 text-right">Grupos</th>
                  <th className="px-3 py-2.5 text-right">Mejor ronda</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((r: StatRow, i: number) => {
                  const isMe = r.userId === currentUserId;
                  return (
                    <tr
                      key={r.userId}
                      className={cn(
                        "border-b border-white/5 last:border-0",
                        isMe
                          ? "bg-[var(--accent-gold)]/[0.05]"
                          : "hover:bg-white/[0.02]"
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                              i === 0
                                ? "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                                : "bg-white/[0.04] text-[var(--muted-foreground)]"
                            )}
                          >
                            {i + 1}
                          </span>
                          <span
                            className={cn(
                              "max-w-[120px] truncate text-xs font-medium",
                              isMe
                                ? "text-[var(--accent-gold)]"
                                : "text-[var(--foreground)]"
                            )}
                          >
                            {r.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right text-sm font-bold text-[var(--foreground)]">
                        {r.points}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <span className="text-xs font-semibold text-[var(--accent-teal)]">
                          {Math.round(r.accuracy)}%
                        </span>
                        <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">
                          ({r.graded})
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-xs font-medium text-[var(--foreground)]">
                        {r.exact}
                      </td>
                      <td className="px-2 py-2.5 text-right text-xs font-semibold text-[var(--accent-teal)]">
                        {r.groupPositions}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[11px] text-[var(--muted-foreground)]">
                        {r.bestStage ?? "—"}
                      </td>
                    </tr>
                  );
                })}
                {stats.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-xs text-[var(--muted-foreground)]"
                    >
                      Aún no hay partidos calificados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
