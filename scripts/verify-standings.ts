// Hand-computed verification for the FIFA 2026 standings engine.
// Run: npx tsx scripts/verify-standings.ts
import { computeGroupStandings, type StandingMatch, type TeamMeta } from "../src/lib/standings/group-standings";

let failures = 0;
function check(label: string, got: string[], want: string[]) {
  const ok = got.length === want.length && got.every((v, i) => v === want[i]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) {
    console.log(`   want: ${want.join(",")}`);
    console.log(`   got:  ${got.join(",")}`);
    failures++;
  }
}

const teams: TeamMeta[] = [
  { id: "A", name: "A" },
  { id: "B", name: "B" },
  { id: "C", name: "C" },
  { id: "D", name: "D" },
];
const order = (matches: StandingMatch[]) =>
  computeGroupStandings(matches, teams).map((r) => r.teamId);

// --- Test 1: head-to-head BEATS overall goal difference (the 2026 change) ---
// A and B both finish on 6 pts. A has the far better overall GD (+7 vs +1),
// but B beat A head-to-head, so B must rank above A.
check(
  "H2H overrides overall GD (B above A despite A's better GD)",
  order([
    { homeTeamId: "A", awayTeamId: "C", homeScore: 4, awayScore: 0 }, // A beat C
    { homeTeamId: "A", awayTeamId: "D", homeScore: 4, awayScore: 0 }, // A beat D
    { homeTeamId: "A", awayTeamId: "B", homeScore: 0, awayScore: 1 }, // B beat A
    { homeTeamId: "B", awayTeamId: "C", homeScore: 0, awayScore: 1 }, // C beat B
    { homeTeamId: "B", awayTeamId: "D", homeScore: 1, awayScore: 0 }, // B beat D
    { homeTeamId: "C", awayTeamId: "D", homeScore: 0, awayScore: 1 }, // D beat C
  ]),
  ["B", "A", "D", "C"],
);

// --- Test 2: 3-way tie where H2H is level → falls through to overall GD ---
// A,B,C are a rock-paper-scissors among themselves (each 3 H2H pts, GD 0, GF 1),
// so H2H cannot separate them; overall GD (margins vs D) decides: A>B>C.
check(
  "3-way H2H tie resolved by overall GD",
  order([
    { homeTeamId: "A", awayTeamId: "B", homeScore: 1, awayScore: 0 }, // A beat B
    { homeTeamId: "B", awayTeamId: "C", homeScore: 1, awayScore: 0 }, // B beat C
    { homeTeamId: "C", awayTeamId: "A", homeScore: 1, awayScore: 0 }, // C beat A
    { homeTeamId: "A", awayTeamId: "D", homeScore: 3, awayScore: 0 }, // A +3 vs D
    { homeTeamId: "B", awayTeamId: "D", homeScore: 2, awayScore: 0 }, // B +2 vs D
    { homeTeamId: "C", awayTeamId: "D", homeScore: 1, awayScore: 0 }, // C +1 vs D
  ]),
  ["A", "B", "C", "D"],
);

// --- Test 3: plain points ordering, no ties ---
check(
  "plain points ordering",
  order([
    { homeTeamId: "A", awayTeamId: "B", homeScore: 1, awayScore: 0 },
    { homeTeamId: "A", awayTeamId: "C", homeScore: 1, awayScore: 0 },
    { homeTeamId: "A", awayTeamId: "D", homeScore: 1, awayScore: 0 }, // A 9 pts
    { homeTeamId: "B", awayTeamId: "C", homeScore: 1, awayScore: 0 },
    { homeTeamId: "B", awayTeamId: "D", homeScore: 1, awayScore: 0 }, // B 6 pts
    { homeTeamId: "C", awayTeamId: "D", homeScore: 1, awayScore: 0 }, // C 3, D 0
  ]),
  ["A", "B", "C", "D"],
);

// --- Test 4: two teams level on pts & H2H drawn → overall GD, then fifaRank ---
// A and B draw head-to-head and have identical overall GD/GF; fifaRank breaks it.
const rankedTeams: TeamMeta[] = [
  { id: "A", name: "A", fifaRank: 10 },
  { id: "B", name: "B", fifaRank: 5 }, // better rank
  { id: "C", name: "C", fifaRank: 20 },
  { id: "D", name: "D", fifaRank: 30 },
];
check(
  "fifaRank as last resort (B above A)",
  computeGroupStandings(
    [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 1, awayScore: 1 }, // draw
      { homeTeamId: "A", awayTeamId: "C", homeScore: 2, awayScore: 0 },
      { homeTeamId: "A", awayTeamId: "D", homeScore: 0, awayScore: 0 },
      { homeTeamId: "B", awayTeamId: "C", homeScore: 2, awayScore: 0 },
      { homeTeamId: "B", awayTeamId: "D", homeScore: 0, awayScore: 0 },
      { homeTeamId: "C", awayTeamId: "D", homeScore: 0, awayScore: 0 },
    ],
    rankedTeams,
  ).map((r) => r.teamId),
  ["B", "A", "D", "C"], // D has 3 draws (3 pts) > C (1 pt); B above A via fifaRank
);

console.log(failures === 0 ? "\nAll standings checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
