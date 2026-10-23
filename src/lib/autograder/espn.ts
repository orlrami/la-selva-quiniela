// ESPN public soccer API — free, no key, uncapped. Covers the 2026 World Cup
// (league slug "fifa.world") with live scores + final results. ESPN team
// abbreviations match our FIFA codes 1:1 (verified for all 48 teams), so no
// name mapping is needed.
//
// Scoreboard: /scoreboard?dates=YYYYMMDD  -> events for that calendar day.

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

export interface EspnMatch {
  id: string;
  homeCode: string;
  awayCode: string;
  /** True 90/120-min score (no penalty bump). */
  homeScore: number;
  awayScore: number;
  /** Knockout decided on penalties. */
  decidedByPenalties: boolean;
  /** Team that progresses (penalty winner, or regulation/ET winner). */
  advancerCode: string | null;
  completed: boolean;
  live: boolean;
}

interface RawCompetitor {
  homeAway: string;
  score: string;
  winner?: boolean;
  shootoutScore?: number | string;
  team: { abbreviation: string };
}

interface RawEvent {
  id: string;
  status?: { type?: { state?: string; completed?: boolean } };
  competitions?: Array<{ competitors: RawCompetitor[] }>;
}

interface Scoreboard {
  events?: RawEvent[];
}

export async function fetchScoreboard(date: string): Promise<EspnMatch[]> {
  const res = await fetch(`${BASE}/scoreboard?dates=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`espn ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as Scoreboard;

  const out: EspnMatch[] = [];
  for (const e of json.events ?? []) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const h = Number(home.score);
    const a = Number(away.score);
    if (!Number.isInteger(h) || !Number.isInteger(a)) continue;

    // Keep the true 90/120-min score; derive who advances separately so knockout
    // scoring can reward the penalty pick (no more faking it with a +1 bump).
    let decidedByPenalties = false;
    let advancerCode: string | null = null;
    if (h !== a) {
      advancerCode = h > a ? home.team.abbreviation : away.team.abbreviation;
    } else {
      const hso = Number(home.shootoutScore);
      const aso = Number(away.shootoutScore);
      if (Number.isInteger(hso) && Number.isInteger(aso) && hso !== aso) {
        decidedByPenalties = true;
        advancerCode = hso > aso ? home.team.abbreviation : away.team.abbreviation;
      } else if (home.winner === true) {
        decidedByPenalties = true;
        advancerCode = home.team.abbreviation;
      } else if (away.winner === true) {
        decidedByPenalties = true;
        advancerCode = away.team.abbreviation;
      }
    }

    out.push({
      id: e.id,
      homeCode: home.team.abbreviation,
      awayCode: away.team.abbreviation,
      homeScore: h,
      awayScore: a,
      decidedByPenalties,
      advancerCode,
      completed: e.status?.type?.completed === true,
      live: e.status?.type?.state === "in",
    });
  }
  return out;
}

/** Convert a JS Date to ESPN's YYYYMMDD scoreboard parameter. */
export function espnDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
