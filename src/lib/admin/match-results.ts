import "server-only";

import { prisma } from "@/lib/prisma";
import {
  propagateBracketWinner,
  recomputeGroupOrderBonuses,
  recomputePredictionsForMatch,
  recomputeStandingSnapshots,
} from "@/lib/scoring";
export type MatchResultFailure =
  | "match-not-found"
  | "invalid-score";

export interface MatchResultOutcome {
  ok: boolean;
  error?: MatchResultFailure;
  updatedPredictions?: number;
}

const MAX_SCORE = 20;

function isValidScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_SCORE
  );
}

export async function setMatchResult(
  matchId: string,
  homeScore: unknown,
  awayScore: unknown,
  advancerTeamId?: string | null,
  decidedByPenalties?: boolean,
): Promise<MatchResultOutcome> {
  if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
    return { ok: false, error: "invalid-score" };
  }
  if (typeof matchId !== "string" || matchId.length === 0) {
    return { ok: false, error: "match-not-found" };
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, stage: true, groupCode: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match) {
    return { ok: false, error: "match-not-found" };
  }

  // The advancer drives knockout scoring + bracket propagation. Prefer the
  // explicit value (e.g. penalty winner from the autograder); otherwise the team
  // that won in regulation. Groups never have an advancer.
  let advancer: string | null = null;
  let penalties = false;
  if (match.stage !== "GROUP") {
    penalties = decidedByPenalties === true;
    if (advancerTeamId) advancer = advancerTeamId;
    else if (homeScore !== awayScore) advancer = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      status: "FINAL",
      advancerTeamId: advancer,
      decidedByPenalties: penalties,
    },
  });

  const recompute = await recomputePredictionsForMatch(matchId);
  await propagateBracketWinner(matchId);

  if (match.stage === "GROUP" && match.groupCode) {
    await recomputeGroupOrderBonuses(match.groupCode);
  }

  const quinielas = await prisma.quiniela.findMany({ select: { id: true } });
  for (const quiniela of quinielas) {
    await recomputeStandingSnapshots(quiniela.id);
  }

  return { ok: true, updatedPredictions: recompute.updatedPredictions };
}

export async function clearMatchResult(
  matchId: string,
): Promise<MatchResultOutcome> {
  if (typeof matchId !== "string" || matchId.length === 0) {
    return { ok: false, error: "match-not-found" };
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, stage: true, groupCode: true },
  });
  if (!match) {
    return { ok: false, error: "match-not-found" };
  }

  await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: null,
        awayScore: null,
        status: "SCHEDULED",
        advancerTeamId: null,
        decidedByPenalties: false,
      },
    }),
    prisma.prediction.updateMany({
      where: { matchId },
      data: {
        points: 0,
        correctOutcome: false,
        exactScore: false,
        correctWinner: false,
      },
    }),
  ]);

  // The group is no longer fully decided — recompute (now clears) its order
  // bonuses so cleared groups don't leave phantom bonus points in the totals.
  if (match.stage === "GROUP" && match.groupCode) {
    await recomputeGroupOrderBonuses(match.groupCode);
  }

  const quinielas = await prisma.quiniela.findMany({ select: { id: true } });
  for (const quiniela of quinielas) {
    await recomputeStandingSnapshots(quiniela.id);
  }

  return { ok: true };
}
