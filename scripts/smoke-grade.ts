// Local smoke test: grade match #1 (MEX vs RSA) through the REAL pipeline
// (setMatchResult -> recompute -> group bonus -> standings) and print the
// resulting per-prediction colour states. Run against a disposable local copy.
// Usage: npx tsx scripts/smoke-grade.ts [home] [away]   (default 2 0)
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { setMatchResult } from "@/lib/admin/match-results";

async function main() {
  const home = Number(process.argv[2] ?? 2);
  const away = Number(process.argv[3] ?? 0);

  const m = await prisma.match.findUnique({
    where: { matchNumber: 1 },
    select: { id: true, homeTeam: { select: { code: true } }, awayTeam: { select: { code: true } } },
  });
  if (!m) throw new Error("match #1 not found");

  console.log(`Grading #1 ${m.homeTeam?.code} ${home}-${away} ${m.awayTeam?.code} ...`);
  const res = await setMatchResult(m.id, home, away);
  console.log("setMatchResult ->", JSON.stringify(res));

  const rows = await prisma.prediction.findMany({
    where: { matchId: m.id },
    select: { homeScore: true, awayScore: true, points: true, correctOutcome: true, exactScore: true },
  });

  type Bucket = { count: number; points: number; correctOutcome: boolean; exactScore: boolean };
  const summary = new Map<string, Bucket>();
  for (const r of rows) {
    const key = `${r.homeScore}-${r.awayScore}`;
    const b = summary.get(key) ?? { count: 0, points: r.points, correctOutcome: r.correctOutcome, exactScore: r.exactScore };
    b.count++;
    summary.set(key, b);
  }

  console.log("\nPicked  | n  | pts | outcome | exact | square -> score colour");
  console.log("--------+----+-----+---------+-------+------------------------");
  for (const [pick, b] of [...summary.entries()].sort()) {
    const square = b.correctOutcome ? "GREEN" : "RED";
    const score = b.exactScore ? "GREEN" : b.correctOutcome ? "GOLD" : "RED";
    console.log(
      `${pick.padEnd(7)} | ${String(b.count).padStart(2)} | ${String(b.points).padStart(3)} | ${String(b.correctOutcome).padEnd(7)} | ${String(b.exactScore).padEnd(5)} | ${square} -> ${score}`,
    );
  }

  // Leaderboard sanity: top 5 by (prediction points + group-order bonus).
  const pts = await prisma.prediction.groupBy({ by: ["userId"], _sum: { points: true } });
  const bonus = await prisma.groupOrderBonus.groupBy({ by: ["userId"], _sum: { points: true } });
  const bonusMap = new Map(bonus.map((b) => [b.userId, b._sum.points ?? 0]));
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const nameMap = new Map(users.map((u) => [u.id, u.name]));
  const board = pts
    .map((p) => ({ name: nameMap.get(p.userId) ?? p.userId, total: (p._sum.points ?? 0) + (bonusMap.get(p.userId) ?? 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  console.log("\nLeaderboard top 5:");
  for (const r of board) console.log(`  ${r.total.toString().padStart(3)}  ${r.name}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
