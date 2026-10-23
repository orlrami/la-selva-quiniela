import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { knockoutLockMs } from "@/lib/predictions/locks";
import { computeGroupStandings, type StandingMatch, type TeamMeta } from "@/lib/standings/group-standings";

export interface PredictionTeam {
  id: string;
  code: string;
  name: string;
  shortName: string;
  flagEmoji: string | null;
  fifaRank: number | null;
}

export interface PredictionBoardMatch {
  id: string;
  matchNumber: number;
  groupCode: string;
  kickoffAt: string;
  lockAt: string;
  venue: string;
  city: string;
  homeTeam: PredictionTeam;
  awayTeam: PredictionTeam;
  isLocked: boolean;
  prediction: {
    homeScore: number | null;
    awayScore: number | null;
    correctOutcome: boolean;
    exactScore: boolean;
    points: number;
  } | null;
  finalScore: {
    homeScore: number;
    awayScore: number;
  } | null;
}

export interface TeamStandingRow {
  team: PredictionTeam;
  position: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface PredictionBoardGroup {
  code: string;
  matches: PredictionBoardMatch[];
  completed: number;
  total: number;
  teamStandings: TeamStandingRow[];
  /** Real final order (teamIds, FIFA tiebreakers) once the group is fully played; else null. */
  actualOrder: string[] | null;
}

export interface PredictionBoardData {
  quiniela: { id: string; name: string };
  groups: PredictionBoardGroup[];
  totals: { completed: number; total: number };
  lastGroupKickoff: string;
}

export type KnockoutStage =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL";

export interface KnockoutMatch {
  id: string;
  matchNumber: number;
  stage: KnockoutStage;
  bracketSlot: string;
  kickoffAt: string;
  lockAt: string;
  isLocked: boolean;
  homeTeam: PredictionTeam | null;
  awayTeam: PredictionTeam | null;
  pickedWinnerTeamId: string | null;
  prediction: {
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  finalScore: { homeScore: number; awayScore: number } | null;
  winnerTeamId: string | null;
  decidedByPenalties: boolean;
}

export interface KnockoutRound {
  stage: KnockoutStage;
  label: string;
  matches: KnockoutMatch[];
  completed: number;
  total: number;
}

export interface KnockoutBoardData {
  quiniela: { id: string; name: string };
  rounds: KnockoutRound[];
  totals: { completed: number; total: number };
}

const KNOCKOUT_STAGE_ORDER: KnockoutStage[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

const KNOCKOUT_STAGE_LABEL: Record<KnockoutStage, string> = {
  ROUND_OF_32: "Octavos (32)",
  ROUND_OF_16: "Octavos de Final",
  QUARTER_FINAL: "Cuartos de Final",
  SEMI_FINAL: "Semifinales",
  THIRD_PLACE: "Tercer Lugar",
  FINAL: "Final",
};

export const getKnockoutBoard = cache(
  async (userId: string): Promise<KnockoutBoardData | null> => {
    const membership = await prisma.quinielaMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: { quiniela: { select: { id: true, name: true } } },
    });
    if (!membership) return null;
    const quiniela = membership.quiniela;

    const [matches, predictions] = await Promise.all([
      prisma.match.findMany({
        where: { stage: { not: "GROUP" } },
        orderBy: [{ stage: "asc" }, { matchNumber: "asc" }],
        select: {
          id: true,
          matchNumber: true,
          stage: true,
          bracketSlot: true,
          kickoffAt: true,
          lockAt: true,
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          advancerTeamId: true,
          decidedByPenalties: true,
          homeTeam: {
            select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true },
          },
          awayTeam: {
            select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true },
          },
        },
      }),
      prisma.prediction.findMany({
        where: {
          userId,
          quinielaId: quiniela.id,
          match: { stage: { not: "GROUP" } },
        },
        select: { matchId: true, homeScore: true, awayScore: true, pickedWinnerTeamId: true },
      }),
    ]);

    const predByMatch = new Map(
      predictions.map((p) => [p.matchId, p]),
    );
    const now = Date.now();
    const roundMap = new Map<KnockoutStage, KnockoutMatch[]>();
    for (const stage of KNOCKOUT_STAGE_ORDER) roundMap.set(stage, []);

