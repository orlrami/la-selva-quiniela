// Conservative clinch / lock detection for a World Cup group.
//
// "Conservative" means a position is only declared locked when it holds in EVERY
// possible combination of the remaining results, with points ties assumed to
// break AGAINST the team for guarantees and FOR the team for elimination. This
// never shows a false permanent lock; it may show the lock one game later than a
// fan's intuition (e.g. when a head-to-head result already decides a points tie).
//
// Positions advancing at the 2026 World Cup: 1st + 2nd qualify directly; the 8
// best of the 12 third-placed teams also advance (decided cross-group, so a team
// locked into 3rd is NOT eliminated — it enters the best-thirds race). Only a
// team locked into 4th (or otherwise unable to reach 3rd) is eliminated here.

import { computeGroupStandings, type StandingMatch, type TeamMeta } from "./group-standings";

export interface ClinchInput {
  teams: TeamMeta[];
  /** Matches already finished, with scores. */
  played: StandingMatch[];
  /** Remaining fixtures (teams known, not yet played). */
  remaining: Array<{ homeTeamId: string; awayTeamId: string }>;
}

export type ClinchStatus =
  | "WINNER" // locked 1st
  | "QUALIFIED" // locked top 2 (not necessarily 1st)
  | "OUT_OF_TOP2" // cannot reach top 2, but can still finish 3rd (thirds race)
  | "ELIMINATED" // cannot reach top 3
  | "CONTENDING"; // still in range for top 2 and below

export interface TeamClinch {
  teamId: string;
  pts: number; // current points from played matches
  bestPosition: number; // best (lowest number) still achievable
  worstPosition: number; // worst (highest number) possible
  status: ClinchStatus;
}

export interface SlotClinch {
  position: 1 | 2 | 3;
  lockedTeamId: string | null;
  /** Teams that can still occupy this position, ordered by current standing. */
  candidates: string[];
}

export interface GroupClinch {
  /** Teams in current standing order (from played matches only). */
  order: string[];
  teams: Record<string, TeamClinch>;
  slots: { winner: SlotClinch; runnerUp: SlotClinch; third: SlotClinch };
}

function pointsFromPlayed(teamIds: string[], played: StandingMatch[]): Map<string, number> {
  const pts = new Map(teamIds.map((id) => [id, 0]));
  for (const m of played) {
    if (m.homeScore > m.awayScore) pts.set(m.homeTeamId, (pts.get(m.homeTeamId) ?? 0) + 3);
    else if (m.homeScore < m.awayScore) pts.set(m.awayTeamId, (pts.get(m.awayTeamId) ?? 0) + 3);
    else {
      pts.set(m.homeTeamId, (pts.get(m.homeTeamId) ?? 0) + 1);
      pts.set(m.awayTeamId, (pts.get(m.awayTeamId) ?? 0) + 1);
    }
  }
  return pts;
}

export function computeGroupClinch(input: ClinchInput): GroupClinch {
  const teamIds = input.teams.map((t) => t.id);
  const basePts = pointsFromPlayed(teamIds, input.played);

  // Current standing order (definitive when nothing remains; display + candidate
  // ordering otherwise). Uses the real engine on played matches only.
  const order = computeGroupStandings(input.played, input.teams).map((r) => r.teamId);
  const currentPos = new Map(order.map((id, i) => [id, i + 1] as const));

  const best = new Map(teamIds.map((id) => [id, Number.POSITIVE_INFINITY]));
  const worst = new Map(teamIds.map((id) => [id, 0]));

  const k = input.remaining.length;
  if (k === 0) {
    // Group decided — positions are exactly the engine order.
    for (const id of teamIds) {
      best.set(id, currentPos.get(id)!);
      worst.set(id, currentPos.get(id)!);
    }
  } else {
    const combos = 3 ** k;
    for (let mask = 0; mask < combos; mask++) {
      const pts = new Map(basePts);
      let rem = mask;
      for (let i = 0; i < k; i++) {
        const outcome = rem % 3;
        rem = Math.floor(rem / 3);
        const { homeTeamId, awayTeamId } = input.remaining[i];
        if (outcome === 0) pts.set(homeTeamId, pts.get(homeTeamId)! + 3); // home win
        else if (outcome === 1) {
          pts.set(homeTeamId, pts.get(homeTeamId)! + 1); // draw
          pts.set(awayTeamId, pts.get(awayTeamId)! + 1);
        } else pts.set(awayTeamId, pts.get(awayTeamId)! + 3); // away win
      }
      for (const id of teamIds) {
        const p = pts.get(id)!;
        let ge = 0; // rivals with >= points (ties against → worst case)
        let gt = 0; // rivals with > points (ties for → best case)
        for (const other of teamIds) {
          if (other === id) continue;
          const op = pts.get(other)!;
          if (op >= p) ge++;
          if (op > p) gt++;
        }
        worst.set(id, Math.max(worst.get(id)!, 1 + ge));
        best.set(id, Math.min(best.get(id)!, 1 + gt));
      }
    }
  }

  const teams: Record<string, TeamClinch> = {};
  for (const id of teamIds) {
    const b = best.get(id)!;
    const w = worst.get(id)!;
    let status: ClinchStatus;
    if (w === 1) status = "WINNER";
    else if (w <= 2) status = "QUALIFIED";
    else if (b >= 4) status = "ELIMINATED";
    else if (b >= 3) status = "OUT_OF_TOP2";
    else status = "CONTENDING";
    teams[id] = { teamId: id, pts: basePts.get(id)!, bestPosition: b, worstPosition: w, status };
  }

  const lockedAt = (p: number) => teamIds.find((id) => teams[id].bestPosition === p && teams[id].worstPosition === p) ?? null;
  const lockedPositions = new Map<string, number>();
  for (const p of [1, 2, 3]) {
    const id = lockedAt(p);
    if (id) lockedPositions.set(id, p);
  }
  const candidatesFor = (p: number): string[] =>
    order.filter((id) => {
      const t = teams[id];
      if (t.bestPosition <= p && p <= t.worstPosition) {
        const locked = lockedPositions.get(id);
        return locked === undefined || locked === p;
      }
      return false;
    });

  const slot = (position: 1 | 2 | 3): SlotClinch => {
    const lockedTeamId = lockedAt(position);
    return { position, lockedTeamId, candidates: lockedTeamId ? [lockedTeamId] : candidatesFor(position) };
  };

  return {
    order,
    teams,
    slots: { winner: slot(1), runnerUp: slot(2), third: slot(3) },
  };
}
