import "server-only";

import { prisma } from "@/lib/prisma";
import {
  computeGroupStandings,
  simpleGroupOrder,
  type StandingMatch,
  type TeamMeta,
} from "@/lib/standings/group-standings";

/**
 * Per-user count of correctly-predicted group positions across CLOSED groups
 * (every match final). Only counts users who predicted the WHOLE group, and
 * ranks the predicted order the same simple way the leaderboard does — so the
 * stat agrees with the leaderboard "pos. grupo" and the order-bonus.
 */
export async function getCorrectGroupPositions(
  quinielaId: string,
): Promise<Map<string, number>> {
  const [groupMatches, groupPreds] = await Promise.all([
    prisma.match.findMany({
      where: { stage: "GROUP" },
      select: {
        id: true,
        groupCode: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { id: true, name: true, fifaRank: true } },
        awayTeam: { select: { id: true, name: true, fifaRank: true } },
      },
    }),
    prisma.prediction.findMany({
      where: { quinielaId, match: { stage: "GROUP" } },
      select: { userId: true, matchId: true, homeScore: true, awayScore: true },
    }),
  ]);

  type GM = (typeof groupMatches)[number];
  const groups = new Map<string, { teams: Map<string, { id: string; name: string; fifaRank: number | null }>; matches: GM[] }>();
  for (const m of groupMatches) {
    if (!m.groupCode || !m.homeTeam || !m.awayTeam) continue;
    if (!groups.has(m.groupCode)) groups.set(m.groupCode, { teams: new Map(), matches: [] });
    const g = groups.get(m.groupCode)!;
    g.matches.push(m);
    for (const t of [m.homeTeam, m.awayTeam]) if (!g.teams.has(t.id)) g.teams.set(t.id, t);
  }

  const actualOrder = new Map<string, string[]>();
  for (const [code, g] of groups) {
    if (g.matches.length === 0 || !g.matches.every((m) => m.homeScore !== null && m.awayScore !== null)) continue;
    const sm: StandingMatch[] = g.matches.map((m) => ({
      homeTeamId: m.homeTeamId!,
      awayTeamId: m.awayTeamId!,
      homeScore: m.homeScore!,
      awayScore: m.awayScore!,
    }));
    const metas: TeamMeta[] = [...g.teams.values()].map((t) => ({ id: t.id, name: t.name, fifaRank: t.fifaRank }));
    actualOrder.set(code, computeGroupStandings(sm, metas).map((r) => r.teamId));
  }

  const matchInfo = new Map(groupMatches.map((m) => [m.id, m]));
  const predsByUserGroup = new Map<string, Array<{ homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number; homeTeamName: string; awayTeamName: string }>>();
  for (const p of groupPreds) {
    if (p.homeScore === null || p.awayScore === null) continue;
    const m = matchInfo.get(p.matchId);
    if (!m?.groupCode || !m.homeTeam || !m.awayTeam || !actualOrder.has(m.groupCode)) continue;
    const key = `${p.userId}::${m.groupCode}`;
    if (!predsByUserGroup.has(key)) predsByUserGroup.set(key, []);
    predsByUserGroup.get(key)!.push({
      homeTeamId: m.homeTeamId!,
      awayTeamId: m.awayTeamId!,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      homeTeamName: m.homeTeam.name,
      awayTeamName: m.awayTeam.name,
    });
  }

  const out = new Map<string, number>();
  for (const [key, preds] of predsByUserGroup) {
    const [uid, code] = key.split("::");
    const g = groups.get(code)!;
    if (preds.length < g.matches.length) continue; // full group only
    const predicted = simpleGroupOrder(preds);
    const actual = actualOrder.get(code)!;
    let correct = 0;
    for (let i = 0; i < actual.length; i++) if (predicted[i] === actual[i]) correct++;
    out.set(uid, (out.get(uid) ?? 0) + correct);
  }
  return out;
}
