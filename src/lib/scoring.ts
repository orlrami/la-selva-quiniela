import "server-only";

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Pure scoring rules
// ---------------------------------------------------------------------------

export type KnockoutStage =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL";

export interface ScoreRules {
  outcomePoints: number;
  exactScorePoints: number;
}

export const DEFAULT_GROUP_RULES: ScoreRules = {
  outcomePoints: 2,
  exactScorePoints: 5,
};

export interface KnockoutLayers {
  advance: number;
  exact: number;
}

// Two knockout layers that stack: `advance` (picked the team that goes through —
// penalty winner included) + `exact` (exact 90/120-min score). Nailing the exact
// draw is the "full-time result" reward; the shootout pick only affects `advance`.
export const DEFAULT_KNOCKOUT_LAYERS: Record<KnockoutStage, KnockoutLayers> = {
  ROUND_OF_32: { advance: 3, exact: 5 },
  ROUND_OF_16: { advance: 4, exact: 7 },
  QUARTER_FINAL: { advance: 6, exact: 10 },
  SEMI_FINAL: { advance: 9, exact: 14 },
  THIRD_PLACE: { advance: 4, exact: 6 },
  FINAL: { advance: 12, exact: 19 },
};

export interface KnockoutScoreInput {
  pickedWinnerTeamId: string | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
}

export interface KnockoutActual {
  homeScore: number;
  awayScore: number;
  /** Team that progresses (penalty winner if decided on penalties). */
  advancerTeamId: string | null;
}

export interface KnockoutScoreEvaluation {
  points: number;
  correctWinner: boolean;
  correctOutcome: boolean;
  exactScore: boolean;
}

export function evaluateKnockoutPrediction(
  prediction: KnockoutScoreInput,
  actual: KnockoutActual,
  layers: KnockoutLayers,
): KnockoutScoreEvaluation {
  if (prediction.predictedHomeScore === null || prediction.predictedAwayScore === null) {
    return { points: 0, correctWinner: false, correctOutcome: false, exactScore: false };
  }
  const ph = prediction.predictedHomeScore;
  const pa = prediction.predictedAwayScore;

  // advance: picked the team that actually goes through (penalty winner included).
  const correctWinner =
    prediction.pickedWinnerTeamId !== null &&
    actual.advancerTeamId !== null &&
    prediction.pickedWinnerTeamId === actual.advancerTeamId;
  // exact: predicted the exact 90/120-min score (this is the full-time-result reward).
  const exactScore = ph === actual.homeScore && pa === actual.awayScore;

  let points = 0;
  if (correctWinner) points += layers.advance;
  if (exactScore) points += layers.exact;

  // correctOutcome is not a scoring layer in this model; kept false for the flag.
  return { points, correctWinner, correctOutcome: false, exactScore };
}

export interface PredictionLike {
  homeScore: number;
  awayScore: number;
}

export interface ScoreEvaluation {
  points: number;
  correctOutcome: boolean;
  exactScore: boolean;
}

type Outcome = "home" | "away" | "draw";