    for (const m of matches) {
      const stage = m.stage as KnockoutStage;
      if (!roundMap.has(stage)) continue;
      // Every knockout match locks 30 min before its own kickoff (knockoutLockMs).
      const lockAtMs = knockoutLockMs(m.stage, m.kickoffAt.getTime());
      const isLocked = now >= lockAtMs;
      const winnerTeamId =
        m.advancerTeamId ??
        (m.homeScore !== null && m.awayScore !== null && m.homeScore !== m.awayScore
          ? m.homeScore > m.awayScore
            ? m.homeTeamId
            : m.awayTeamId
          : null);
      const finalScore =
        m.homeScore !== null && m.awayScore !== null
          ? { homeScore: m.homeScore, awayScore: m.awayScore }
          : null;
      const pred = predByMatch.get(m.id);
      roundMap.get(stage)!.push({
        id: m.id,
        matchNumber: m.matchNumber,
        stage,
        bracketSlot: m.bracketSlot ?? "",
        kickoffAt: m.kickoffAt.toISOString(),
        lockAt: new Date(lockAtMs).toISOString(),
        isLocked,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        pickedWinnerTeamId: pred?.pickedWinnerTeamId ?? null,
        prediction:
          pred && (pred.homeScore !== null || pred.awayScore !== null)
            ? { homeScore: pred.homeScore, awayScore: pred.awayScore }
            : null,
        finalScore,
        winnerTeamId,
        decidedByPenalties: m.decidedByPenalties,
      });
    }

    const rounds: KnockoutRound[] = KNOCKOUT_STAGE_ORDER.map((stage) => {
      const matches = roundMap.get(stage) ?? [];
      return {
        stage,
        label: KNOCKOUT_STAGE_LABEL[stage],
        matches,
        total: matches.length,
        completed: matches.filter(
          (m) => m.pickedWinnerTeamId !== null && m.prediction !== null,
        ).length,
      };
    });

    const totals = rounds.reduce(
      (acc, r) => ({
        completed: acc.completed + r.completed,
        total: acc.total + r.total,
      }),
      { completed: 0, total: 0 },
    );

    return { quiniela, rounds, totals };
  },
);

