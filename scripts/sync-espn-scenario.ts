// Flip the preview to REAL data: pull completed group-stage results from ESPN
// (fifa.world, no key) into our match rows, then resolve confirmed R32 teams.
// Team abbreviations == our FIFA codes 1:1 (verified for all 48). Read-only vs
// ESPN; only writes our own DB. Run: npx tsx scripts/sync-espn-scenario.ts
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { fetchScoreboard } from "../src/lib/autograder/espn";
import { fetchEspnR32, fetchEspnStandings, r32FillsFromEspn } from "../src/lib/autograder/espn-bracket";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Group stage window for 2026: June 11 – 27.
const DATES = Array.from({ length: 17 }, (_, i) => `202606${String(11 + i).padStart(2, "0")}`);
const pairKey = (a: string, b: string) => [a, b].sort().join("|");

async function main() {
  // Reset group results so the sync is the single source of truth.
  await prisma.match.updateMany({
    where: { stage: "GROUP" },
    data: { homeScore: null, awayScore: null, status: "SCHEDULED" },
  });

  const groupMatches = await prisma.match.findMany({
    where: { stage: "GROUP" },
    select: { id: true, homeTeam: { select: { code: true } }, awayTeam: { select: { code: true } } },
  });
  const index = new Map<string, { id: string; homeCode: string; awayCode: string }>();
  for (const m of groupMatches) {
    if (!m.homeTeam || !m.awayTeam) continue;
    index.set(pairKey(m.homeTeam.code, m.awayTeam.code), { id: m.id, homeCode: m.homeTeam.code, awayCode: m.awayTeam.code });
  }

  let synced = 0;
  let live = 0;
  for (const date of DATES) {
    let fixtures;
    try {
      fixtures = await fetchScoreboard(date);
    } catch (e) {
      console.warn(`  ${date}: fetch failed (${e instanceof Error ? e.message : e})`);
      continue;
    }
    for (const f of fixtures) {
      if (f.live) live++;
      if (!f.completed) continue;
      const ours = index.get(pairKey(f.homeCode, f.awayCode));
      if (!ours) continue; // not a group match of ours (e.g. KO event)
      // Orient scores to our home/away.
      const sameOrientation = ours.homeCode === f.homeCode;
      await prisma.match.update({
        where: { id: ours.id },
        data: {
          homeScore: sameOrientation ? f.homeScore : f.awayScore,
          awayScore: sameOrientation ? f.awayScore : f.homeScore,
          status: "FINAL",
        },
      });
      synced++;
    }
  }
  console.log(`Real ESPN group results synced: ${synced} FINAL (${live} live skipped).`);

  // Reset the WHOLE knockout stage (teams + scores) so a re-sync starts clean —
  // no stale teams left over from demo/test propagation. R32 is refilled from
  // ESPN below; later rounds fill via propagation only when real games grade.
  await prisma.match.updateMany({
    where: { stage: { not: "GROUP" } },
    data: { homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, status: "SCHEDULED" },
  });
  const [events, standings] = await Promise.all([fetchEspnR32(), fetchEspnStandings()]);
  const fills = r32FillsFromEspn(events, standings);
  const teams = await prisma.team.findMany({
    where: { code: { in: [...new Set(fills.map((f) => f.teamCode))] } },
    select: { id: true, code: true },
  });
  const idByCode = new Map(teams.map((t) => [t.code, t.id]));
  const byMatch = new Map<number, { homeTeamId?: string; awayTeamId?: string }>();
  for (const f of fills) {
    const id = idByCode.get(f.teamCode);
    if (!id) continue;
    const e = byMatch.get(f.matchNumber) ?? {};
    if (f.side === "home") e.homeTeamId = id;
    else e.awayTeamId = id;
    byMatch.set(f.matchNumber, e);
  }
  for (const [matchNumber, data] of byMatch) {
    await prisma.match.updateMany({ where: { matchNumber, stage: "ROUND_OF_32" }, data });
  }
  console.log(`R32 teams confirmed from ESPN: ${fills.length} (${byMatch.size} matches touched).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
