"use server";

type BonusCategory = "CHAMPION" | "RUNNER_UP" | "THIRD_PLACE" | "GOLDEN_BOOT" | "GOLDEN_GLOVE" | "GOLDEN_BALL";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const TEAM_CATEGORIES: BonusCategory[] = ["CHAMPION", "RUNNER_UP", "THIRD_PLACE"];
const PLAYER_CATEGORIES: BonusCategory[] = ["GOLDEN_BOOT", "GOLDEN_GLOVE", "GOLDEN_BALL"];
const ALL_CATEGORIES = [...TEAM_CATEGORIES, ...PLAYER_CATEGORIES];

interface SaveBonusPickInput {
  quinielaId: string;
  category: string;
  teamId?: string | null;
  playerName?: string | null;
}

export async function saveBonusPick(input: SaveBonusPickInput) {
  const user = await requireUser();
  const { quinielaId, category } = input;

  if (!ALL_CATEGORIES.includes(category as BonusCategory)) {
    return { error: "Categoría inválida" };
  }
  const cat = category as BonusCategory;

  const membership = await prisma.quinielaMember.findUnique({
    where: { userId_quinielaId: { userId: user.id, quinielaId } },
  });
  if (!membership) return { error: "No eres miembro de esta quiniela" };

  const firstMatch = await prisma.match.findFirst({
    where: { stage: "GROUP" },
    orderBy: { kickoffAt: "asc" },
    select: { kickoffAt: true },
  });
  const GROUP_LOCK_LEAD_MS = 30 * 60 * 1000;
  if (firstMatch && Date.now() >= firstMatch.kickoffAt.getTime() - GROUP_LOCK_LEAD_MS) {
    return { error: "Las predicciones especiales están cerradas" };
  }

  const isTeamPick = TEAM_CATEGORIES.includes(cat);
  const teamId = isTeamPick ? (input.teamId ?? null) : null;
  const playerName = !isTeamPick ? (input.playerName?.trim() || null) : null;

  if (isTeamPick && !teamId) return { error: "Elige una selección" };
  if (!isTeamPick && !playerName) return { error: "Escribe el nombre del jugador" };

  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return { error: "Selección no encontrada" };
  }

  await prisma.bonusPick.upsert({
    where: {
      userId_quinielaId_category: { userId: user.id, quinielaId, category: cat },
    },
    create: {
      userId: user.id,
      quinielaId,
      category: cat,
      teamId,
      playerName,
    },
    update: { teamId, playerName },
  });

  return { ok: true };
}
