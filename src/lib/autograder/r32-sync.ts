import "server-only";

import { prisma } from "@/lib/prisma";
import { fetchEspnR32, fetchEspnStandings, r32FillsFromEspn } from "./espn-bracket";

/**
 * Pull the teams ESPN has officially confirmed into the Round of 32 and persist
 * them into our match rows. Runs on the autograder cron, so the bracket fills
 * over time as group results finalise. Once both teams of a match are set, the
 * existing prediction flow opens it (and closes it 30 min before kickoff).
 *
 * ESPN is the source of truth here (it accounts for full tiebreakers + official
 * confirmation). Read-only vs ESPN; only fills slots, never clears. Resilient:
 * a fetch failure returns 0 rather than breaking the cron.
 */
export async function syncR32FromEspn(): Promise<number> {
  let fills;
  try {
    const [events, standings] = await Promise.all([fetchEspnR32(), fetchEspnStandings()]);
    fills = r32FillsFromEspn(events, standings);
  } catch {
    return 0;
  }
  if (fills.length === 0) return 0;

  const codes = [...new Set(fills.map((f) => f.teamCode))];
  const teams = await prisma.team.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } });
  const idByCode = new Map(teams.map((t) => [t.code, t.id]));

  const byMatch = new Map<number, { homeTeamId?: string; awayTeamId?: string }>();
  for (const f of fills) {
    const id = idByCode.get(f.teamCode);
    if (!id) continue;
    const entry = byMatch.get(f.matchNumber) ?? {};
    if (f.side === "home") entry.homeTeamId = id;
    else entry.awayTeamId = id;
    byMatch.set(f.matchNumber, entry);
  }

  let updated = 0;
  for (const [matchNumber, data] of byMatch) {
    const res = await prisma.match.updateMany({ where: { matchNumber, stage: "ROUND_OF_32" }, data });
    updated += res.count;
  }
  return updated;
}