function outcomeFor(home: number, away: number): Outcome {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Pure scoring rule for the group stage.
 *
 * - Exact score:          exactScorePoints (replaces, not additive)
 * - Same outcome only:    outcomePoints
 * - Wrong outcome:        0
 */
export function evaluatePrediction(
  prediction: PredictionLike,
  result: PredictionLike,
  rules: ScoreRules = DEFAULT_GROUP_RULES,
): ScoreEvaluation {
  const isExact =
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore;
  if (isExact) {
    return {
      points: rules.exactScorePoints,
      correctOutcome: true,
      exactScore: true,
    };
  }
  const isOutcome =
    outcomeFor(prediction.homeScore, prediction.awayScore) ===
    outcomeFor(result.homeScore, result.awayScore);
  if (isOutcome) {
    return {
      points: rules.outcomePoints,
      correctOutcome: true,
      exactScore: false,
    };
  }
  return { points: 0, correctOutcome: false, exactScore: false };
}

// ---------------------------------------------------------------------------
// DB-backed helpers
// ---------------------------------------------------------------------------

export async function getGroupRulesForQuiniela(
  quinielaId: string,
): Promise<ScoreRules> {
  const rules = await prisma.scoreRule.findMany({
    where: { quinielaId, stage: "GROUP", active: true },
    select: { key: true, points: true },
  });
  const map = new Map(rules.map((rule) => [rule.key, rule.points]));
  return {
    outcomePoints: map.get("group-outcome") ?? DEFAULT_GROUP_RULES.outcomePoints,
    exactScorePoints:
      map.get("group-exact-score") ?? DEFAULT_GROUP_RULES.exactScorePoints,
  };
}

const KNOCKOUT_STAGES: KnockoutStage[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

export async function getKnockoutPointsForQuiniela(
  quinielaId: string,
): Promise<Record<KnockoutStage, KnockoutLayers>> {
  const rules = await prisma.scoreRule.findMany({
    where: {
      quinielaId,
      key: { in: ["knockout-advance", "knockout-exact"] },
      active: true,
    },
    select: { stage: true, key: true, points: true },
  });
  const byStage = new Map<string, Partial<KnockoutLayers>>();
  for (const r of rules) {
    const layer = byStage.get(r.stage) ?? {};
    if (r.key === "knockout-advance") layer.advance = r.points;
    else if (r.key === "knockout-exact") layer.exact = r.points;
    byStage.set(r.stage, layer);
  }
  const out = {} as Record<KnockoutStage, KnockoutLayers>;
  for (const stage of KNOCKOUT_STAGES) {
    const got = byStage.get(stage) ?? {};
    const def = DEFAULT_KNOCKOUT_LAYERS[stage];
    out[stage] = {
      advance: got.advance ?? def.advance,
      exact: got.exact ?? def.exact,
    };
  }
  return out;
}

export interface RecomputeMatchResult {
  matchId: string;
  updatedPredictions: number;
}

/**
 * Recompute every prediction for a match. Caller should ensure the match's
 * final score is set before invoking; this is a no-op otherwise.
 */
export async function recomputePredictionsForMatch(
  matchId: string,
): Promise<RecomputeMatchResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      stage: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      advancerTeamId: true,
      lockAt: true,
    },
  });
  if (!match || match.homeScore === null || match.awayScore === null) {
    return { matchId, updatedPredictions: 0 };
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: {
      id: true,
      quinielaId: true,
      homeScore: true,
      awayScore: true,
      pickedWinnerTeamId: true,
    },
  });

  if (predictions.length === 0) {
    return { matchId, updatedPredictions: 0 };
  }

  const distinctQuinielaIds = Array.from(
    new Set(predictions.map((p) => p.quinielaId)),
  );

  if (match.stage === "GROUP") {
    const result: PredictionLike = {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    };
    const rulesPairs = await Promise.all(
      distinctQuinielaIds.map(async (quinielaId) => {
        const rules = await getGroupRulesForQuiniela(quinielaId);
        return [quinielaId, rules] as const;
      }),
    );
    const rulesByQuiniela = new Map(rulesPairs);

    await prisma.$transaction(
      predictions.map((prediction) => {
        const rules = rulesByQuiniela.get(prediction.quinielaId)!;
        const evaluation = evaluatePrediction(
          { homeScore: prediction.homeScore ?? 0, awayScore: prediction.awayScore ?? 0 },
          result,
          rules,
        );
        return prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            points: evaluation.points,
            correctOutcome: evaluation.correctOutcome,
            exactScore: evaluation.exactScore,
            correctWinner: false,
            lockedAt: match.lockAt,
          },
        });
      }),
    );
  } else {
    const stagePointsPairs = await Promise.all(
      distinctQuinielaIds.map(async (quinielaId) => {
        const points = await getKnockoutPointsForQuiniela(quinielaId);
        return [quinielaId, points] as const;
      }),
    );
    const pointsByQuiniela = new Map(stagePointsPairs);

    const actual: KnockoutActual = {
      homeScore: match.homeScore!,
      awayScore: match.awayScore!,
      advancerTeamId: match.advancerTeamId,
    };
    await prisma.$transaction(
      predictions.map((prediction) => {
        const layersMap = pointsByQuiniela.get(prediction.quinielaId)!;
        const layers = layersMap[match.stage as KnockoutStage] ?? DEFAULT_KNOCKOUT_LAYERS.ROUND_OF_32;
        const evaluation = evaluateKnockoutPrediction(
          {
            pickedWinnerTeamId: prediction.pickedWinnerTeamId,
            predictedHomeScore: prediction.homeScore,
            predictedAwayScore: prediction.awayScore,
          },
          actual,
          layers,
        );
        return prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            points: evaluation.points,
            correctOutcome: evaluation.correctOutcome,
            exactScore: evaluation.exactScore,
            correctWinner: evaluation.correctWinner,
            lockedAt: match.lockAt,
          },
        });
      }),
    );
  }

  return { matchId, updatedPredictions: predictions.length };
}

/**
 * After a knockout match's score is set, push the winner (and, for semis,
 * the loser) into the slot of the next bracket match. Idempotent.
 */
