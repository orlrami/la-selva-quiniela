// One-off manual grade by FIFA codes. Usage: tsx grade-one.ts HOME AWAY h a
import { prisma } from "@/lib/prisma";
import { setMatchResult } from "@/lib/admin/match-results";

async function main() {
  const [home, away, hRaw, aRaw] = process.argv.slice(2);
  const h = Number(hRaw);
  const a = Number(aRaw);
  const match = await prisma.match.findFirst({
    where: { homeTeam: { code: home }, awayTeam: { code: away } },
    select: { id: true, matchNumber: true, status: true },
  });
  if (!match) throw new Error(`No match ${home} vs ${away}`);
  console.log(`Match #${match.matchNumber} current status=${match.status}`);
  const res = await setMatchResult(match.id, h, a);
  console.log("Result:", JSON.stringify(res));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
