import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export interface StageDeadline {
  stage: string;
  label: string;
  firstKickoff: Date;
  lockAt: Date;
}

// Group closes 30 min before its first match; every knockout match closes 30 min
// before its own kickoff (see knockoutLockMs). The per-stage row below shows the
// group's single time and, for knockout, the lead is rendered as text per-match.
const LOCK_LEAD_MS = 30 * 60 * 1000;

const STAGE_ORDER = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Fase de Grupos + Bonus",
  ROUND_OF_32: "Ronda de 32",
  ROUND_OF_16: "Octavos de Final",
  QUARTER_FINAL: "Cuartos de Final",
  SEMI_FINAL: "Semifinales",
  THIRD_PLACE: "Tercer Lugar",
  FINAL: "Final",
};

export const getStageDeadlines = cache(async (): Promise<StageDeadline[]> => {
  const rows = await prisma.match.groupBy({
    by: ["stage"],
    _min: { kickoffAt: true },
  });

  const kickoffByStage = new Map(
    rows
      .filter((r) => r._min.kickoffAt !== null)
      .map((r) => [r.stage, r._min.kickoffAt!]),
  );

  const deadlines: StageDeadline[] = [];
  for (const stage of STAGE_ORDER) {
    const firstKickoff = kickoffByStage.get(stage);
    if (!firstKickoff) continue;
    const lockAt = new Date(firstKickoff.getTime() - LOCK_LEAD_MS);
    deadlines.push({
      stage,
      label: STAGE_LABELS[stage] ?? stage,
      firstKickoff,
      lockAt,
    });
  }
  return deadlines;
});
