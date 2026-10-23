"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";

import { TeamFlag } from "@/components/teams/team-flag";
import type { BonusCategory, BonusPickData, BonusTeamOption } from "@/lib/bonus/data";
import { bonusMessages } from "@/lib/bonus/messages";
import { cn } from "@/lib/utils";

const TEAM_CATEGORIES: BonusCategory[] = ["CHAMPION", "RUNNER_UP", "THIRD_PLACE"];

interface BonusPickCardProps {
  category: BonusCategory;
  pick: BonusPickData | null;
  teams: BonusTeamOption[];
  quinielaId: string;
  locked: boolean;
}

export function BonusPickCard({
  category,
  pick,
  teams,
  quinielaId,
  locked,
}: BonusPickCardProps) {
  const meta = bonusMessages.categories[category];
  const isTeamPick = TEAM_CATEGORIES.includes(category);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [playerInput, setPlayerInput] = useState(pick?.playerName ?? "");
  const [selectedTeamId, setSelectedTeamId] = useState(pick?.teamId ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  function save(teamId?: string, playerName?: string) {
    startTransition(async () => {
      const res = await fetch("/api/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quinielaId,
          category,
          teamId: teamId ?? null,
          playerName: playerName ?? null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const teamId = e.target.value;
    if (!teamId) return;
    setSelectedTeamId(teamId);
    save(teamId);
  }

  function handlePlayerSubmit() {
    const name = playerInput.trim();
    if (!name) return;
    save(undefined, name);
  }

  const hasPick = isTeamPick ? !!selectedTeamId : !!pick?.playerName;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition",
        hasPick
          ? "border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/[0.04]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="text-2xl leading-none">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{meta.label}</h3>
            <span className="rounded-full bg-[var(--accent-gold)]/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-[var(--accent-gold)]">
              {meta.points} pts
            </span>
            {saved && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <Check className="size-3" /> {bonusMessages.actions.saved}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {meta.description}
          </p>

          {locked ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
              <Lock className="size-3.5" />
              {isTeamPick && selectedTeam ? (
                <span className="flex items-center gap-1.5">
                  <TeamFlag teamCode={selectedTeam.code} teamName={selectedTeam.name} size="sm" />
                  {selectedTeam.name}
                </span>
              ) : pick?.playerName ? (
                pick.playerName
              ) : (
                bonusMessages.actions.locked
              )}
            </div>
          ) : isTeamPick ? (
            <div className="mt-3 flex items-center gap-2">
              {selectedTeam && (
                <TeamFlag teamCode={selectedTeam.code} teamName={selectedTeam.name} size="sm" />
              )}
              <select
                value={selectedTeamId ?? ""}
                onChange={handleTeamChange}
                disabled={isPending}
                className={cn(
                  "w-full appearance-none rounded-lg border px-3 py-2.5 text-sm font-semibold transition sm:w-auto sm:min-w-[220px]",
                  selectedTeam
                    ? "border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/[0.06] text-[var(--foreground)]"
                    : "border-white/12 bg-white/[0.04] text-[var(--muted-foreground)]",
                )}
              >
                <option value="" disabled>{bonusMessages.actions.pick}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePlayerSubmit();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                placeholder={bonusMessages.actions.playerPlaceholder}
                disabled={isPending}
                className="w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-gold)]/40 focus:outline-none sm:max-w-[220px]"
              />
              <button
                type="submit"
                disabled={isPending || !playerInput.trim()}
                className="shrink-0 rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 px-4 py-2 text-sm font-semibold text-[var(--accent-gold)] transition hover:bg-[var(--accent-gold)]/20 disabled:opacity-40"
              >
                {pick?.playerName ? bonusMessages.actions.change : bonusMessages.actions.pick}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
