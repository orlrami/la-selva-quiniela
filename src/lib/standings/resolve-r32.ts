// Pure planner that decides which confirmed (mathematically locked) group teams
// should be written into the Round-of-32 match rows. No DB / server-only imports
// so it can run both inside the server cascade and from a standalone tsx script.
//
// Only winner/runner-up slots that are LOCKED get persisted — third-place slots
// stay null (their exact assignment needs the best-thirds combination table) and
// unlocked slots stay null so predictions never open on a provisional team.

import { computeGroupClinch } from "./clinch";
import { type StandingMatch, type TeamMeta } from "./group-standings";
import { R32_SLOTS, type SlotRef } from "./r32-mapping";

export interface RawGroupTeam {
  id: string;
  name: string;
  fifaRank: number | null;
}
export interface RawGroupMatch {
  groupCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: RawGroupTeam | null;
  awayTeam: RawGroupTeam | null;
}
export interface R32Row {
  id: string;
  matchNumber: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
}
export interface R32Update {
  id: string;
  homeTeamId?: string;
  awayTeamId?: string;
}

interface GroupInput {
  teams: TeamMeta[];
  played: StandingMatch[];
  remaining: Array<{ homeTeamId: string; awayTeamId: string }>;
}

function shapeGroups(rows: RawGroupMatch[]): Map<string, GroupInput> {
  const byGroup = new Map<string, GroupInput>();
  for (const m of rows) {
    if (!m.groupCode || !m.homeTeam || !m.awayTeam) continue;
    if (!byGroup.has(m.groupCode)) byGroup.set(m.groupCode, { teams: [], played: [], remaining: [] });
    const g = byGroup.get(m.groupCode)!;
    const seen = new Set(g.teams.map((t) => t.id));
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!seen.has(t.id)) {
        g.teams.push({ id: t.id, name: t.name, fifaRank: t.fifaRank });
        seen.add(t.id);
      }
    }
    if (m.homeScore !== null && m.awayScore !== null) {
      g.played.push({ homeTeamId: m.homeTeam.id, awayTeamId: m.awayTeam.id, homeScore: m.homeScore, awayScore: m.awayScore });
    } else {
      g.remaining.push({ homeTeamId: m.homeTeam.id, awayTeamId: m.awayTeam.id });
    }
  }
  return byGroup;
}

/** Compute the R32 row updates implied by the current group results. */
export function planR32Resolution(groupRows: RawGroupMatch[], r32: R32Row[]): R32Update[] {
  const groups = shapeGroups(groupRows);
  const locked = new Map<string, { winner: string | null; runnerUp: string | null }>();
  for (const [code, g] of groups) {
    const c = computeGroupClinch(g);
    locked.set(code, { winner: c.slots.winner.lockedTeamId, runnerUp: c.slots.runnerUp.lockedTeamId });
  }

  const lockedTeam = (ref: SlotRef): string | null => {
    if (ref.kind === "third") return null;
    const l = locked.get(ref.group);
    if (!l) return null;
    return ref.kind === "winner" ? l.winner : l.runnerUp;
  };

  const updates: R32Update[] = [];
  for (const row of r32) {
    const map = R32_SLOTS[row.matchNumber];
    if (!map) continue;
    const home = lockedTeam(map.home);
    const away = lockedTeam(map.away);
    const update: R32Update = { id: row.id };
    let changed = false;
    if (home && home !== row.homeTeamId) { update.homeTeamId = home; changed = true; }
    if (away && away !== row.awayTeamId) { update.awayTeamId = away; changed = true; }
    if (changed) updates.push(update);
  }
  return updates;
}
