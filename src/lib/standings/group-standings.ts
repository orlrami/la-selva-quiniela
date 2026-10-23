// FIFA World Cup 2026 group-stage standings engine.
//
// Tiebreaker order (verified vs FIFA 2026 regulations — head-to-head is applied
// BEFORE overall goal difference, a change from 2018/2022):
//   1. Points
//   2. Head-to-head points (matches among the still-tied teams only)
//   3. Head-to-head goal difference
//   4. Head-to-head goals scored
//   5. Overall goal difference
//   6. Overall goals scored
//   7. Fair-play / conduct score        — SKIPPED (no card data stored)
//   8. FIFA world ranking (lower = better; no more drawing of lots)
//
// Subset re-application: when a criterion separates only some of a tied group,
// the criteria restart from the top for the teams that remain tied.

export interface StandingMatch {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamMeta {
  id: string;
  name: string;
  /** Lower is better. Optional; used only as the last-resort tiebreaker. */
  fifaRank?: number | null;
}

export interface StandingRow {
  teamId: string;
  name: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  position: number;
}

interface Tally {
  pts: number;
  gd: number;
  gf: number;
  ga: number;
  w: number;
  d: number;
  l: number;
  mp: number;
}

function emptyTally(): Tally {
  return { pts: 0, gd: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, mp: 0 };
}

/** Accumulate a result into both teams' tallies. */
function applyResult(t: Map<string, Tally>, home: string, away: string, hs: number, as: number) {
  const h = t.get(home)!;
  const a = t.get(away)!;
  h.mp++; a.mp++;
  h.gf += hs; h.ga += as; h.gd = h.gf - h.ga;
  a.gf += as; a.ga += hs; a.gd = a.gf - a.ga;
  if (hs > as) { h.w++; a.l++; h.pts += 3; }
  else if (hs < as) { a.w++; h.l++; a.pts += 3; }
  else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
}

/** Overall tally across all supplied matches, one entry per team. */
function overallTally(matches: StandingMatch[], teamIds: string[]): Map<string, Tally> {
  const t = new Map<string, Tally>();
  for (const id of teamIds) t.set(id, emptyTally());
  for (const m of matches) {
    if (!t.has(m.homeTeamId) || !t.has(m.awayTeamId)) continue;
    applyResult(t, m.homeTeamId, m.awayTeamId, m.homeScore, m.awayScore);
  }
  return t;
}

/**
 * Order a set of teams that are all tied on overall points, applying the FIFA
 * criteria with correct subset re-application. Returns teamIds best-first.
 */
function breakTie(
  tied: string[],
  allMatches: StandingMatch[],
  overall: Map<string, Tally>,
  rank: Map<string, number>,
): string[] {
  if (tied.length <= 1) return tied;
  const set = new Set(tied);

  // Head-to-head tally: only matches where BOTH teams are in the current set.
  const h2h = new Map<string, Tally>();
  for (const id of tied) h2h.set(id, emptyTally());
  for (const m of allMatches) {
    if (set.has(m.homeTeamId) && set.has(m.awayTeamId)) {
      applyResult(h2h, m.homeTeamId, m.awayTeamId, m.homeScore, m.awayScore);
    }
  }

  // Criteria, best-first. H2H criteria are recomputed per subset (via recursion);
  // overall + fifaRank are global. Fair-play (step 7) is intentionally omitted.
  const keyFns: Array<{ recompute: boolean; key: (id: string) => number }> = [
    { recompute: true, key: (id) => h2h.get(id)!.pts },
    { recompute: true, key: (id) => h2h.get(id)!.gd },
    { recompute: true, key: (id) => h2h.get(id)!.gf },
    { recompute: false, key: (id) => overall.get(id)!.gd },
    { recompute: false, key: (id) => overall.get(id)!.gf },
    // fifaRank: lower is better, so negate; missing rank sorts last.
    { recompute: false, key: (id) => -(rank.get(id) ?? Number.MAX_SAFE_INTEGER) },
  ];

  for (let i = 0; i < keyFns.length; i++) {
    const { key } = keyFns[i];
    // Group the tied teams by this criterion's value.
    const buckets = new Map<number, string[]>();
    for (const id of tied) {
      const v = key(id);
      if (!buckets.has(v)) buckets.set(v, []);
      buckets.get(v)!.push(id);
    }
    if (buckets.size === 1) continue; // criterion didn't separate anyone

    // Criterion separated the group. Emit buckets best-first; any bucket that is
    // still tied restarts the full criteria list (FIFA subset re-application).
    const values = Array.from(buckets.keys()).sort((a, b) => b - a);
    const out: string[] = [];
    for (const v of values) {
      const bucket = buckets.get(v)!;
      out.push(...breakTie(bucket, allMatches, overall, rank));
    }
    return out;
  }

  // Fully tied through every criterion — deterministic final fallback.
  return [...tied].sort((a, b) => a.localeCompare(b));
}

/**
 * Lightweight predicted-order sort (points → GD → GF → name). Matches what the
 * predictions table shows client-side, so green highlights, leaderboard stats,
 * and the group-order bonus all rank a user's predicted standings the same way.
 * (Actual final standings use the full FIFA engine above.)
 */
export function simpleGroupOrder(
  matches: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number; homeTeamName: string; awayTeamName: string }>,
): string[] {
  const s = new Map<string, { id: string; name: string; pts: number; gd: number; gf: number }>();
  const ensure = (id: string, name: string) => {
    if (!s.has(id)) s.set(id, { id, name, pts: 0, gd: 0, gf: 0 });
  };
  for (const m of matches) {
    ensure(m.homeTeamId, m.homeTeamName);
    ensure(m.awayTeamId, m.awayTeamName);
    const h = s.get(m.homeTeamId)!;
    const a = s.get(m.awayTeamId)!;
    h.gf += m.homeScore; h.gd += m.homeScore - m.awayScore;
    a.gf += m.awayScore; a.gd += m.awayScore - m.homeScore;
    if (m.homeScore > m.awayScore) h.pts += 3;
    else if (m.homeScore < m.awayScore) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  }
  return [...s.values()]
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name, "es"))
    .map((r) => r.id);
}

/**
 * Compute the ordered group standings for a set of teams and their played
 * matches. `matches` should contain only this group's matches with both scores
 * set. Teams with no matches yet still appear (all zeros).
 */
export function computeGroupStandings(matches: StandingMatch[], teams: TeamMeta[]): StandingRow[] {
  const teamIds = teams.map((t) => t.id);
  const meta = new Map(teams.map((t) => [t.id, t]));
  const rank = new Map(teams.map((t) => [t.id, t.fifaRank ?? Number.MAX_SAFE_INTEGER]));
  const overall = overallTally(matches, teamIds);

  // Group teams by points, then order each points-bucket via the tiebreaker.
  const byPoints = new Map<number, string[]>();
  for (const id of teamIds) {
    const p = overall.get(id)!.pts;
    if (!byPoints.has(p)) byPoints.set(p, []);
    byPoints.get(p)!.push(id);
  }
  const orderedIds: string[] = [];
  for (const p of Array.from(byPoints.keys()).sort((a, b) => b - a)) {
    orderedIds.push(...breakTie(byPoints.get(p)!, matches, overall, rank));
  }

  return orderedIds.map((id, i) => {
    const t = overall.get(id)!;
    return {
      teamId: id,
      name: meta.get(id)?.name ?? id,
      mp: t.mp, w: t.w, d: t.d, l: t.l,
      gf: t.gf, ga: t.ga, gd: t.gd, pts: t.pts,
      position: i + 1,
    };
  });
}
