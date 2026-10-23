// ESPN read layer for the hybrid bracket: live group standings + the Round-of-32
// slot fills. Same public fifa.world API as the autograder (no key). Pure fetch +
// parse — safe to import from scripts. Team abbreviations == our FIFA codes 1:1.

const STANDINGS = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export interface EspnStandingRow {
  code: string;
  name: string;
  rank: number;
  advanced: boolean;
  points: number;
  goalDiff: number;
  goalsFor: number;
}

interface RawStat { name: string; value?: number; displayValue?: string }
interface RawEntry { team: { abbreviation: string; displayName: string }; stats: RawStat[] }
interface RawGroup { abbreviation?: string; name?: string; standings?: { entries: RawEntry[] } }

function stat(stats: RawStat[], name: string): number {
  const s = stats.find((x) => x.name === name);
  if (!s) return 0;
  return typeof s.value === "number" ? s.value : Number(s.displayValue) || 0;
}

/** Live group standings keyed by group letter, ordered by ESPN's rank. */
export async function fetchEspnStandings(): Promise<Map<string, EspnStandingRow[]>> {
  const res = await fetch(STANDINGS, { cache: "no-store" });
  if (!res.ok) throw new Error(`espn standings ${res.status}`);
  const json = (await res.json()) as { children?: RawGroup[] };
  const out = new Map<string, EspnStandingRow[]>();
  for (const g of json.children ?? []) {
    const code = (g.abbreviation ?? g.name ?? "").replace("Group ", "").trim();
    if (!code || !g.standings) continue;
    const rows = g.standings.entries.map((e) => ({
      code: e.team.abbreviation,
      name: e.team.displayName,
      rank: stat(e.stats, "rank"),
      advanced: stat(e.stats, "advanced") === 1,
      points: stat(e.stats, "points"),
      goalDiff: stat(e.stats, "pointDifferential"),
      goalsFor: stat(e.stats, "pointsFor"),
    }));
    rows.sort((a, b) => a.rank - b.rank);
    out.set(code, rows);
  }
  return out;
}

import { R32_SLOTS } from "@/lib/standings/r32-mapping";

export interface EspnR32Side {
  /** ESPN abbreviation: a slot code (1A/2B/3RD) while unfilled, or a FIFA team code once confirmed. */
  abbr: string;
  displayName: string;
}
export interface EspnR32Event {
  name: string;
  home: EspnR32Side;
  away: EspnR32Side;
}

/** Round-of-32 events with each side's raw slot code or confirmed team code. */
export async function fetchEspnR32(): Promise<EspnR32Event[]> {
  const res = await fetch(`${SCOREBOARD}?dates=20260628-20260703&limit=100`, { cache: "no-store" });
  if (!res.ok) throw new Error(`espn scoreboard ${res.status}`);
  const json = (await res.json()) as {
    events?: Array<{
      name: string;
      competitions?: Array<{ competitors: Array<{ homeAway: string; team: { abbreviation: string; displayName: string } }> }>;
    }>;
  };
  const side = (c?: { team: { abbreviation: string; displayName: string } }): EspnR32Side => ({
    abbr: c?.team.abbreviation ?? "",
    displayName: c?.team.displayName ?? "",
  });
  return (json.events ?? []).map((e) => {
    const comp = e.competitions?.[0];
    return {
      name: e.name,
      home: side(comp?.competitors.find((c) => c.homeAway === "home")),
      away: side(comp?.competitors.find((c) => c.homeAway === "away")),
    };
  });
}

export interface R32Fill {
  matchNumber: number;
  side: "home" | "away";
  teamCode: string;
}

// Slot code (1X = winner of X, 2X = runner-up of X) → our R32 match + side.
function buildCodeToSlot(): Map<string, { matchNumber: number; side: "home" | "away" }> {
  const map = new Map<string, { matchNumber: number; side: "home" | "away" }>();
  for (const [mnStr, slots] of Object.entries(R32_SLOTS)) {
    const matchNumber = Number(mnStr);
    for (const side of ["home", "away"] as const) {
      const ref = slots[side];
      if (ref.kind === "winner") map.set(`1${ref.group}`, { matchNumber, side });
      else if (ref.kind === "runnerUp") map.set(`2${ref.group}`, { matchNumber, side });
    }
  }
  return map;
}

// The side of an R32 match whose slot is fed by a third-placed team.
function thirdSideOf(matchNumber: number): "home" | "away" | null {
  const slots = R32_SLOTS[matchNumber];
  if (!slots) return null;
  if (slots.home.kind === "third") return "home";
  if (slots.away.kind === "third") return "away";
  return null;
}

const SLOT_CODE = /^([12])([A-L])$/;

/**
 * Resolve which CONFIRMED teams ESPN has placed into the R32, mapped to our
 * (matchNumber, side, teamCode). A side is "confirmed" when its abbreviation is
 * a real FIFA code rather than a slot code (1A/2B/3RD). Winners/runners-up map
 * directly; a confirmed third is placed on the third-side of the match its
 * companion winner/runner-up identifies.
 */
export function r32FillsFromEspn(
  events: EspnR32Event[],
  standings: Map<string, EspnStandingRow[]>,
): R32Fill[] {
  const codeToSlot = buildCodeToSlot();
  // teamCode → group + rank (to resolve a confirmed team's slot).
  const teamPos = new Map<string, { group: string; rank: number }>();
  for (const [group, rows] of standings) {
    for (const r of rows) teamPos.set(r.code, { group, rank: r.rank });
  }
  const isSlotCode = (abbr: string) => SLOT_CODE.test(abbr) || abbr === "3RD";

  const fills: R32Fill[] = [];
  for (const ev of events) {
    // matchNumber from whichever side resolves to a winner/runner-up slot.
    let matchNumber: number | null = null;
    for (const s of [ev.home, ev.away]) {
      let key: string | null = SLOT_CODE.test(s.abbr) ? s.abbr : null;
      if (!key && !isSlotCode(s.abbr)) {
        const pos = teamPos.get(s.abbr);
        if (pos && pos.rank <= 2) key = `${pos.rank}${pos.group}`;
      }
      if (key && codeToSlot.has(key)) matchNumber = codeToSlot.get(key)!.matchNumber;
    }

    for (const s of [ev.home, ev.away]) {
      if (isSlotCode(s.abbr)) continue; // still a placeholder, not confirmed
      const pos = teamPos.get(s.abbr);
      if (!pos) continue; // unknown team (shouldn't happen — codes are 1:1)
      if (pos.rank <= 2) {
        const target = codeToSlot.get(`${pos.rank}${pos.group}`);
        if (target) fills.push({ matchNumber: target.matchNumber, side: target.side, teamCode: s.abbr });
      } else if (matchNumber !== null) {
        const side = thirdSideOf(matchNumber);
        if (side) fills.push({ matchNumber, side, teamCode: s.abbr });
      }
    }
  }
  return fills;
}
