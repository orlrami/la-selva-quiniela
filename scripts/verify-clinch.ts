// Hand-computed verification for conservative clinch detection.
// Run: npx tsx scripts/verify-clinch.ts
import { computeGroupClinch, type ClinchInput } from "../src/lib/standings/clinch";
import { type StandingMatch, type TeamMeta } from "../src/lib/standings/group-standings";

let failures = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) { console.log(`   want: ${JSON.stringify(want)}`); console.log(`   got:  ${JSON.stringify(got)}`); failures++; }
}

const teams: TeamMeta[] = [
  { id: "A", name: "A" }, { id: "B", name: "B" }, { id: "C", name: "C" }, { id: "D", name: "D" },
];
const m = (h: string, a: string, hs: number, as: number): StandingMatch => ({ homeTeamId: h, awayTeamId: a, homeScore: hs, awayScore: as });

// --- Test A: fully played group, decisive order A>B>C>D ---
{
  const played = [
    m("A", "B", 1, 0), m("A", "C", 1, 0), m("A", "D", 1, 0),
    m("B", "C", 1, 0), m("B", "D", 1, 0),
    m("C", "D", 1, 0),
  ];
  const g = computeGroupClinch({ teams, played, remaining: [] } as ClinchInput);
  eq("A: final order", g.order, ["A", "B", "C", "D"]);
  eq("A: winner locked = A", g.slots.winner.lockedTeamId, "A");
  eq("A: runner-up locked = B", g.slots.runnerUp.lockedTeamId, "B");
  eq("A: third locked = C", g.slots.third.lockedTeamId, "C");
  eq("A: statuses", [g.teams.A.status, g.teams.B.status, g.teams.C.status, g.teams.D.status],
     ["WINNER", "QUALIFIED", "OUT_OF_TOP2", "ELIMINATED"]);
}

// --- Test C: winner mathematically locked with one round left ---
// After 2 rounds: A=6, B=1, C=1, D=2. Remaining: A-D, B-C. Rivals cap at <6.
{
  const played = [
    m("A", "B", 1, 0), m("C", "D", 0, 0), // R1: A 3/0, C1 D1
    m("A", "C", 1, 0), m("B", "D", 0, 0), // R2: A 6, C1, B1 D2
  ];
  const remaining = [{ homeTeamId: "A", awayTeamId: "D" }, { homeTeamId: "B", awayTeamId: "C" }];
  const g = computeGroupClinch({ teams, played, remaining });
  eq("C: A is WINNER (locked 1st)", g.teams.A.status, "WINNER");
  eq("C: winner slot locked = A", g.slots.winner.lockedTeamId, "A");
  eq("C: A best/worst position", [g.teams.A.bestPosition, g.teams.A.worstPosition], [1, 1]);
  // No one else is locked into 2nd/3rd yet (still contested).
  eq("C: runner-up not locked", g.slots.runnerUp.lockedTeamId, null);
}

// --- Test B: leader guaranteed top-2 but NOT 1st (a rival can tie on points) ---
// After 2 rounds: A=6, B=3, C=3, D=0. Remaining: A-D, B-C. B or C can reach 6.
{
  const played = [
    m("A", "B", 1, 0), m("C", "D", 1, 0),
    m("A", "C", 1, 0), m("B", "D", 1, 0),
  ];
  const remaining = [{ homeTeamId: "A", awayTeamId: "D" }, { homeTeamId: "B", awayTeamId: "C" }];
  const g = computeGroupClinch({ teams, played, remaining });
  eq("B: A QUALIFIED but not WINNER", g.teams.A.status, "QUALIFIED");
  eq("B: A range [1,2]", [g.teams.A.bestPosition, g.teams.A.worstPosition], [1, 2]);
  eq("B: winner slot not locked", g.slots.winner.lockedTeamId, null);
  eq("B: D still alive for 3rd (OUT_OF_TOP2, not ELIMINATED)", g.teams.D.status, "OUT_OF_TOP2");
}

console.log(failures === 0 ? "\nAll clinch checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
