// Preview-only scenario: set group-stage results so the live bracket shows all
// three states — confirmed locks, "en disputa" candidates, and "por confirmar".
// Does NOT touch knockout matches (the bracket fills live from group results).
//
// Run (after the base seed): npx tsx scripts/seed-preview-scenario.ts
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { planR32Resolution } from "../src/lib/standings/resolve-r32";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Fully-played groups → clean 9/6/3/0 table → winner/runner-up/3rd all lock.
const FULL = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
// Half-played groups → still open → "en disputa" with candidate teams.
const PARTIAL = ["K", "L"];

async function main() {
  const groupMatches = await prisma.match.findMany({
    where: { stage: "GROUP" },
    select: { id: true, matchNumber: true, groupCode: true, homeTeamId: true, awayTeamId: true },
    orderBy: { matchNumber: "asc" },
  });

  // Reset all group matches first so the scenario is idempotent across re-runs.
  await prisma.match.updateMany({
    where: { stage: "GROUP" },
    data: { homeScore: null, awayScore: null, status: "SCHEDULED" },
  });

  const byGroup = new Map<string, typeof groupMatches>();
  for (const m of groupMatches) {
    if (!m.groupCode) continue;
    if (!byGroup.has(m.groupCode)) byGroup.set(m.groupCode, []);
    byGroup.get(m.groupCode)!.push(m);
  }

  let finals = 0;

  for (const [code, matches] of byGroup) {
    if (FULL.includes(code)) {
      // Rank teams by first appearance; the stronger team (lower index) wins
      // every fixture 1–0, producing a decisive 9/6/3/0 table.
      const rank = new Map<string, number>();
      for (const m of matches) {
        if (m.homeTeamId && !rank.has(m.homeTeamId)) rank.set(m.homeTeamId, rank.size);
        if (m.awayTeamId && !rank.has(m.awayTeamId)) rank.set(m.awayTeamId, rank.size);
      }
      for (const m of matches) {
        if (!m.homeTeamId || !m.awayTeamId) continue;
        const homeStronger = (rank.get(m.homeTeamId) ?? 9) < (rank.get(m.awayTeamId) ?? 9);
        await prisma.match.update({
          where: { id: m.id },
          data: { homeScore: homeStronger ? 1 : 0, awayScore: homeStronger ? 0 : 1, status: "FINAL" },
        });
        finals++;
      }
    } else if (PARTIAL.includes(code)) {
      // Play the first 4 fixtures as 1–1 draws → everyone level, nothing locked.
      for (const m of matches.slice(0, 4)) {
        await prisma.match.update({
          where: { id: m.id },
          data: { homeScore: 1, awayScore: 1, status: "FINAL" },
        });
        finals++;
      }
    }
  }

  console.log(`Scenario applied: ${FULL.length} groups decided, ${PARTIAL.length} in dispute, rest pending.`);
  console.log(`Group matches set FINAL: ${finals}.`);

  // Persist confirmed teams into R32 so those matches become predictable now.
  const groupRows = await prisma.match.findMany({
    where: { stage: "GROUP" },
    select: {
      groupCode: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { id: true, name: true, fifaRank: true } },
      awayTeam: { select: { id: true, name: true, fifaRank: true } },
    },
  });
  const r32 = await prisma.match.findMany({
    where: { stage: "ROUND_OF_32" },
    select: { id: true, matchNumber: true, homeTeamId: true, awayTeamId: true },
  });
  const updates = planR32Resolution(groupRows, r32);
  for (const u of updates) {
    await prisma.match.update({ where: { id: u.id }, data: { homeTeamId: u.homeTeamId, awayTeamId: u.awayTeamId } });
  }
  console.log(`R32 slots filled with confirmed teams: ${updates.length}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
