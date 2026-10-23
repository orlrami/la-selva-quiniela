// Refresh Team.fifaRank from FIFA's live world ranking API, falling back to the
// seeded FIFA_RANKS table if the fetch fails. Run manually any time, or rely on
// the autograder cron which now syncs ranks every run.
//   docker exec laselvaquiniela-app-1 npx tsx scripts/set-fifa-ranks.ts   (prod)
//   npx tsx scripts/set-fifa-ranks.ts                                     (local)
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { fetchLiveFifaRanks } from "../src/lib/teams/fifa-ranking";
import { FIFA_RANKS } from "../src/lib/teams/fifa-ranks";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatorio.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  let ranks: Record<string, number>;
  try {
    ranks = await fetchLiveFifaRanks();
    console.log(`Fetched live FIFA ranking (${Object.keys(ranks).length} teams).`);
  } catch (e) {
    ranks = FIFA_RANKS;
    console.warn("Live fetch failed, using seeded FIFA_RANKS.", e);
  }

  let updated = 0;
  for (const [code, rank] of Object.entries(ranks)) {
    const res = await prisma.team.updateMany({
      where: { code },
      data: { fifaRank: rank },
    });
    updated += res.count;
  }
  console.log(`Updated fifaRank for ${updated} teams.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
