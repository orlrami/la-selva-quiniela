import type { BonusBoardData, BonusCategory } from "@/lib/bonus/data";
import { bonusMessages } from "@/lib/bonus/messages";

import { BonusPickCard } from "./bonus-pick-card";

const CATEGORIES: BonusCategory[] = [
  "CHAMPION",
  "RUNNER_UP",
  "THIRD_PLACE",
  "GOLDEN_BOOT",
  "GOLDEN_GLOVE",
  "GOLDEN_BALL",
];

interface BonusBoardProps {
  data: BonusBoardData;
}

export function BonusBoard({ data }: BonusBoardProps) {
  const pickMap = new Map(data.picks.map((p) => [p.category, p]));

  return (
    <section className="grid gap-4">
      <header className="grid gap-1">
        <h2 className="text-lg font-bold">{bonusMessages.section.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {bonusMessages.section.subtitle}
        </p>
      </header>

      <div className="grid gap-3">
        {CATEGORIES.map((cat) => (
          <BonusPickCard
            key={cat}
            category={cat}
            pick={pickMap.get(cat) ?? null}
            teams={data.teams}
            quinielaId={data.quinielaId}
            locked={data.locked}
          />
        ))}
      </div>
    </section>
  );
}
