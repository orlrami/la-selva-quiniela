import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import { PagePlaceholder } from "@/components/app/page-placeholder";
import { BonusBoard } from "@/components/bonus/bonus-board";
import { PredictionsBoard } from "@/components/predictions/predictions-board";
import { appMessages } from "@/lib/app/messages";
import { getBonusBoard } from "@/lib/bonus/data";
import { requireUser } from "@/lib/dal";
import { getKnockoutBoard, getPredictionsBoard } from "@/lib/predictions/data";
import { predictionMessages } from "@/lib/predictions/messages";

export const metadata: Metadata = {
  title: `${predictionMessages.page.title} · ${appMessages.brand.name}`,
};

export default async function PredictionsPage() {
  const user = await requireUser();
  const [board, knockout, bonus] = await Promise.all([
    getPredictionsBoard(user.id),
    getKnockoutBoard(user.id),
    getBonusBoard(user.id),
  ]);

  if (!board || board.groups.length === 0) {
    return (
      <PagePlaceholder
        title={predictionMessages.empty.title}
        subtitle={predictionMessages.empty.description}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
              {board.quiniela.name}
            </p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {predictionMessages.page.title}
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-sm font-semibold tabular-nums">
            <ClipboardCheck
              className="size-4 text-[var(--accent-gold)]"
              aria-hidden
            />
            {predictionMessages.page.progressLabel(
              board.totals.completed,
              board.totals.total,
            )}
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {predictionMessages.page.subtitle}
        </p>
      </header>

      <PredictionsBoard board={board} knockout={knockout} />

      {bonus && <BonusBoard data={bonus} />}
    </div>
  );
}
