// Live FIFA/Coca-Cola men's world ranking from FIFA's public API — free, no
// key. This is the same endpoint inside.fifa.com calls; it returns the *live*
// ranking, which shifts after each international match during a window (so it
// updates through the tournament, not only on official release days).
//
// Endpoint: api.fifa.com/api/v3/fifarankings/rankings/live
//   gender=1 (men), sportType=0 (football). `IdCountry` is FIFA's 3-letter
//   code and matches our team codes 1:1 (verified for all 48 teams).

const FIFA_RANKING_URL =
  "https://api.fifa.com/api/v3/fifarankings/rankings/live?gender=1&sportType=0&language=en";

interface RawRankingResult {
  IdCountry?: string;
  Rank?: number;
}

interface RawRanking {
  Results?: RawRankingResult[];
}

/**
 * Fetches the live FIFA ranking and returns a `code -> rank` map. Throws on a
 * non-OK response or empty payload so callers can fall back to seeded values.
 */
export async function fetchLiveFifaRanks(): Promise<Record<string, number>> {
  const res = await fetch(FIFA_RANKING_URL, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fifa ranking ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as RawRanking;
  const out: Record<string, number> = {};
  for (const r of json.Results ?? []) {
    if (r.IdCountry && Number.isInteger(r.Rank)) {
      out[r.IdCountry] = r.Rank as number;
    }
  }
  if (Object.keys(out).length === 0) {
    throw new Error("fifa ranking: empty results");
  }
  return out;
}
