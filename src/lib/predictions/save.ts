import "server-only";

import { prisma } from "@/lib/prisma";
import { knockoutLockMs } from "@/lib/predictions/locks";

export type SavePredictionFailure =
  | "not-member"
  | "match-not-found"
  | "locked"
  | "invalid-score"
  | "invalid-pick"
  | "teams-not-resolved";

export interface SavePredictionResult {
  ok: boolean;
  error?: SavePredictionFailure;
  prediction?: {
    matchId: string;
    homeScore: number | null;
    awayScore: number | null;
    pickedWinnerTeamId: string | null;
    updatedAt: string;
  };
}

const MAX_SCORE = 20;
// Group stage closes 30 min before its first match. Knockout lock timing lives in
// predictions/locks.ts (shared with the UI lock in predictions/data.ts).
const GROUP_LOCK_LEAD_MS = 30 * 60 * 1000;

function isValidScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_SCORE
  );
}

interface SavePredictionInput {
  userId: string;
  matchId: string;
  homeScore?: unknown;
  awayScore?: unknown;
  pickedWinnerTeamId?: unknown;
}

export async function savePrediction({
  userId,
  matchId,
  homeScore,
  awayScore,
  pickedWinnerTeamId,
}: SavePredictionInput): Promise<SavePredictionResult> {
  if (typeof matchId !== "string" || matchId.length === 0) {
    return { ok: false, error: "match-not-found" };
  }

  const membership = await prisma.quinielaMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { quinielaId: true },
  });
  if (!membership) {
    return { ok: false, error: "not-member" };
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      stage: true,
      kickoffAt: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
  if (!match) {
    return { ok: false, error: "match-not-found" };
  }

  // Group stage: one shared deadline (30 min before the FIRST group match).
  // Knockout: per-match — every game locks 30 min before its own kickoff
  // (see knockoutLockMs).
  let lockAtMs: number;
  if (match.stage === "GROUP") {
    const firstOfStage = await prisma.match.findFirst({
      where: { stage: "GROUP" },
      orderBy: { kickoffAt: "asc" },
      select: { kickoffAt: true },
    });
    lockAtMs = firstOfStage
      ? firstOfStage.kickoffAt.getTime() - GROUP_LOCK_LEAD_MS
      : Number.POSITIVE_INFINITY;
  } else {
    lockAtMs = knockoutLockMs(match.stage, match.kickoffAt.getTime());
  }
  if (Date.now() >= lockAtMs) {
    return { ok: false, error: "locked" };
  }

  if (match.stage === "GROUP") {
    if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
      return { ok: false, error: "invalid-score" };
    }
    const saved = await prisma.prediction.upsert({
      where: {
        userId_quinielaId_matchId: {
          userId,
          quinielaId: membership.quinielaId,
          matchId,
        },
      },
      create: {
        userId,
        quinielaId: membership.quinielaId,
        matchId,
        homeScore,
        awayScore,
        pickedWinnerTeamId: null,
      },
      update: {
        homeScore,
        awayScore,
        pickedWinnerTeamId: null,
      },
      select: {
        matchId: true,
        homeScore: true,
        awayScore: true,
        pickedWinnerTeamId: true,
        updatedAt: true,
      },
    });
    return {
      ok: true,
      prediction: {
        matchId: saved.matchId,
        homeScore: saved.homeScore,
        awayScore: saved.awayScore,
        pickedWinnerTeamId: saved.pickedWinnerTeamId,
        updatedAt: saved.updatedAt.toISOString(),
      },
    };
  }

  if (!match.homeTeamId || !match.awayTeamId) {
    return { ok: false, error: "teams-not-resolved" };
  }
  if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
    return { ok: false, error: "invalid-score" };
  }
  if (
    typeof pickedWinnerTeamId !== "string" ||
    pickedWinnerTeamId.length === 0
  ) {
    return { ok: false, error: "invalid-pick" };
  }
  if (
    pickedWinnerTeamId !== match.homeTeamId &&
    pickedWinnerTeamId !== match.awayTeamId
  ) {
    return { ok: false, error: "invalid-pick" };
  }
  const h = homeScore as number;
  const a = awayScore as number;
  if (h !== a) {
    const impliedWinner = h > a ? match.homeTeamId : match.awayTeamId;
    if (pickedWinnerTeamId !== impliedWinner) {
      return { ok: false, error: "invalid-pick" };
    }
  }

  const saved = await prisma.prediction.upsert({
    where: {
      userId_quinielaId_matchId: {
        userId,
        quinielaId: membership.quinielaId,
        matchId,
      },
    },
    create: {
      userId,
      quinielaId: membership.quinielaId,
      matchId,
      homeScore: h,
      awayScore: a,
      pickedWinnerTeamId,
    },
    update: {
      homeScore: h,
      awayScore: a,
      pickedWinnerTeamId,
    },
    select: {
      matchId: true,
      homeScore: true,
      awayScore: true,
      pickedWinnerTeamId: true,
      updatedAt: true,
    },
  });
  return {
    ok: true,
    prediction: {
      matchId: saved.matchId,
      homeScore: saved.homeScore,
      awayScore: saved.awayScore,
      pickedWinnerTeamId: saved.pickedWinnerTeamId,
      updatedAt: saved.updatedAt.toISOString(),
    },
  };
}
