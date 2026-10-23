import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getCorrectGroupPositions } from "@/lib/standings/group-accuracy";

const STAGE_LABEL: Record<string, string> = {
  GROUP: "Grupos",
  ROUND_OF_32: "Octavos (R32)",
  ROUND_OF_16: "Octavos de Final",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semis",
  THIRD_PLACE: "Tercer lugar",
  FINAL: "Final",
};

export interface PlayerStatRow {
  userId: string;
  name: string;
  points: number; // points from match predictions only
  graded: number; // predictions on finished matches
  exact: number; // exact scores nailed
  accuracy: number; // % of graded predictions that scored (0–100)
  bestStage: string | null; // round where they scored the most
  groupPositions: number; // correct group positions across closed groups
}

export interface PlayerStatsData {
  quiniela: { id: string; name: string };
  rows: PlayerStatRow[];
}

export const getPlayerStats = cache(async (userId: string): Promise<PlayerStatsData | null> => {
  const membership = await prisma.quinielaMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { quiniela: { select: { id: true, name: true } } },
  });
  if (!membership) return null;
  const quinielaId = membership.quiniela.id;

  const [members, preds, groupPositions] = await Promise.all([
    prisma.quinielaMember.findMany({
      where: { quinielaId },
      select: { nickname: true, user: { select: { id: true, name: true } } },
    }),
    prisma.prediction.findMany({
      where: { quinielaId, match: { status: "FINAL" } },
      select: { userId: true, points: true, exactScore: true, match: { select: { stage: true } } },
    }),
    getCorrectGroupPositions(quinielaId),
  ]);

  interface Acc {
    points: number;
    graded: number;
    scored: number;
    exact: number;
    byStage: Map<string, number>;
  }
  const acc = new Map<string, Acc>();
  for (const m of members) acc.set(m.user.id, { points: 0, graded: 0, scored: 0, exact: 0, byStage: new Map() });
  for (const p of preds) {
    const a = acc.get(p.userId);
    if (!a) continue;
    a.points += p.points;
    a.graded += 1;
    if (p.points > 0) a.scored += 1;
    if (p.exactScore) a.exact += 1;
    a.byStage.set(p.match.stage, (a.byStage.get(p.match.stage) ?? 0) + p.points);
  }

  const rows: PlayerStatRow[] = members
    .map((m) => {
      const a = acc.get(m.user.id)!;
      let bestStage: string | null = null;
      let bestPts = 0;
      for (const [stage, pts] of a.byStage) {
        if (pts > bestPts) {
          bestPts = pts;
          bestStage = STAGE_LABEL[stage] ?? stage;
        }
      }
      return {
        userId: m.user.id,
        name: m.nickname ?? m.user.name,
        points: a.points,
        graded: a.graded,
        exact: a.exact,
        accuracy: a.graded > 0 ? Math.round((a.scored / a.graded) * 100) : 0,
        bestStage,
        groupPositions: groupPositions.get(m.user.id) ?? 0,
      };
    })
    .sort((x, y) => y.points - x.points || y.accuracy - x.accuracy);

  return { quiniela: membership.quiniela, rows };
});
