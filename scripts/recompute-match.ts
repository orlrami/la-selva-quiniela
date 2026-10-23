// One-off helper used to verify scoring during development.
// Usage: npx tsx scripts/recompute-match.ts <matchNumber>
//
// Inlines a minimal recompute so the script can run outside the Next runtime
// (the production code in src/lib/scoring.ts pulls "server-only" which only
// resolves inside the Next build).
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

interface ScoreRules {
  outcomePoints: number;
  exactScorePoints: number;
}

const DEFAULT_RULES: ScoreRules = { outcomePoints: 3, exactScorePoints: 6 };

function outcomeFor(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

interface Scoreline {
  homeScore: number;
  awayScore: number;
}

function evaluatePrediction(
  prediction: Scoreline,
  result: Scoreline,
  rules: ScoreRules = DEFAULT_RULES,
) {
  if (
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore
  ) {
    return {
      points: rules.exactScorePoints,
      correctOutcome: true,
      exactScore: true,
    };
  }
  if (
    outcomeFor(prediction.homeScore, prediction.awayScore) ===
    outcomeFor(result.homeScore, result.awayScore)
  ) {
    return {
      points: rules.outcomePoints,
      correctOutcome: true,
      exactScore: false,
    };
  }
  return { points: 0, correctOutcome: false, exactScore: false };
}

const matchNumber = Number(process.argv[2]);
if (!Number.isInteger(matchNumber) || matchNumber <= 0) {
  console.error("Usage: tsx scripts/recompute-match.ts <matchNumber>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const match = await prisma.match.findUnique({
    where: { matchNumber },
    select: {
      id: true,
      matchNumber: true,
      homeScore: true,
      awayScore: true,
      lockAt: true,
    },
  });
  if (!match) {
    throw new Error(`No match with matchNumber ${matchNumber}`);
  }
  if (match.homeScore === null || match.awayScore === null) {
    throw new Error(`Match ${matchNumber} has no final score yet`);
  }
  console.log("Match", match);

  const rules = await prisma.scoreRule.findMany({
    where: { stage: "GROUP", active: true },
    select: { quinielaId: true, key: true, points: true },
  });
  const rulesByQuiniela = new Map<string, ScoreRules>();
  for (const rule of rules) {
    const current = rulesByQuiniela.get(rule.quinielaId) ?? { ...DEFAULT_RULES };
    if (rule.key === "group-outcome") current.outcomePoints = rule.points;
    if (rule.key === "group-exact-score") current.exactScorePoints = rule.points;
    rulesByQuiniela.set(rule.quinielaId, current);
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId: match.id },
    select: {
      id: true,
      quinielaId: true,
      userId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  if (predictions.length === 0) {
    console.log("No predictions to score");
    return;
  }

  const updates = predictions.map((p) => {
    const ruleSet = rulesByQuiniela.get(p.quinielaId) ?? DEFAULT_RULES;
    const evaluation = evaluatePrediction(
      { homeScore: p.homeScore ?? 0, awayScore: p.awayScore ?? 0 },
      match as Scoreline,
      ruleSet,
    );
    return prisma.prediction.update({
      where: { id: p.id },
      data: {
        points: evaluation.points,
        correctOutcome: evaluation.correctOutcome,
        exactScore: evaluation.exactScore,
        lockedAt: match.lockAt,
      },
    });
  });

  await prisma.$transaction(updates);
  console.log("Predictions updated:", predictions.length);

  const after = await prisma.prediction.findMany({
    where: { matchId: match.id },
    select: {
      userId: true,
      points: true,
      correctOutcome: true,
      exactScore: true,
    },
  });
  console.log("After:", after);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
