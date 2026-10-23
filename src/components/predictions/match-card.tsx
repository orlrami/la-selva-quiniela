"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  MapPin,
  TriangleAlert,
} from "lucide-react";

import { Countdown } from "@/components/ui/countdown";
import { LocalDateTime } from "@/components/ui/local-datetime";
import { TeamFlag } from "@/components/teams/team-flag";
import { RankChip, upsetSide } from "@/components/teams/rank-chip";
import { predictionMessages } from "@/lib/predictions/messages";
import type {
  PredictionBoardMatch,
  PredictionTeam,
} from "@/lib/predictions/data";
import { cn } from "@/lib/utils";

import { ScoreStepper } from "./score-stepper";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface MatchCardProps {
  match: PredictionBoardMatch;
  onPredictionSaved?: (matchId: string, homeScore: number, awayScore: number) => void;
}

function TeamLine({
  team,
  align,
  upset = false,
  showRank = true,
}: {
  team: PredictionTeam;
  align: "start" | "end";
  upset?: boolean;
  showRank?: boolean;
}) {
  const name = <span className="truncate text-base font-semibold">{team.name}</span>;
  const flag = <TeamFlag teamCode={team.code} teamName={team.name} size="md" />;
  const chip = showRank ? <RankChip rank={team.fifaRank} highlight={upset} /> : null;
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "end" && "justify-end",
      )}
    >
      {align === "end" ? (
        <>
          {chip}
          {name}
          {flag}
        </>
      ) : (
        <>
          {flag}
          {name}
          {chip}
        </>
      )}
    </div>
  );
}

