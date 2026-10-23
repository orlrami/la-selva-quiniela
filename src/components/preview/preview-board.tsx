"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, ChevronDown, Crown, Lock, Trophy } from "lucide-react";

import { LocalDateTime } from "@/components/ui/local-datetime";
import { TeamFlag } from "@/components/teams/team-flag";
import { RankChip, upsetSide } from "@/components/teams/rank-chip";
import { cn } from "@/lib/utils";
import type {
  AllPredEntry,
  AllPredKnockoutEntry,
  AllPredKnockoutMatch,
  AllPredMatch,
  AllPredictionsData,
} from "@/lib/predictions/all-predictions";

type Variant = "consensus" | "grid" | "cards";

const VARIANTS: { key: Variant; label: string; blurb: string }[] = [
  { key: "consensus", label: "1 · Consenso", blurb: "Resumen agregado, detalle al tocar" },
  { key: "grid", label: "2 · Cuadrícula", blurb: "Tabla estilo quiniela, todos a la vez" },
  { key: "cards", label: "3 · Tarjetas", blurb: "Una tarjeta por partido, se despliega" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Avatar({ entry, size = 24 }: { entry: { name: string; avatarColor: string }; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-[10px] font-bold text-black/80"
      style={{ width: size, height: size, backgroundColor: entry.avatarColor }}
      title={entry.name}
    >
      {initials(entry.name)}
    </span>
  );
}

// Colour a revealed scoreline by how it scored (only meaningful once final).
function scoreTint(e: AllPredEntry, graded: boolean): string {
  if (!graded) return "border-white/12 bg-white/[0.05] text-[var(--foreground)]";
  if (e.exactScore) return "border-[var(--accent-green)]/45 bg-[var(--accent-green)]/12 text-[var(--accent-green)]";
  if (e.correctOutcome) return "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]";
  return "border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]";
}

function MatchTeams({ match }: { match: AllPredMatch }) {
  const upset = match.finalScore
    ? upsetSide(
        match.homeTeam.fifaRank,
        match.awayTeam.fifaRank,
        match.finalScore.homeScore,
        match.finalScore.awayScore,
      )
    : null;
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <TeamFlag teamCode={match.homeTeam.code} teamName={match.homeTeam.name} size="sm" />
      <span>{match.homeTeam.code}</span>
      <RankChip rank={match.homeTeam.fifaRank} highlight={upset === "home"} />
      <span className="text-[var(--muted-foreground)]">vs</span>
      <RankChip rank={match.awayTeam.fifaRank} highlight={upset === "away"} />
      <span>{match.awayTeam.code}</span>
      <TeamFlag teamCode={match.awayTeam.code} teamName={match.awayTeam.name} size="sm" />
    </div>
  );
}

function FinalBadge({ match }: { match: AllPredMatch }) {
  if (!match.finalScore) {
    if (match.status === "LIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-danger)]/45 bg-[var(--accent-danger)]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-danger)]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent-danger)] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--accent-danger)]" />
          </span>
          En vivo
        </span>
      );
    }
    return (
      <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        Por jugar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
      <Trophy className="size-3" aria-hidden /> {match.finalScore.homeScore}–{match.finalScore.awayScore}
    </span>
  );
}

/* ---------------- Proposal 1 — Consensus ---------------- */

function ConsensusMatch({ match }: { match: AllPredMatch }) {
  const [open, setOpen] = useState(false);
  const graded = match.finalScore !== null;
  const s = match.outcomeSplit;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-[var(--muted-foreground)]">
        <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 font-bold uppercase tracking-[0.14em]">
          Grupo {match.groupCode}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3" aria-hidden />
          <LocalDateTime iso={match.kickoffAt} style="short" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <MatchTeams match={match} />
        <FinalBadge match={match} />
      </div>

      {/* W / D / L distribution bar */}
      <div className="mt-3 flex h-6 overflow-hidden rounded-md text-[10px] font-bold">
        <span
          className="grid place-items-center bg-[var(--accent-green)]/25 text-[var(--accent-green)]"
          style={{ width: `${s.home}%` }}
        >
          {s.home >= 12 ? `${s.home}%` : ""}
        </span>
        <span
          className="grid place-items-center bg-white/10 text-[var(--muted-foreground)]"
          style={{ width: `${s.draw}%` }}
        >
          {s.draw >= 12 ? `${s.draw}%` : ""}
        </span>
        <span
          className="grid place-items-center bg-[var(--accent-gold)]/25 text-[var(--accent-gold)]"
          style={{ width: `${s.away}%` }}
        >
          {s.away >= 12 ? `${s.away}%` : ""}
        </span>
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        <span>{match.homeTeam.code}</span>
        <span>Empate</span>
        <span>{match.awayTeam.code}</span>
      </div>

      {/* Top predicted scorelines */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Más elegidos
        </span>
        {match.topScores.map((t) => (
          <span
            key={t.line}
            className="rounded-md border border-white/12 bg-white/[0.05] px-2 py-0.5 text-xs font-semibold tabular-nums"
          >
            {t.line.replace("-", "–")} <span className="text-[var(--muted-foreground)]">×{t.count}</span>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-teal,#1fb6a6)]"
      >
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
        {open ? "Ocultar" : `Ver los ${match.totalPicks} pronósticos`}
      </button>

      {open ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {match.entries.map((e) => (
            <span
              key={e.userId}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold tabular-nums",
                scoreTint(e, graded),
              )}
            >
              <Avatar entry={e} size={18} />
              {e.name.split(/\s+/)[0]} {e.homeScore}–{e.awayScore}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Knockout consensus ---------------- */

function koTeamLabel(t: AllPredKnockoutMatch["homeTeam"]): string {
  return t ? t.code : "—";
}

// Tint a revealed knockout pick. Only colour by correctness once the match is
// GRADED (has a final score). A locked-but-unplayed match reveals the scoreline
// but stays neutral grey — nothing is right or wrong yet.
function koEntryTint(e: AllPredKnockoutEntry, graded: boolean): string {
  if (!e.hasPrediction) return "border-white/8 bg-white/[0.02] text-[var(--muted-foreground)]";
  if (!graded) return "border-white/12 bg-white/[0.05] text-[var(--foreground)]";
  if (e.exactScore) return "border-[var(--accent-green)]/45 bg-[var(--accent-green)]/12 text-[var(--accent-green)]";
  if (e.correctWinner) return "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]";
  return "border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]";
}

function KnockoutConsensusMatch({ match }: { match: AllPredKnockoutMatch }) {
  const [open, setOpen] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const resolved = match.homeTeam !== null && match.awayTeam !== null;
  const reveal = match.isLocked;
  // Only graded matches (final score in) colour picks right/wrong; until then a
  // revealed pick stays neutral.
  const graded = match.finalScore !== null;
  const s = match.outcomeSplit;
  const predictors = match.entries.filter((e) => e.hasPrediction);
  const missing = match.entries.filter((e) => !e.hasPrediction);
  const upset =
    resolved && match.finalScore
      ? upsetSide(
          match.homeTeam!.fifaRank,
          match.awayTeam!.fifaRank,
          match.finalScore.homeScore,
          match.finalScore.awayScore,
        )
      : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 font-bold uppercase tracking-[0.14em]">
            {match.bracketSlot}
          </span>
          {match.excluded ? (
            <span className="rounded-full border border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 px-2 py-0.5 font-bold uppercase tracking-[0.12em] text-[var(--accent-danger)]">
              No cuenta
            </span>
          ) : null}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3" aria-hidden />
          <LocalDateTime iso={match.kickoffAt} style="short" />
        </span>
      </div>

      {resolved ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TeamFlag teamCode={match.homeTeam!.code} teamName={match.homeTeam!.name} size="sm" />
            <span className={cn(match.advancerTeamId === match.homeTeam!.id && "text-[var(--accent-gold)]")}>
              {match.homeTeam!.code}
              {match.advancerTeamId === match.homeTeam!.id ? (
                <Crown className="ml-0.5 inline size-3 -translate-y-px text-[var(--accent-gold)]" aria-hidden />
              ) : null}
            </span>
            <RankChip rank={match.homeTeam!.fifaRank} highlight={upset === "home"} />
            <span className="text-[var(--muted-foreground)]">vs</span>
            <RankChip rank={match.awayTeam!.fifaRank} highlight={upset === "away"} />
            <span className={cn(match.advancerTeamId === match.awayTeam!.id && "text-[var(--accent-gold)]")}>
              {match.advancerTeamId === match.awayTeam!.id ? (
                <Crown className="mr-0.5 inline size-3 -translate-y-px text-[var(--accent-gold)]" aria-hidden />
              ) : null}
              {match.awayTeam!.code}
            </span>
            <TeamFlag teamCode={match.awayTeam!.code} teamName={match.awayTeam!.name} size="sm" />
          </div>
          {match.finalScore ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
              <Trophy className="size-3" aria-hidden /> {match.finalScore.homeScore}–{match.finalScore.awayScore}
              {match.decidedByPenalties ? " (pen)" : ""}
            </span>
          ) : (
            <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Por jugar
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm font-semibold text-[var(--muted-foreground)]">Equipos por confirmar</p>
      )}

      {resolved ? (
        <>
          {/* W / D / L distribution among those who picked */}
          <div className="mt-3 flex h-6 overflow-hidden rounded-md text-[10px] font-bold">
            <span className="grid place-items-center bg-[var(--accent-green)]/25 text-[var(--accent-green)]" style={{ width: `${s.home}%` }}>
              {s.home >= 12 ? `${s.home}%` : ""}
            </span>
            <span className="grid place-items-center bg-white/10 text-[var(--muted-foreground)]" style={{ width: `${s.draw}%` }}>
              {s.draw >= 12 ? `${s.draw}%` : ""}
            </span>
            <span className="grid place-items-center bg-[var(--accent-gold)]/25 text-[var(--accent-gold)]" style={{ width: `${s.away}%` }}>
              {s.away >= 12 ? `${s.away}%` : ""}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            <span>Avanza {koTeamLabel(match.homeTeam)} · {match.advanceSplit.home}%</span>
            <span>{match.advanceSplit.away}% · {koTeamLabel(match.awayTeam)}</span>
          </div>

          {/* Once locked, show the most-predicted scorelines (like the group stage). */}
          {reveal && match.topScores.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Más elegidos
              </span>
              {match.topScores.map((t) => (
                <span
                  key={t.line}
                  className="rounded-md border border-white/12 bg-white/[0.05] px-2 py-0.5 text-xs font-semibold tabular-nums"
                >
                  {t.line.replace("-", "–")} <span className="text-[var(--muted-foreground)]">×{t.count}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-teal,#1fb6a6)]"
            >
              <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
              {predictors.length}/{match.totalMembers} pronosticaron · {open ? "ocultar" : "ver lista"}
            </button>
            {missing.length > 0 && !reveal ? (
              <button
                type="button"
                onClick={() => setShowMissing((v) => !v)}
                title="Quién falta por pronosticar"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition",
                  showMissing
                    ? "border-[var(--accent-gold)]/45 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                    : "border-white/12 bg-white/[0.04] text-[var(--muted-foreground)]",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    showMissing ? "bg-[var(--accent-gold)]" : "bg-[var(--muted-foreground)]",
                  )}
                  aria-hidden
                />
                {missing.length} falta{missing.length === 1 ? "" : "n"}
              </button>
            ) : null}
          </div>

          {open ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {predictors.length === 0 ? (
                <span className="text-[10px] text-[var(--muted-foreground)]">Nadie ha pronosticado aún.</span>
              ) : (
                predictors.map((e) => {
                  // Show who each person picked to advance on EVERY pick, not just
                  // ties: a decisive scoreline implies the winner; a tie uses their
                  // penalty pick (pickedWinnerTeamId).
                  const advancer =
                    !reveal || e.homeScore === null || e.awayScore === null
                      ? null
                      : e.homeScore > e.awayScore
                        ? match.homeTeam!
                        : e.awayScore > e.homeScore
                          ? match.awayTeam!
                          : e.pickedWinnerTeamId === match.homeTeam!.id
                            ? match.homeTeam!
                            : e.pickedWinnerTeamId === match.awayTeam!.id
                              ? match.awayTeam!
                              : null;
                  return (
                    <span
                      key={e.userId}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold tabular-nums",
                        koEntryTint(e, graded),
                      )}
                    >
                      <Avatar entry={e} size={18} />
                      {e.name.split(/\s+/)[0]}{" "}
                      {reveal ? (
                        <>
                          {e.homeScore}–{e.awayScore}
                          {advancer ? (
                            <span
                              className="ml-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold"
                              title={`Pasa ${advancer.name}`}
                            >
                              <Crown className="size-2.5" aria-hidden />
                              <TeamFlag teamCode={advancer.code} teamName={advancer.name} size="sm" />
                              {advancer.code}
                            </span>
                          ) : null}
                          {e.points > 0 ? <span className="ml-0.5 text-[10px] uppercase">+{e.points}</span> : null}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[var(--accent-green)]">
                          <Check className="size-3" aria-hidden /> listo
                        </span>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          ) : null}

          {showMissing && missing.length > 0 && !reveal ? (
            <div className="mt-2 rounded-lg border border-white/8 bg-white/[0.02] p-2">
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Sin pronóstico
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((e) => (
                  <span
                    key={e.userId}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.02] px-2 py-1 text-xs text-[var(--muted-foreground)]"
                  >
                    <Avatar entry={e} size={18} />
                    {e.name.split(/\s+/)[0]}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {!reveal ? (
            <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
              Los marcadores se revelan al cierre del partido (para que nadie copie).
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function KnockoutConsensus({ data }: { data: AllPredictionsData }) {
  const rounds = data.knockoutRounds;
  const [stage, setStage] = useState(rounds[0]?.stage ?? "ROUND_OF_32");
  const round = rounds.find((r) => r.stage === stage) ?? rounds[0];

  if (!round) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted-foreground)]">
        Las eliminatorias aún no están disponibles.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {rounds.map((r) => (
          <button
            key={r.stage}
            type="button"
            onClick={() => setStage(r.stage)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition",
              r.stage === stage
                ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                : "border-white/10 bg-white/[0.03] text-[var(--muted-foreground)]",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {round.matches.map((m) => (
          <KnockoutConsensusMatch key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function ConsensusVariant({ data }: { data: AllPredictionsData }) {
  // Default to the knockouts once the group stage is fully played and a knockout
  // bracket exists — that's the live phase people come to check.
  const groupsDone = data.orderedMatches.length > 0 && data.orderedMatches.every((m) => m.finalScore);
  const hasKnockout = data.knockoutRounds.length > 0;
  const [phase, setPhase] = useState<"grupos" | "eliminatorias">(
    groupsDone && hasKnockout ? "eliminatorias" : "grupos",
  );

  const jornadas = useMemo(
    () => Array.from(new Set(data.orderedMatches.map((m) => m.jornada))).sort((a, b) => a - b),
    [data.orderedMatches],
  );

  // Open on the earliest matchday that still has an unfinished match (the round
  // most likely "in play"); fall back to the last one once all are done.
  const defaultJornada = useMemo(() => {
    for (const j of jornadas) {
      if (data.orderedMatches.some((m) => m.jornada === j && !m.finalScore)) return j;
    }
    return jornadas[jornadas.length - 1] ?? 1;
  }, [jornadas, data.orderedMatches]);

  const [jornada, setJornada] = useState(defaultJornada);
  const matches = data.orderedMatches.filter((m) => m.jornada === jornada);

  return (
    <div>
      {hasKnockout ? (
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {(["grupos", "eliminatorias"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhase(p)}
              className={cn(
                "rounded-lg border px-2 py-2 text-sm font-bold capitalize transition",
                p === phase
                  ? "border-[var(--accent-gold)]/55 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                  : "border-white/10 bg-white/[0.03] text-[var(--muted-foreground)]",
              )}
            >
              {p === "grupos" ? "Fase de grupos" : "Eliminatorias"}
            </button>
          ))}
        </div>
      ) : null}

      {phase === "eliminatorias" ? (
        <KnockoutConsensus data={data} />
      ) : (
        <>
      <div className="sticky top-0 z-10 -mx-4 mb-3 flex gap-1.5 border-b border-white/8 bg-[#06100d]/90 px-4 py-2 backdrop-blur">
        {jornadas.map((j) => {
          const live = data.orderedMatches.some((m) => m.jornada === j && m.status === "LIVE");
          return (
            <button
              key={j}
              type="button"
              onClick={() => setJornada(j)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition",
                j === jornada
                  ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                  : "border-white/10 bg-white/[0.03] text-[var(--muted-foreground)]",
              )}
            >
              Jornada {j}
              {live ? (
                <span className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-[var(--accent-danger)] align-middle" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="space-y-2.5">
        {matches.map((m) => (
          <ConsensusMatch key={m.id} match={m} />
        ))}
      </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Proposal 2 — Grid ---------------- */

function GridVariant({ data }: { data: AllPredictionsData }) {
  const [groupCode, setGroupCode] = useState(data.groups[0]?.code ?? "");
  const group = data.groups.find((g) => g.code === groupCode) ?? data.groups[0];

  // Roster = every member who appears in this group's predictions, sorted by name.
  const { roster, byUser } = useMemo(() => {
    const map = new Map<string, { name: string; avatarColor: string }>();
    const cells = new Map<string, Map<string, AllPredEntry>>();
    for (const m of group?.matches ?? []) {
      for (const e of m.entries) {
        map.set(e.userId, { name: e.name, avatarColor: e.avatarColor });
        if (!cells.has(e.userId)) cells.set(e.userId, new Map());
        cells.get(e.userId)!.set(m.id, e);
      }
    }
    const roster = Array.from(map.entries())
      .map(([userId, u]) => ({ userId, ...u }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return { roster, byUser: cells };
  }, [group]);

  if (!group) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {data.groups.map((g) => (
          <button
            key={g.code}
            type="button"
            onClick={() => setGroupCode(g.code)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-bold",
              g.code === groupCode
                ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                : "border-white/12 bg-white/[0.04] text-[var(--muted-foreground)]",
            )}
          >
            {g.code}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr className="bg-white/[0.04]">
              <th className="sticky left-0 z-10 bg-[#0b1512] px-3 py-2 text-left font-bold text-[var(--muted-foreground)]">
                Jugador
              </th>
              {group.matches.map((m) => (
                <th key={m.id} className="px-2 py-2 text-center font-semibold">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <TeamFlag teamCode={m.homeTeam.code} teamName={m.homeTeam.name} size="sm" />
                      <TeamFlag teamCode={m.awayTeam.code} teamName={m.awayTeam.name} size="sm" />
                    </div>
                    <span className="text-[9px] text-[var(--muted-foreground)]">
                      {m.homeTeam.code}-{m.awayTeam.code}
                    </span>
                    {m.finalScore ? (
                      <span className="text-[9px] font-bold text-[var(--accent-gold)]">
                        {m.finalScore.homeScore}–{m.finalScore.awayScore}
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map((u) => (
              <tr key={u.userId} className="border-t border-white/8">
                <td className="sticky left-0 z-10 bg-[#0b1512] px-3 py-1.5">
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Avatar entry={u} size={20} />
                    {u.name.split(/\s+/)[0]}
                  </span>
                </td>
                {group.matches.map((m) => {
                  const e = byUser.get(u.userId)?.get(m.id);
                  const graded = m.finalScore !== null;
                  return (
                    <td key={m.id} className="px-2 py-1.5 text-center">
                      {e ? (
                        <span
                          className={cn(
                            "inline-block rounded border px-1.5 py-0.5 font-semibold tabular-nums",
                            scoreTint(e, graded),
                          )}
                        >
                          {e.homeScore}–{e.awayScore}
                        </span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
        Desliza horizontalmente para ver todos los partidos. Verde = marcador exacto, dorado =
        resultado acertado, rojo = fallado.
      </p>
    </div>
  );
}

/* ---------------- Proposal 3 — Cards ---------------- */

function CardMatch({ match }: { match: AllPredMatch }) {
  const [open, setOpen] = useState(false);
  const graded = match.finalScore !== null;
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
      >
        <MatchTeams match={match} />
        <div className="flex items-center gap-2">
          <FinalBadge match={match} />
          <span className="whitespace-nowrap rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
            {match.totalPicks} pronósticos
          </span>
          <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
        </div>
      </button>
      {open ? (
        <ul className="divide-y divide-white/6 border-t border-white/8">
          {match.entries.map((e) => (
            <li key={e.userId} className="flex items-center justify-between gap-3 px-3.5 py-2">
              <span className="flex items-center gap-2 text-sm">
                <Avatar entry={e} size={24} />
                {e.name}
              </span>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-sm font-bold tabular-nums",
                  scoreTint(e, graded),
                )}
              >
                {e.homeScore}–{e.awayScore}
                {graded && e.points > 0 ? (
                  <span className="ml-1 text-[10px] font-semibold uppercase">+{e.points}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function CardsVariant({ data }: { data: AllPredictionsData }) {
  return (
    <div className="space-y-5">
      {data.groups.map((g) => (
        <section key={g.code}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Grupo {g.code}
          </h3>
          <div className="space-y-2.5">
            {g.matches.map((m) => (
              <CardMatch key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------- Shell ---------------- */

export function PreviewBoard({
  data,
  only,
  embedded = false,
}: {
  data: AllPredictionsData;
  only?: Variant;
  embedded?: boolean;
}) {
  const [variant, setVariant] = useState<Variant>(only ?? "consensus");
  const active = VARIANTS.find((v) => v.key === (only ?? variant))!;

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-3xl px-4 py-6"}>
      <header className="mb-4">
        <h1 className="text-xl font-bold">Pronósticos de todos</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {data.memberCount} participantes · {data.lockedCount} partidos revelados (solo se muestran
          tras el cierre, para que nadie copie).
        </p>
        {!embedded ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--accent-teal,#1fb6a6)]">
            <Lock className="size-3" aria-hidden /> Vista previa local · datos reales del VPS
          </p>
        ) : null}
      </header>

      {embedded ? null : only ? (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-sm font-bold text-[var(--accent-gold)]">{active.label}</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">{active.blurb}</p>
        </div>
      ) : (
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-white/8 bg-[#06100d]/90 px-4 py-2 backdrop-blur">
          <div className="flex gap-1.5">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setVariant(v.key)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition",
                  v.key === variant
                    ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                    : "border-white/10 bg-white/[0.03] text-[var(--muted-foreground)]",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">{active.blurb}</p>
        </div>
      )}

      {(only ?? variant) === "consensus" ? <ConsensusVariant data={data} /> : null}
      {(only ?? variant) === "grid" ? <GridVariant data={data} /> : null}
      {(only ?? variant) === "cards" ? <CardsVariant data={data} /> : null}
    </div>
  );
}
