import "server-only";

import { prisma } from "@/lib/prisma";
import { setMatchResult } from "@/lib/admin/match-results";
import { fetchLiveFifaRanks } from "@/lib/teams/fifa-ranking";
import { FIFA_RANKS } from "@/lib/teams/fifa-ranks";

import { fetchScoreboard, espnDate, type EspnMatch } from "./espn";

export interface GradeResult {
  processed: number;
  graded: string[];
  skipped: string[];
  errors: string[];
}

// Poll yesterday/today/tomorrow (UTC). Covers matches that kick off late-UTC
// and any timezone edge without missing a finished game.
function pollDates(): string[] {
  const now = new Date();
  return [-1, 0, 1].map((offset) =>
    espnDate(new Date(now.getTime() + offset * 24 * 60 * 60 * 1000)),
  );
}

async function fetchMatchesForDates(dates: string[]): Promise<EspnMatch[]> {
  const all: EspnMatch[] = [];
  const seen = new Set<string>();
  for (const date of dates) {
    const matches = await fetchScoreboard(date);
    for (const m of matches) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      all.push(m);
    }
  }
  return all;
}

export async function autoGradeMatches(): Promise<GradeResult> {
  const result: GradeResult = { processed: 0, graded: [], skipped: [], errors: [] };

  const matches = await fetchMatchesForDates(pollDates());
  result.processed = matches.length;
  if (matches.length === 0) return result;

  const ungradedMatches = await prisma.match.findMany({
    where: { status: { not: "FINAL" } },
    select: {
      id: true,
      matchNumber: true,
      homeTeam: { select: { id: true, code: true } },
      awayTeam: { select: { id: true, code: true } },
    },
  });
  if (ungradedMatches.length === 0) return result;

  const matchIndex = new Map<string, (typeof ungradedMatches)[number]>();
  for (const m of ungradedMatches) {
    if (!m.homeTeam || !m.awayTeam) continue;
    matchIndex.set(`${m.homeTeam.code}:${m.awayTeam.code}`, m);
  }

  for (const fixture of matches) {
    if (!fixture.completed) continue;

    const dbMatch = matchIndex.get(`${fixture.homeCode}:${fixture.awayCode}`);
    if (!dbMatch) {
      // Already graded, or teams not yet resolved into that slot.
      continue;
    }

    try {
      const advancerTeamId =
        fixture.advancerCode === dbMatch.homeTeam?.code
          ? dbMatch.homeTeam?.id ?? null
          : fixture.advancerCode === dbMatch.awayTeam?.code
            ? dbMatch.awayTeam?.id ?? null
            : null;
      const outcome = await setMatchResult(
        dbMatch.id,
        fixture.homeScore,
        fixture.awayScore,
        advancerTeamId,
        fixture.decidedByPenalties,
      );
      if (outcome.ok) {
        result.graded.push(
          `#${dbMatch.matchNumber} ${fixture.homeCode} ${fixture.homeScore}-${fixture.awayScore} ${fixture.awayCode}`,
        );
      } else {
        result.errors.push(`#${dbMatch.matchNumber}: ${outcome.error}`);
      }
    } catch (err) {
      result.errors.push(
        `#${dbMatch.matchNumber}: ${err instanceof Error ? err.message : "error desconocido"}`,
      );
    }
  }

  return result;
}

/**
 * Refresh every team's stored FIFA rank from the live FIFA ranking, falling
 * back to the seeded FIFA_RANKS table if the live fetch fails. Only writes rows
 * whose rank actually changed. Returns the number of teams updated.
 */
export async function syncFifaRanks(): Promise<number> {
  let ranks: Record<string, number>;
  try {
    ranks = await fetchLiveFifaRanks();
  } catch {
    ranks = FIFA_RANKS;
  }

  const teams = await prisma.team.findMany({
    select: { id: true, code: true, fifaRank: true },
  });

  let updated = 0;
  for (const team of teams) {
    const next = ranks[team.code];
    if (next == null || next === team.fifaRank) continue;
    await prisma.team.update({
      where: { id: team.id },
      data: { fifaRank: next },
    });
    updated++;
  }
  return updated;
}

export async function updateLiveStatuses(): Promise<number> {
  const today = espnDate(new Date());
  const matches = await fetchScoreboard(today);
  let updated = 0;

  for (const fixture of matches) {
    if (!fixture.live) continue;
    const match = await prisma.match.findFirst({
      where: {
        homeTeam: { code: fixture.homeCode },
        awayTeam: { code: fixture.awayCode },
        status: "SCHEDULED",
      },
      select: { id: true },
    });
    if (match) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "LIVE" },
      });
      updated++;
    }
  }

  return updated;
}