export function MatchCard({ match, onPredictionSaved }: MatchCardProps) {
  const [home, setHome] = useState<number | null>(
    match.prediction?.homeScore ?? null,
  );
  const [away, setAway] = useState<number | null>(
    match.prediction?.awayScore ?? null,
  );
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastSaved = useRef<{ home: number | null; away: number | null }>({
    home: match.prediction?.homeScore ?? null,
    away: match.prediction?.awayScore ?? null,
  });

  const persist = useCallback(
    async (nextHome: number, nextAway: number) => {
      setStatus("saving");
      setErrorMessage(null);
      try {
        const response = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: match.id,
            homeScore: nextHome,
            awayScore: nextAway,
          }),
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
        };
        if (response.ok && payload.ok) {
          lastSaved.current = { home: nextHome, away: nextAway };
          onPredictionSaved?.(match.id, nextHome, nextAway);
          setStatus("saved");
        } else {
          setStatus("error");
          setErrorMessage(payload.error ?? predictionMessages.errors.server);
        }
      } catch {
        setStatus("error");
        setErrorMessage(predictionMessages.errors.server);
      }
    },
    [match.id, onPredictionSaved],
  );

  // Debounced auto-save when both fields filled and value changed.
  useEffect(() => {
    if (match.isLocked) return;
    if (home === null || away === null) return;
    if (
      lastSaved.current.home === home &&
      lastSaved.current.away === away
    ) {
      return;
    }
    const id = window.setTimeout(() => {
      void persist(home, away);
    }, 600);
    return () => window.clearTimeout(id);
  }, [home, away, match.isLocked, persist]);

  // Fade "saved" back to idle after 2s.
  useEffect(() => {
    if (status !== "saved") return;
    const id = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(id);
  }, [status]);

  // When a user sets the first goal on one side, default the other side to 0 so
  // a scoreline like 2–0 saves immediately (no need to bump-and-clear the rival).
  const handleHomeChange = useCallback((next: number) => {
    setHome(next);
    setAway((prev) => (prev === null ? 0 : prev));
  }, []);
  const handleAwayChange = useCallback((next: number) => {
    setAway(next);
    setHome((prev) => (prev === null ? 0 : prev));
  }, []);

  // Graded state: the match has an official score, so colour the square and the
  // user's predicted score by how they did.
  //   square: green = right outcome, red = wrong outcome
  //   score:  green = exact, gold/yellow = right outcome only, red = wrong
  const graded = match.finalScore !== null;
  const pred = match.prediction;
  const hasPick =
    pred != null && pred.homeScore !== null && pred.awayScore !== null;
  const correctOutcome = pred?.correctOutcome ?? false;
  const exactScore = pred?.exactScore ?? false;
  const earnedPoints = pred?.points ?? 0;

  // Upset = the lower-ranked (weaker) team won. Only meaningful once graded.
  const upset = graded
    ? upsetSide(
        match.homeTeam.fifaRank,
        match.awayTeam.fifaRank,
        match.finalScore!.homeScore,
        match.finalScore!.awayScore,
      )
    : null;

  const gradedTint = correctOutcome
    ? "border-[var(--accent-green)]/45 bg-[var(--accent-green)]/8"
    : hasPick
      ? "border-[var(--accent-danger)]/45 bg-[var(--accent-danger)]/8"
      : "border-white/10 bg-white/[0.03]";

  const scoreColor = exactScore
    ? "text-[var(--accent-green)]"
    : correctOutcome
      ? "text-[var(--accent-gold)]"
      : "text-[var(--accent-danger)]";

  return (
    <article
      className={cn(
        "grid gap-4 rounded-xl border p-4 transition",
        graded
          ? gradedTint
          : match.isLocked
            ? "border-white/8 bg-white/[0.04] opacity-90"
            : "border-white/12 bg-white/[0.04] hover:border-white/22",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
            {predictionMessages.group.label(match.groupCode)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden />
            <LocalDateTime iso={match.kickoffAt} style="short" />
          </span>
        </div>
        {match.isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-danger)]/40 bg-[var(--accent-danger)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-danger)]">
            <LockKeyhole className="size-3" aria-hidden />
            {predictionMessages.card.locked}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            {predictionMessages.card.closesIn}{" "}
            <Countdown toIso={match.lockAt} closedLabel={predictionMessages.card.locked} />
          </span>
        )}
      </header>

      {graded ? (
        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamLine team={match.homeTeam} align="start" upset={upset === "home"} showRank={false} />
            <div className="flex flex-col items-center gap-0.5">
              {hasPick ? (
                <span
                  className={cn(
                    "text-2xl font-bold leading-none tabular-nums",
                    scoreColor,
                  )}
                >
                  {pred!.homeScore}–{pred!.awayScore}
                </span>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  {predictionMessages.card.noPick}
                </span>
              )}
              <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {predictionMessages.card.yourPrediction}
              </span>
            </div>
            <TeamLine team={match.awayTeam} align="end" upset={upset === "away"} showRank={false} />
          </div>

          {upset ? (
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
              ⚡ Sorpresa — ganó el peor clasificado
            </p>
          ) : null}

          <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {match.venue} · {match.city}
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
                {predictionMessages.card.finalResult}{" "}
                {match.finalScore!.homeScore}–{match.finalScore!.awayScore}
              </span>
              {hasPick ? (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                    earnedPoints > 0
                      ? "border-[var(--accent-green)]/40 bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                      : "border-white/12 bg-white/[0.05] text-[var(--muted-foreground)]",
                  )}
                >
                  {earnedPoints > 0
                    ? predictionMessages.card.points(earnedPoints)
                    : "0 pts"}
                </span>
              ) : null}
            </div>
          </footer>
        </div>
      ) : (
        <>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_auto_auto_1fr] sm:gap-4">
        <TeamLine team={match.homeTeam} align="start" />
        <div className="hidden sm:block">
          <ScoreStepper
            value={home}
            onChange={handleHomeChange}
            disabled={match.isLocked}
            ariaLabel={`Marcador de ${match.homeTeam.name}`}
          />
        </div>
        <span className="hidden text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:block">
          vs
        </span>
        <div className="hidden sm:block">
          <ScoreStepper
            value={away}
            onChange={handleAwayChange}
            disabled={match.isLocked}
            ariaLabel={`Marcador de ${match.awayTeam.name}`}
          />
        </div>
        <TeamLine team={match.awayTeam} align="end" />

        <div className="col-span-full grid grid-cols-2 gap-3 sm:hidden">
          <div className="flex justify-center">
            <ScoreStepper
              value={home}
              onChange={setHome}
              disabled={match.isLocked}
              ariaLabel={`Marcador de ${match.homeTeam.name}`}
            />
          </div>
          <div className="flex justify-center">
            <ScoreStepper
              value={away}
              onChange={setAway}
              disabled={match.isLocked}
              ariaLabel={`Marcador de ${match.awayTeam.name}`}
            />
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden />
          {match.venue} · {match.city}
        </span>

        <div className="flex min-h-5 items-center">
          {match.finalScore ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
              {predictionMessages.card.finalResult} {match.finalScore.homeScore}–
              {match.finalScore.awayScore}
            </span>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {status === "saving" ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]"
                >
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  {predictionMessages.card.saving}
                </motion.span>
              ) : null}
              {status === "saved" ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 text-[var(--accent-green)]"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {predictionMessages.card.saved}
                </motion.span>
              ) : null}
              {status === "error" ? (
                <motion.span
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 text-[var(--accent-danger)]"
                >
                  <TriangleAlert className="size-3.5" aria-hidden />
                  <span>{errorMessage ?? predictionMessages.card.error}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (home !== null && away !== null) {
                        void persist(home, away);
                      }
                    }}
                    className="rounded border border-[var(--accent-danger)]/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] hover:bg-[var(--accent-danger)]/12"
                  >
                    {predictionMessages.card.retry}
                  </button>
                </motion.span>
              ) : null}
              {status === "idle" && (home === null || away === null) ? (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--muted-foreground)]"
                >
                  {predictionMessages.card.empty}
                </motion.span>
              ) : null}
            </AnimatePresence>
          )}
        </div>
      </footer>
        </>
      )}
    </article>
  );
}
