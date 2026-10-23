import "server-only";

import { cache } from "react";

export type BonusCategory = "CHAMPION" | "RUNNER_UP" | "THIRD_PLACE" | "GOLDEN_BOOT" | "GOLDEN_GLOVE" | "GOLDEN_BALL";
import { prisma } from "@/lib/prisma";

export interface BonusPickData {
  category: BonusCategory;
  teamId: string | null;
  teamName: string | null;
  teamCode: string | null;
  playerName: string | null;
}

export interface BonusTeamOption {
  id: string;
  code: string;
  name: string;
  shortName: string;
}

export interface BonusBoardData {
  quinielaId: string;
  picks: BonusPickData[];
  teams: BonusTeamOption[];
  locked: boolean;
}

export const getBonusBoard = cache(
  async (userId: string): Promise<BonusBoardData | null> => {
    const membership = await prisma.quinielaMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: { quiniela: { select: { id: true } } },
    });
    if (!membership) return null;
    const quinielaId = membership.quiniela.id;

    const [picks, teams, firstMatch] = await Promise.all([
      prisma.bonusPick.findMany({
        where: { userId, quinielaId },
        select: {
          category: true,
          teamId: true,
          playerName: true,
          team: { select: { name: true, code: true } },
        },
      }),
      prisma.team.findMany({
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true, shortName: true },
      }),
      prisma.match.findFirst({
        where: { stage: "GROUP" },
        orderBy: { kickoffAt: "asc" },
        select: { kickoffAt: true },
      }),
    ]);

    // Group-stage deadline: 30 min before the first match (matches predictions).
    const GROUP_LOCK_LEAD_MS = 30 * 60 * 1000;
    const locked = firstMatch
      ? Date.now() >= firstMatch.kickoffAt.getTime() - GROUP_LOCK_LEAD_MS
      : false;

    return {
      quinielaId,
      picks: picks.map((p) => ({
        category: p.category,
        teamId: p.teamId,
        teamName: p.team?.name ?? null,
        teamCode: p.team?.code ?? null,
        playerName: p.playerName,
      })),
      teams,
      locked,
    };
  },
);
