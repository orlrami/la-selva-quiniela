// Verify the ESPN R32 scraper fills BOTH sides once both teams of a match are
// confirmed (the case that opens predictions). Uses synthetic ESPN data so it
// doesn't depend on the live tournament state. Run: npx tsx scripts/verify-r32-scraper.ts
import { r32FillsFromEspn, type EspnR32Event } from "../src/lib/autograder/espn-bracket";
import { type EspnStandingRow } from "../src/lib/autograder/espn-bracket";

let failures = 0;
function check(label: string, cond: boolean, detail?: string) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${cond ? "" : `  — ${detail ?? ""}`}`);
  if (!cond) failures++;
}

const row = (code: string, rank: number): EspnStandingRow => ({
  code, name: code, rank, advanced: rank <= 2, points: 0, goalDiff: 0, goalsFor: 0,
});
// Group → ranked rows. AAA=2A, BBB=2B (runners-up); EEE=1E (winner); CCC=3C (third).
const standings = new Map<string, EspnStandingRow[]>([
  ["A", [row("AAA", 2)]],
  ["B", [row("BBB", 2)]],
  ["E", [row("EEE", 1)]],
  ["C", [row("CCC", 3)]],
]);

const side = (abbr: string) => ({ abbr, displayName: abbr });
const events: EspnR32Event[] = [
  // #73 = Runner-up A vs Runner-up B — BOTH confirmed.
  { name: "73", home: side("AAA"), away: side("BBB") },
  // #74 = Winner E vs Third (A/B/C/D/F) — winner + third BOTH confirmed.
  { name: "74", home: side("EEE"), away: side("CCC") },
];

const fills = r32FillsFromEspn(events, standings);
const byMatch = new Map<number, { home?: string; away?: string }>();
for (const f of fills) {
  const e = byMatch.get(f.matchNumber) ?? {};
  if (f.side === "home") e.home = f.teamCode;
  else e.away = f.teamCode;
  byMatch.set(f.matchNumber, e);
}

console.log("fills:", JSON.stringify(fills));
check("emitted 4 fills (both sides of 2 matches)", fills.length === 4, `got ${fills.length}`);

// #73: both runners-up land on the correct sides → match is complete.
const m73 = byMatch.get(73) ?? {};
check("#73 home = AAA (2A)", m73.home === "AAA", m73.home);
check("#73 away = BBB (2B)", m73.away === "BBB", m73.away);
check("#73 BOTH teams set → predictable", !!(m73.home && m73.away));

// #74: confirmed winner + confirmed third land correctly → match is complete.
const m74 = byMatch.get(74) ?? {};
check("#74 home = EEE (1E winner)", m74.home === "EEE", m74.home);
check("#74 away = CCC (third placed)", m74.away === "CCC", m74.away);
check("#74 BOTH teams set → predictable", !!(m74.home && m74.away));

console.log(failures === 0 ? "\nScraper picks up both-confirmed matches." : `\n${failures} FAILED.`);
process.exit(failures === 0 ? 0 : 1);
