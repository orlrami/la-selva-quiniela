"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Crown,
  Loader2,
  LockKeyhole,
  TriangleAlert,
} from "lucide-react";

import { LocalDateTime } from "@/components/ui/local-datetime";
import { TeamFlag } from "@/components/teams/team-flag";
import { predictionMessages } from "@/lib/predictions/messages";
import type { KnockoutMatch } from "@/lib/predictions/data";
import { cn } from "@/lib/utils";

import { ScoreStepper } from "./score-stepper";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface KnockoutPickCardProps {
  match: KnockoutMatch;
}

export function KnockoutPickCard({ match }: KnockoutPickCardProps) {
  const [homeScore, setHomeScore] = useState<number | null>(
    match.prediction?.homeScore ?? null,
  );
  const [awayScore, setAwayScore] = useState<number | null>(
    match.prediction?.awayScore ?? null,
  );
  const [picked, setPicked] = useState<string | null>(match.pickedWinnerTeamId);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef(false);
  const lastSaved = useRef({
    homeScore: match.prediction?.homeScore ?? null,
    awayScore: match.prediction?.awayScore ?? null,
    picked: match.pickedWinnerTeamId,
  });

  useEffect(() => {
    if (status !== "saved") return;
    const id = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(id);
  }, [status]);

  const lockedOrUndecided =
    match.isLocked || !match.homeTeam || !match.awayTeam;

  const isTied = homeScore !== null && awayScore !== null && homeScore === awayScore;
  const needsPenaltyPick = isTied;

  function resolveWinner(h: number | null, a: number | null, pick: string | null): string | null {
    if (h === null || a === null) return null;
    if (h !== a) {
      return h > a ? (match.homeTeam?.id ?? null) : (match.awayTeam?.id ?? null);
    }
    return pick;
  }

  function scheduleSave(h: number | null, a: number | null, winner: string | null) {
    if (lockedOrUndecided) return;
    if (h === null || a === null) return;
    if (!winner) return;
    if (
      h === lastSaved.current.homeScore &&
      a === lastSaved.current.awayScore &&
      winner === lastSaved.current.picked
    ) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void persist(h, a, winner), 500);
  }

  async function persist(h: number, a: number, winner: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: h,
          awayScore: a,
          pickedWinnerTeamId: winner,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (response.ok && payload.ok) {
        lastSaved.current = { homeScore: h, awayScore: a, picked: winner };
        setStatus("saved");
      } else {
        setStatus("error");
        setErrorMessage(payload.error ?? predictionMessages.errors.server);
      }
    } catch {
      setStatus("error");
      setErrorMessage(predictionMessages.errors.server);
    } finally {
      inFlight.current = false;
    }
  }

  function handleScoreChange(side: "home" | "away", value: number) {
    const nextHome = side === "home" ? value : homeScore;
    const nextAway = side === "away" ? value : awayScore;
    if (side === "home") setHomeScore(value);
    else setAwayScore(value);

    const winner = resolveWinner(nextHome, nextAway, picked);
    if (nextHome !== null && nextAway !== null && nextHome !== nextAway) {
      setPicked(winner);
    }
    scheduleSave(nextHome, nextAway, winner);
  }

  function handlePenaltyPick(teamId: string) {
    if (lockedOrUndecided) return;
    setPicked(teamId);
    scheduleSave(homeScore, awayScore, teamId);
  }

  return (
    <article
      className={cn(
        "grid gap-4 rounded-xl border bg-white/[0.04] p-4 transition",
        match.winnerTeamId
          ? "border-[var(--accent-gold)]/30"
          : "border-white/12 hover:border-white/22",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
            {match.bracketSlot}
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
        ) : null}
      </header>

      {match.homeTeam && match.awayTeam ? (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <TeamFlag teamCode={match.homeTeam.code} teamName={match.homeTeam.name} size="lg" />
              <span className="truncate text-sm font-semibold">{match.homeTeam.shortName}</span>
              <ScoreStepper
                value={homeScore}
                onChange={(v) => handleScoreChange("home", v)}
                disabled={lockedOrUndecided}
                ariaLabel={match.homeTeam.shortName}
              />
            </div>
            <span className="self-center text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              vs
            </span>
            <div className="flex flex-col items-center gap-2">
              <TeamFlag teamCode={match.awayTeam.code} teamName={match.awayTeam.name} size="lg" />
              <span className="truncate text-sm font-semibold">{match.awayTeam.shortName}</span>
              <ScoreStepper
                value={awayScore}
                onChange={(v) => handleScoreChange("away", v)}
                disabled={lockedOrUndecided}
                ariaLabel={match.awayTeam.shortName}
              />
            </div>
          </div>

          {needsPenaltyPick && !lockedOrUndecided ? (
            <div className="grid gap-2">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-teal)]">
                ¿Quién gana en penales?
              </p>
              <div className="flex justify-center gap-3">
                <PenaltyButton
                  team={match.homeTeam}
                  selected={picked === match.homeTeam.id}
                  onClick={() => handlePenaltyPick(match.homeTeam!.id)}
                />
                <PenaltyButton
                  team={match.awayTeam}
                  selected={picked === match.awayTeam.id}
                  onClick={() => handlePenaltyPick(match.awayTeam!.id)}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamPlaceholder />
          <span className="self-center text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            vs
          </span>
          <TeamPlaceholder />
        </div>
      )}

      <footer className="flex min-h-5 flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
        {match.winnerTeamId ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
            <Crown className="size-3" aria-hidden />
            Ganador definido
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
            ) : status === "saved" ? (
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
            ) : status === "error" ? (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5 text-[var(--accent-danger)]"
              >
                <TriangleAlert className="size-3.5" aria-hidden />
                {errorMessage ?? predictionMessages.card.error}
              </motion.span>
            ) : homeScore === null && !lockedOrUndecided ? (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[var(--muted-foreground)]"
              >
                Ingresa el marcador
              </motion.span>
            ) : null}
          </AnimatePresence>
        )}
      </footer>
    </article>
  );
}

function TeamPlaceholder() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-[var(--muted-foreground)]">
      Por confirmar
    </div>
  );
}

interface PenaltyButtonProps {
  team: { id: string; code: string; shortName: string; name: string };
  selected: boolean;
  onClick: () => void;
}

function PenaltyButton({ team, selected, onClick }: PenaltyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        selected
          ? "border-[var(--accent-gold)]/55 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
          : "border-white/10 bg-white/[0.04] text-[var(--foreground)] hover:border-white/22",
      )}
    >
      <TeamFlag teamCode={team.code} teamName={team.name} size="sm" />
      {team.shortName}
    </button>
  );
}