export const getPredictionsBoard = cache(
  async (userId: string): Promise<PredictionBoardData | null> => {
    const membership = await prisma.quinielaMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: {
        quiniela: { select: { id: true, name: true } },
      },
    });
    if (!membership) return null;
    const quiniela = membership.quiniela;

    const [matches, predictions] = await Promise.all([
      prisma.match.findMany({
        where: { stage: "GROUP" },
        orderBy: [{ groupCode: "asc" }, { kickoffAt: "asc" }],
        select: {
          id: true,
          matchNumber: true,
          groupCode: true,
          kickoffAt: true,
          lockAt: true,
          venue: true,
          city: true,
          homeScore: true,
          awayScore: true,
          homeTeam: {
            select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true },
          },
          awayTeam: {
            select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true },
          },
        },
      }),
      prisma.prediction.findMany({
        where: { userId, quinielaId: quiniela.id },
        select: {
          matchId: true,
          homeScore: true,
          awayScore: true,
          correctOutcome: true,
          exactScore: true,
          points: true,
        },
      }),
    ]);

    const predictionByMatch = new Map(
      predictions.map((p) => [
        p.matchId,
        {
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          correctOutcome: p.correctOutcome,
          exactScore: p.exactScore,
          points: p.points,
        },
      ]),
    );

    // Group stage closes 30 min before the first match (Mexico vs South Africa).
    // Every group card counts down to this single shared deadline.
    const GROUP_LOCK_LEAD_MS = 30 * 60 * 1000;
    const now = Date.now();
    let firstGroupKickoff = Infinity;
    for (const m of matches) {
      const t = m.kickoffAt.getTime();
      if (t < firstGroupKickoff) firstGroupKickoff = t;
    }
    const groupDeadlineMs = firstGroupKickoff - GROUP_LOCK_LEAD_MS;
    const groupDeadlineIso = Number.isFinite(groupDeadlineMs)
      ? new Date(groupDeadlineMs).toISOString()
      : new Date().toISOString();
    const groupsLocked = now >= groupDeadlineMs;

    const groupMap = new Map<string, PredictionBoardMatch[]>();

    for (const match of matches) {
      const code = match.groupCode ?? "?";
      if (!groupMap.has(code)) groupMap.set(code, []);
      const isLocked = groupsLocked;
      const prediction = predictionByMatch.get(match.id) ?? null;
      const finalScore =
        match.homeScore !== null && match.awayScore !== null
          ? { homeScore: match.homeScore, awayScore: match.awayScore }
          : null;
      // Group-stage matches always have teams (seeded that way); skip any
      // stray row where they're absent so the type stays non-null.
      if (!match.homeTeam || !match.awayTeam) continue;
      groupMap.get(code)!.push({
        id: match.id,
        matchNumber: match.matchNumber,
        groupCode: code,
        kickoffAt: match.kickoffAt.toISOString(),
        lockAt: groupDeadlineIso,
        venue: match.venue,
        city: match.city,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        isLocked,
        prediction,
        finalScore,
      });
    }

    function buildTeamStandings(groupMatches: PredictionBoardMatch[]): TeamStandingRow[] {
      const stats = new Map<string, TeamStandingRow>();
      const metas = new Map<string, TeamMeta>();
      const standingMatches: StandingMatch[] = [];
      for (const m of groupMatches) {
        if (!stats.has(m.homeTeam.id)) {
          stats.set(m.homeTeam.id, { team: m.homeTeam, position: 0, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
          metas.set(m.homeTeam.id, { id: m.homeTeam.id, name: m.homeTeam.name, fifaRank: m.homeTeam.fifaRank });
        }
        if (!stats.has(m.awayTeam.id)) {
          stats.set(m.awayTeam.id, { team: m.awayTeam, position: 0, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
          metas.set(m.awayTeam.id, { id: m.awayTeam.id, name: m.awayTeam.name, fifaRank: m.awayTeam.fifaRank });
        }
        // Predicted standings reflect the user's PREDICTION only (not the official
        // result), consistent with the rendered client table ("según tus pronósticos").
        const score =
          m.prediction && m.prediction.homeScore !== null && m.prediction.awayScore !== null
            ? { homeScore: m.prediction.homeScore, awayScore: m.prediction.awayScore }
            : null;
        if (!score) continue;
        standingMatches.push({ homeTeamId: m.homeTeam.id, awayTeamId: m.awayTeam.id, homeScore: score.homeScore, awayScore: score.awayScore });
        const home = stats.get(m.homeTeam.id)!;
        const away = stats.get(m.awayTeam.id)!;
        home.mp++; away.mp++;
        home.gf += score.homeScore; home.ga += score.awayScore;
        away.gf += score.awayScore; away.ga += score.homeScore;
        if (score.homeScore > score.awayScore) {
          home.w++; away.l++; home.pts += 3;
        } else if (score.homeScore < score.awayScore) {
          away.w++; home.l++; away.pts += 3;
        } else {
          home.d++; away.d++; home.pts += 1; away.pts += 1;
        }
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
      }
      // Order via the shared FIFA 2026 engine (head-to-head before overall GD).
      const orderIndex = new Map(
        computeGroupStandings(standingMatches, Array.from(metas.values())).map((r, i) => [r.teamId, i] as const),
      );
      const rows = Array.from(stats.values()).sort(
        (a, b) => (orderIndex.get(a.team.id) ?? 0) - (orderIndex.get(b.team.id) ?? 0),
      );
      rows.forEach((r, i) => { r.position = i + 1; });
      return rows;
    }

    // Real final order (FIFA tiebreakers) once every group match is played.
    function actualOrderFor(groupMatches: PredictionBoardMatch[]): string[] | null {
      if (groupMatches.length === 0 || !groupMatches.every((m) => m.finalScore !== null)) return null;
      const sm: StandingMatch[] = groupMatches.map((m) => ({
        homeTeamId: m.homeTeam.id,
        awayTeamId: m.awayTeam.id,
        homeScore: m.finalScore!.homeScore,
        awayScore: m.finalScore!.awayScore,
      }));
      const metas = new Map<string, TeamMeta>();
      for (const m of groupMatches) {
        for (const t of [m.homeTeam, m.awayTeam]) {
          if (!metas.has(t.id)) metas.set(t.id, { id: t.id, name: t.name, fifaRank: t.fifaRank });
        }
      }
      return computeGroupStandings(sm, Array.from(metas.values())).map((r) => r.teamId);
    }

    const groups: PredictionBoardGroup[] = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([code, groupMatches]) => ({
        code,
        matches: groupMatches,
        total: groupMatches.length,
        completed: groupMatches.filter((m) => m.prediction !== null).length,
        teamStandings: buildTeamStandings(groupMatches),
        actualOrder: actualOrderFor(groupMatches),
      }));

    const totals = groups.reduce(
      (acc, g) => ({
        completed: acc.completed + g.completed,
        total: acc.total + g.total,
      }),
      { completed: 0, total: 0 },
    );

    const lastGroupMatch = matches.at(-1);
    const lastGroupKickoff = lastGroupMatch
      ? lastGroupMatch.kickoffAt.toISOString()
      : new Date("2026-06-27T23:00:00Z").toISOString();

    return {
      quiniela: { id: quiniela.id, name: quiniela.name },
      groups,
      totals,
      lastGroupKickoff,
    };
  },
);
