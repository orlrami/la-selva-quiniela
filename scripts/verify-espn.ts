// Verify the ESPN autograder data path: fetch WC scoreboards and show parsed
// matches (codes, scores, completed). Usage: npx tsx scripts/verify-espn.ts
import { fetchScoreboard, espnDate } from "../src/lib/autograder/espn";

async function main() {
  const now = new Date();
  for (const offset of [-1, 0, 1]) {
    const d = espnDate(new Date(now.getTime() + offset * 86400000));
    const matches = await fetchScoreboard(d);
    console.log(`\n${d}: ${matches.length} matches`);
    for (const m of matches) {
      console.log(
        `  ${m.homeCode} ${m.homeScore}-${m.awayScore} ${m.awayCode}  completed=${m.completed} live=${m.live}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
