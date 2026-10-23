// Create a demo MEMBER on the local (disposable) DB so the changes can be
// reviewed end to end: copies a real member's predictions, then grades the
// first 6 group matches so colours, leaderboard and home cards are populated.
// Usage: npx tsx scripts/make-demo.ts
import "dotenv/config";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { setMatchResult } from "@/lib/admin/match-results";

const USERNAME = "demo";
const PASSWORD = "demo1234";
const NAME = "Demo";

// Scorelines to grade for the first 6 matches (match #1 = MEX 2-0 RSA).
const RESULTS: Record<number, [number, number]> = {
  1: [2, 0],
  2: [2, 2],
  3: [2, 1],
  4: [0, 0],
  5: [3, 1],
  6: [1, 1],
};

async function main() {
  const quiniela = await prisma.quiniela.findFirst({ select: { id: true } });
  if (!quiniela) throw new Error("no quiniela");

  const usernameKey = "demo";
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { usernameKey },
    update: { passwordHash, name: NAME },
    create: {
      username: USERNAME,
      usernameKey,
      passwordHash,
      name: NAME,
      role: "MEMBER",
      avatarColor: "#e7bd54",
    },
    select: { id: true },
  });

  // Membership
  const existingMember = await prisma.quinielaMember.findFirst({
    where: { userId: user.id, quinielaId: quiniela.id },
    select: { id: true },
  });
  if (!existingMember) {
    await prisma.quinielaMember.create({
      data: { userId: user.id, quinielaId: quiniela.id },
    });
  }

  // Pick the member with the most predictions as the template.
  const counts = await prisma.prediction.groupBy({
    by: ["userId"],
    where: { quinielaId: quiniela.id },
    _count: { _all: true },
  });
  counts.sort((a, b) => b._count._all - a._count._all);
  const sourceUserId = counts.find((c) => c.userId !== user.id)?.userId;
  if (!sourceUserId) throw new Error("no source member to copy from");

  const sourcePreds = await prisma.prediction.findMany({
    where: { userId: sourceUserId, quinielaId: quiniela.id },
    select: { matchId: true, homeScore: true, awayScore: true, pickedWinnerTeamId: true },
  });

  // Reset + copy
  await prisma.prediction.deleteMany({ where: { userId: user.id } });
  await prisma.prediction.createMany({
    data: sourcePreds.map((p) => ({
      userId: user.id,
      quinielaId: quiniela.id,
      matchId: p.matchId,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      pickedWinnerTeamId: p.pickedWinnerTeamId,
    })),
  });
  console.log(`Copied ${sourcePreds.length} predictions to demo.`);

  // Pin demo's first 3 picks so every colour state is visible:
  // (results below in RESULTS). Pin the latest graded matches so Home's
  // "Resultados recientes" feed + streak show a live mix:
  //   #6 1-1 vs real 1-1 -> exact      (green / green)   streak
  //   #5 2-0 vs real 3-1 -> right win  (green / gold)    streak
  //   #4 0-2 vs real 0-0 -> wrong      (red / red)       breaks streak at 2
  //   #3 2-1 vs real 2-1 -> exact      (green / green)
  const PINNED: Record<number, [number, number]> = {
    3: [2, 1],
    4: [0, 2],
    5: [2, 0],
    6: [1, 1],
  };
  for (const [numStr, [h, a]] of Object.entries(PINNED)) {
    const m = await prisma.match.findUnique({
      where: { matchNumber: Number(numStr) },
      select: { id: true },
    });
    if (!m) continue;
    await prisma.prediction.update({
      where: {
        userId_quinielaId_matchId: { userId: user.id, quinielaId: quiniela.id, matchId: m.id },
      },
      data: { homeScore: h, awayScore: a },
    });
  }

  // Grade first 6 matches (recomputes everyone, incl. demo).
  for (const [numStr, [h, a]] of Object.entries(RESULTS)) {
    const num = Number(numStr);
    const m = await prisma.match.findUnique({
      where: { matchNumber: num },
      select: { id: true },
    });
    if (!m) continue;
    const res = await setMatchResult(m.id, h, a);
    console.log(`Graded #${num} ${h}-${a}:`, res.ok ? "ok" : res.error);
  }

  // Show demo's resulting grades.
  const demoGraded = await prisma.prediction.findMany({
    where: { userId: user.id, match: { matchNumber: { in: [1, 2, 3, 4, 5, 6] } } },
    select: {
      homeScore: true,
      awayScore: true,
      points: true,
      correctOutcome: true,
      exactScore: true,
      match: { select: { matchNumber: true, homeScore: true, awayScore: true } },
    },
    orderBy: { match: { matchNumber: "asc" } },
  });
  console.log("\nDemo graded picks:");
  for (const p of demoGraded) {
    console.log(
      `  #${p.match.matchNumber} pick ${p.homeScore}-${p.awayScore} vs real ${p.match.homeScore}-${p.match.awayScore} -> ${p.points}pts outcome=${p.correctOutcome} exact=${p.exactScore}`,
    );
  }

  console.log(`\nLogin -> usuario: ${USERNAME}  contraseña: ${PASSWORD}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
