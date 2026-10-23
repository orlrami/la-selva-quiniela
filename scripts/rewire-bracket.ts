// Re-wire the knockout feed graph to the OFFICIAL 2026 bracket (derived from
// ESPN's R16/QF/SF/Final feeder labels). Our original seed paired R32 winners
// sequentially (1&2 → R16-1), but the real bracket pairs 1&3, 2&5, ... This
// fixes winnerFeedsTo / loserFeedsTo so propagateBracketWinner advances the whole
// tree correctly as games grade. Idempotent. Run: npx tsx scripts/rewire-bracket.ts
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { WINNER_FEEDS, LOSER_FEEDS } from "../src/lib/standings/ko-bracket";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function validateTree() {
  // Every knockout target (89..104) must be fed by exactly two distinct sources
  // on distinct sides (winner feeds; plus the 3rd-place match fed by two losers).
  const incoming = new Map<string, number>(); // `${target}:${side}` -> count
  const sources = new Set<number>();
  for (const [src, [target, side]] of Object.entries(WINNER_FEEDS)) {
    sources.add(Number(src));
    const k = `${target}:${side}`;
    incoming.set(k, (incoming.get(k) ?? 0) + 1);
  }
  for (const [, [target, side]] of Object.entries(LOSER_FEEDS)) {
    const k = `${target}:${side}`;
    incoming.set(k, (incoming.get(k) ?? 0) + 1);
  }
  const dupes = [...incoming.entries()].filter(([, n]) => n > 1);
  if (dupes.length) throw new Error(`bracket invalid — slot fed twice: ${dupes.map(([k]) => k).join(", ")}`);
  // Targets 89..96 (R16) fed by 2; 97..100 (QF) by 2; 101..102 (SF) by 2;
  // 104 (Final) by 2; 103 (3rd) by 2.
  for (const target of [...Array(16)].map((_, i) => 89 + i)) {
    const got = (incoming.get(`${target}:HOME`) ?? 0) + (incoming.get(`${target}:AWAY`) ?? 0);
    if (got !== 2) throw new Error(`bracket invalid — match #${target} fed by ${got} (want 2)`);
  }
  console.log(`Tree valid: ${sources.size} winner-feeds + ${Object.keys(LOSER_FEEDS).length} loser-feeds.`);
}

async function main() {
  validateTree();

  const ko = await prisma.match.findMany({
    where: { stage: { not: "GROUP" } },
    select: { id: true, matchNumber: true },
  });
  const idByNumber = new Map(ko.map((m) => [m.matchNumber, m.id]));

  let updated = 0;
  for (const m of ko) {
    const w = WINNER_FEEDS[m.matchNumber];
    const l = LOSER_FEEDS[m.matchNumber];
    await prisma.match.update({
      where: { id: m.id },
      data: {
        winnerFeedsToId: w ? idByNumber.get(w[0]) ?? null : null,
        winnerFeedsAs: w ? w[1] : null,
        loserFeedsToId: l ? idByNumber.get(l[0]) ?? null : null,
        loserFeedsAs: l ? l[1] : null,
      },
    });
    updated++;
  }
  console.log(`Re-wired ${updated} knockout matches to the official bracket.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
