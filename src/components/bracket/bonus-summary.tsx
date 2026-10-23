import { Sparkles } from "lucide-react";

import { TeamFlag } from "@/components/teams/team-flag";
import type { BonusCategory, BonusPickData } from "@/lib/bonus/data";
import { bonusMessages } from "@/lib/bonus/messages";

const ORDER: BonusCategory[] = [
  "CHAMPION",
  "RUNNER_UP",
  "THIRD_PLACE",
  "GOLDEN_BOOT",
  "GOLDEN_GLOVE",
  "GOLDEN_BALL",
];
const TEAM_CATEGORIES = new Set<BonusCategory>(["CHAMPION", "RUNNER_UP", "THIRD_PLACE"]);

/** The player's special (bonus) picks, shown alongside the bracket. */
export function BonusSummary({ picks }: { picks: BonusPickData[] }) {
  const byCat = new Map(picks.map((p) => [p.category, p]));
  return (
    <aside className="grid h-fit gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 lg:ml-auto lg:max-w-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[var(--accent-gold)]" aria-hidden />
        <h2 className="text-sm font-semibold">Tus predicciones especiales</h2>
      </div>
      <ul className="grid gap-1">
        {ORDER.map((cat) => {
          const meta = bonusMessages.categories[cat];
          const pick = byCat.get(cat);
          const isTeam = TEAM_CATEGORIES.has(cat);
          return (
            <li
              key={cat}
              className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-xs odd:bg-white/[0.02]"
            >
              <span className="shrink-0 text-[var(--muted-foreground)]">
                {meta.emoji} {meta.label}
              </span>
              <span className="flex min-w-0 items-center justify-end gap-1.5 font-semibold">
                {isTeam && pick?.teamCode ? (
                  <>
                    <TeamFlag teamCode={pick.teamCode} teamName={pick.teamName ?? ""} size="sm" />
                    <span className="truncate">{pick.teamName}</span>
                  </>
                ) : !isTeam && pick?.playerName ? (
                  <span className="truncate">{pick.playerName}</span>
                ) : (
                  <span className="text-[var(--muted-foreground)]">Sin elegir</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
