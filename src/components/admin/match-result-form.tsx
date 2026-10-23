"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { CalendarClock, CheckCircle2, MapPin, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/ui/local-datetime";
import { TeamFlag } from "@/components/teams/team-flag";
import {
  clearMatchResultAction,
  setMatchResultAction,
} from "@/lib/admin/actions";
import { adminMessages } from "@/lib/admin/messages";
import type { AdminMatch } from "@/lib/admin/data";
import { cn } from "@/lib/utils";

type Toast =
  | { kind: "saved" }
  | { kind: "cleared" }
  | { kind: "error"; message: string };

interface MatchResultFormProps {
  match: AdminMatch;
}

export function MatchResultForm({ match }: MatchResultFormProps) {
  const [home, setHome] = useState<number>(match.result?.homeScore ?? 0);
  const [away, setAway] = useState<number>(match.result?.awayScore ?? 0);
  const [savePending, startSave] = useTransition();
  const [clearPending, startClear] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);

  function flashToast(next: Toast) {
    setToast(next);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("matchId", match.id);
    startSave(async () => {
      const result = await setMatchResultAction(null, formData);
      if (result.ok) {
        flashToast({ kind: "saved" });
      } else if (result.formError) {
        flashToast({ kind: "error", message: result.formError });
      }
    });
  }

  function handleClear() {
    const formData = new FormData();
    formData.set("matchId", match.id);
    startClear(async () => {
      const result = await clearMatchResultAction(null, formData);
      if (result.ok) {
        setHome(0);
        setAway(0);
        flashToast({ kind: "cleared" });
      } else if (result.formError) {
        flashToast({ kind: "error", message: result.formError });
      }
    });
  }

  const hasResult = match.result !== null;
  const inFlight = savePending || clearPending;

  return (
    <article
      className={cn(
        "grid gap-4 rounded-xl border bg-white/[0.04] p-4 transition",
        hasResult
          ? "border-[var(--accent-gold)]/30"
          : "border-white/12 hover:border-white/22",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
            Grupo {match.groupCode}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden />
            <LocalDateTime iso={match.kickoffAt} style="short" />
          </span>
        </div>
        {hasResult ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
            {adminMessages.matches.finalBadge}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            {adminMessages.matches.scheduledBadge}
          </span>
        )}
      </header>

      {!match.homeTeam || !match.awayTeam ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-[var(--muted-foreground)]">
          Equipos por confirmar. Se completarán automáticamente cuando termine
          la ronda anterior.
        </p>
      ) : (
      <form onSubmit={handleSave} className="grid gap-4">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_auto_auto_1fr] sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <TeamFlag
              teamCode={match.homeTeam.code}
              teamName={match.homeTeam.name}
              size="md"
            />
            <span className="truncate text-base font-semibold">
              {match.homeTeam.name}
            </span>
          </div>

          <label className="grid gap-1 text-xs text-[var(--muted-foreground)] sm:text-center">
            <span className="sr-only">{adminMessages.matches.formHomeLabel}</span>
            <input
              type="number"
              name="homeScore"
              min={0}
              max={20}
              value={home}
              onChange={(e) =>
                setHome(Math.max(0, Math.min(20, Number(e.target.value) || 0)))
              }
              className="h-12 w-20 rounded-lg border border-white/12 bg-[#081411]/80 text-center text-xl font-bold tabular-nums outline-none focus:border-[var(--accent-teal)] focus:ring-4 focus:ring-[var(--accent-teal)]/15"
              required
            />
          </label>

          <span className="hidden text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:block">
            vs
          </span>

          <label className="grid gap-1 text-xs text-[var(--muted-foreground)] sm:text-center">
            <span className="sr-only">{adminMessages.matches.formAwayLabel}</span>
            <input
              type="number"
              name="awayScore"
              min={0}
              max={20}
              value={away}
              onChange={(e) =>
                setAway(Math.max(0, Math.min(20, Number(e.target.value) || 0)))
              }
              className="h-12 w-20 rounded-lg border border-white/12 bg-[#081411]/80 text-center text-xl font-bold tabular-nums outline-none focus:border-[var(--accent-teal)] focus:ring-4 focus:ring-[var(--accent-teal)]/15"
              required
            />
          </label>

          <div className="flex min-w-0 items-center gap-2 sm:justify-end">
            <span className="truncate text-base font-semibold">
              {match.awayTeam.name}
            </span>
            <TeamFlag
              teamCode={match.awayTeam.code}
              teamName={match.awayTeam.name}
              size="md"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <MapPin className="size-3.5" aria-hidden />
            {match.venue} · {match.city}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {toast ? (
              toast.kind === "saved" ? (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--accent-green)]">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {adminMessages.matches.saved}
                </span>
              ) : toast.kind === "cleared" ? (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <Trash2 className="size-3.5" aria-hidden />
                  {adminMessages.matches.cleared}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--accent-danger)]">
                  <TriangleAlert className="size-3.5" aria-hidden />
                  {toast.message}
                </span>
              )
            ) : null}
            <Button type="submit" size="sm" loading={savePending} disabled={inFlight}>
              {savePending
                ? adminMessages.matches.savingCta
                : adminMessages.matches.saveCta}
            </Button>
            {hasResult ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                loading={clearPending}
                disabled={inFlight}
                onClick={handleClear}
              >
                {clearPending
                  ? adminMessages.matches.clearedCta
                  : adminMessages.matches.clearCta}
              </Button>
            ) : null}
          </div>
        </div>

        {match.predictionCount > 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            {match.predictionCount}{" "}
            {match.predictionCount === 1
              ? "pronóstico registrado"
              : "pronósticos registrados"}
            .
          </p>
        ) : null}
      </form>
      )}
    </article>
  );
}
