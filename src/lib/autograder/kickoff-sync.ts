// Keep knockout kickoff times in sync with the REAL schedule.
//
// Our seed assigns kickoff times to bracket SLOTS (R16-1, QF-1, …), but the
// official schedule assigns times to the actual TEAM PAIRING. When the teams
// that land in a slot don't play at that slot's seeded time, the lock (kickoff −
// 30 min) is computed for the wrong moment and predictions stay open during the
// real game. This pulls each resolved, not-yet-final knockout match's kickoff
// from ESPN by matching the team pairing, so locks always track reality.

import { prisma } from "@/lib/prisma";

const SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

// Whole knockout window (R32 through final). Group games all finish before this.
const KO_DATE_RANGE = "20260628-20260719";

interface EspnEvent {
  home: string;
  away: string;
  date: string;
  completed: boolean;
}

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

async function fetchKnockoutEvents(): Promise<EspnEvent[]> {
  const res = await fetch(`${SCOREBOARD}?dates=${KO_DATE_RANGE}&limit=200`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`espn scoreboard ${res.status}`);
  const json = (await res.json()) as {
    events?: Array<{
      date?: string;
      status?: { type?: { completed?: boolean } };
      competitions?: Array<{
        competitors: Array<{ homeAway: string; team: { abbreviation: string } }>;
      }>;
    }>;
  };
  const out: EspnEvent[] = [];
  for (const e of json.events ?? []) {
    const comp = e.competitions?.[0];
    if (!comp || !e.date) continue;
    const h = comp.competitors.find((c) => c.homeAway === "home");
    const a = comp.competitors.find((c) => c.homeAway === "away");
    if (!h || !a) continue;
    out.push({
      home: h.team.abbreviation,
      away: a.team.abbreviation,
      date: e.date,
      completed: e.status?.type?.completed === true,
    });
  }
  return out;
}

/**
 * Set each resolved, not-yet-final knockout match's kickoff (and lockAt) to the
 * real ESPN time for that pairing. Only upcoming ESPN events are used, so a past
 * group rematch of the same two teams can never mis-set a future knockout game.
 * Returns the number of matches whose kickoff was corrected.
 */
export async function syncKickoffsFromEspn(): Promise<number> {
  const events = await fetchKnockoutEvents();
  const byPair = new Map<string, string>();
  for (const e of events) {
    if (e.completed) continue; // only upcoming games — never a finished group rematch
    byPair.set(pairKey(e.home, e.away), e.date);
  }
  if (byPair.size === 0) return 0;

  const matches = await prisma.match.findMany({
    where: {
      stage: { not: "GROUP" },
      status: { not: "FINAL" },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    select: {
      id: true,
      kickoffAt: true,
      homeTeam: { select: { code: true } },
      awayTeam: { select: { code: true } },
    },
  });

  let updated = 0;
  for (const m of matches) {
    if (!m.homeTeam || !m.awayTeam) continue;
    const iso = byPair.get(pairKey(m.homeTeam.code, m.awayTeam.code));
    if (!iso) continue;
    const espnMs = Date.parse(iso);
    if (Number.isNaN(espnMs) || m.kickoffAt.getTime() === espnMs) continue;
    const when = new Date(espnMs);
    await prisma.match.update({
      where: { id: m.id },
      data: { kickoffAt: when, lockAt: when },
    });
    updated++;
  }
  return updated;
}