export async function propagateBracketWinner(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      stage: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      advancerTeamId: true,
      winnerFeedsToId: true,
      winnerFeedsAs: true,
      loserFeedsToId: true,
      loserFeedsAs: true,
    },
  });
  if (!match) return;
  if (match.stage === "GROUP") return;
  if (match.homeScore === null || match.awayScore === null) return;
  if (!match.homeTeamId || !match.awayTeamId) return;
  // Decide the advancer: prefer the explicit field (handles penalties), else the
  // team that won in regulation. A draw with no advancer set can't propagate yet.
  if (match.homeScore === match.awayScore && !match.advancerTeamId) return;

  const winnerId =
    match.advancerTeamId ??
    (match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId);
  const loserId = winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

  if (match.winnerFeedsToId && match.winnerFeedsAs) {
    await prisma.match.update({
      where: { id: match.winnerFeedsToId },
      data:
        match.winnerFeedsAs === "HOME"
          ? { homeTeamId: winnerId }
          : { awayTeamId: winnerId },
    });
  }
  if (match.loserFeedsToId && match.loserFeedsAs) {
    await prisma.match.update({
      where: { id: match.loserFeedsToId },
      data:
        match.loserFeedsAs === "HOME"
          ? { homeTeamId: loserId }
          : { awayTeamId: loserId },
    });
  }
}

export interface RecomputeSnapshotResult {
  quinielaId: string;
  writtenSnapshots: number;
}

/**
 * Snapshot the current standings of a quiniela. Each call appends a new row
 * per member; consumers can read the latest snapshot or compute rank-movement
 * across snapshots.
 */
export async function recomputeStandingSnapshots(
  quinielaId: string,
): Promise<RecomputeSnapshotResult> {
  const [members, pointsByUser, correctByUser, exactByUser, totalMatches] =
    await Promise.all([
      prisma.quinielaMember.findMany({
        where: { quinielaId },
        select: {
          userId: true,
          user: { select: { name: true } },
        },
      }),
      prisma.prediction.groupBy({
        by: ["userId"],
        where: { quinielaId },
        _sum: { points: true },
        _count: { _all: true },
      }),
      prisma.prediction.groupBy({
        by: ["userId"],
        // outcome-only (exacts counted separately) so columns reconcile; group only.
        where: { quinielaId, correctOutcome: true, exactScore: false, match: { stage: "GROUP" } },
        _count: { _all: true },
      }),
      prisma.prediction.groupBy({
        by: ["userId"],
        where: { quinielaId, exactScore: true, match: { stage: "GROUP" } },
        _count: { _all: true },
      }),
      prisma.match.count({ where: { stage: "GROUP" } }),
    ]);

  const pointsMap = new Map(
    pointsByUser.map((row) => [
      row.userId,
      { points: row._sum.points ?? 0, completed: row._count._all },
    ]),
  );
  const correctMap = new Map(
    correctByUser.map((row) => [row.userId, row._count._all]),
  );
  const exactMap = new Map(
    exactByUser.map((row) => [row.userId, row._count._all]),
  );

  interface Row {
    userId: string;
    displayName: string;
    points: number;
    completed: number;
    correctOutcomes: number;
    exactScores: number;
  }

  const rows: Row[] = members.map((member) => {
    const stats = pointsMap.get(member.userId);
    return {
      userId: member.userId,
      displayName: member.user.name,
      points: stats?.points ?? 0,
      completed: stats?.completed ?? 0,
      correctOutcomes: correctMap.get(member.userId) ?? 0,
      exactScores: exactMap.get(member.userId) ?? 0,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (b.correctOutcomes !== a.correctOutcomes)
      return b.correctOutcomes - a.correctOutcomes;
    return a.displayName.localeCompare(b.displayName, "es");
  });

  let currentRank = 0;
  let previousPoints = Number.POSITIVE_INFINITY;
  const calculatedAt = new Date();

  await prisma.$transaction(
    rows.map((row, index) => {
      if (row.points < previousPoints) {
        currentRank = index + 1;
        previousPoints = row.points;
      }
      return prisma.standingSnapshot.create({
        data: {
          quinielaId,
          userId: row.userId,
          rank: currentRank,
          points: row.points,
          correctOutcomes: row.correctOutcomes,
          exactScores: row.exactScores,
          missingPredictions: Math.max(totalMatches - row.completed, 0),
          calculatedAt,
        },
      });
    }),
  );

  return { quinielaId, writtenSnapshots: rows.length };
}

// ---------------------------------------------------------------------------
// Group order bonus — DISABLED (scoring is prediction points only)
// ---------------------------------------------------------------------------

/**
 * Group-order bonus is DISABLED — scoring is prediction points only. Kept as a
 * no-op that clears any existing bonus rows for the group so none linger in the
 * leaderboard/dashboard totals.
 */
export async function recomputeGroupOrderBonuses(groupCode: string): Promise<number> {
  const cleared = await prisma.groupOrderBonus.deleteMany({ where: { groupCode } });
  return cleared.count;
}
