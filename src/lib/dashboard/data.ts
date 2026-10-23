import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export interface DashboardQuiniela {
  id: string;
  name: string;
  slug: string;
  isLocked: boolean;
}

export interface DashboardUserStats {
  points: number;
  rank: number;
  completedPredictions: number;
  totalPredictions: number;
  missingPredictions: number;
  correctOutcomes: number;
  exactScores: number;
}

export interface DashboardNextMatch {
  id: string;
  matchNumber: number;
  groupCode: string | null;
  kickoffAt: string;
  lockAt: string;
  venue: string;
  city: string;
  homeTeam: { code: string; name: string; shortName: string; flagEmoji: string | null };
  awayTeam: { code: string; name: string; shortName: string; flagEmoji: string | null };
}

export interface DashboardLeaderboardRow {
  userId: string;
  rank: number;
  displayName: string;
  avatarName: string;
  avatarColor: string;
  points: number;
  completedPredictions: number;
  correctOutcomes: number;
  exactScores: number;
  isCurrentUser: boolean;
}

export interface DashboardTeamMini {
  code: string;
  name: string;
  shortName: string;
  flagEmoji: string | null;
}

export interface DashboardRecentResult {
  id: string;
  matchNumber: number;
  groupCode: string | null;
  kickoffAt: string;
  homeTeam: DashboardTeamMini;
  awayTeam: DashboardTeamMini;
  finalScore: { homeScore: number; awayScore: number };
  prediction: {
    homeScore: number;
    awayScore: number;
    correctOutcome: boolean;
    exactScore: boolean;
    points: number;
  } | null;
}

export interface DashboardForm {
  streak: number;
  bestPoints: number;
  bestMatchLabel: string | null;
  exactScores: number;
}

export interface DashboardData {
  quiniela: DashboardQuiniela;
  totalMembers: number;
  user: DashboardUserStats;
  nextMatch: DashboardNextMatch | null;
  leaderboard: DashboardLeaderboardRow[];
  tournamentStartAt: string | null;
  recentResults: DashboardRecentResult[];
  form: DashboardForm;
}

const LEADERBOARD_LIMIT = 5;

export const getDashboardData = cache(
  async (userId: string): Promise<DashboardData | null> => {
    const membership = await prisma.quinielaMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: {
        quiniela: {
          select: { id: true, name: true, slug: true, isLocked: true },
        },
      },
    });
    if (!membership) return null;

    const quiniela = membership.quiniela;

    const [
      members,
      pointsByUser,
      correctByUser,
      exactByUser,
      totalMatches,
      nextMatch,
      gradedMatches,
      firstMatch,
    ] =
      await Promise.all([
        prisma.quinielaMember.findMany({
          where: { quinielaId: quiniela.id, user: { role: "MEMBER" } },
          select: {
            userId: true,
            nickname: true,
            user: {
              select: {
                name: true,
                avatarColor: true,
              },
            },
          },
        }),
        prisma.prediction.groupBy({
          by: ["userId"],
          where: { quinielaId: quiniela.id },
          _sum: { points: true },
          _count: { _all: true },
        }),
        prisma.prediction.groupBy({
          by: ["userId"],
          // outcome-only (not exact) so exactos×5 + correctos×2 reconciles; group only.
          where: {
            quinielaId: quiniela.id,
            correctOutcome: true,
            exactScore: false,
            match: { stage: "GROUP" },
          },
          _count: { _all: true },
        }),
        prisma.prediction.groupBy({
          by: ["userId"],
          where: { quinielaId: quiniela.id, exactScore: true, match: { stage: "GROUP" } },
          _count: { _all: true },
        }),
        prisma.match.count({ where: { stage: "GROUP" } }),
        prisma.match.findFirst({
          where: { lockAt: { gt: new Date() } },
          orderBy: { lockAt: "asc" },
          select: {
            id: true,
            matchNumber: true,
            groupCode: true,
            kickoffAt: true,
            lockAt: true,
            venue: true,
            city: true,
            homeTeam: {
              select: { code: true, name: true, shortName: true, flagEmoji: true },
            },
            awayTeam: {
              select: { code: true, name: true, shortName: true, flagEmoji: true },
            },
          },
        }),
        prisma.match.findMany({
          where: {
            stage: "GROUP",
            homeScore: { not: null },
            awayScore: { not: null },
          },
          orderBy: { kickoffAt: "desc" },
          take: 40,
          select: {
            id: true,
            matchNumber: true,
            groupCode: true,
            kickoffAt: true,
            homeScore: true,
            awayScore: true,
            homeTeam: {
              select: { code: true, name: true, shortName: true, flagEmoji: true },
            },
            awayTeam: {
              select: { code: true, name: true, shortName: true, flagEmoji: true },
            },
            predictions: {
              where: { userId, quinielaId: quiniela.id },
              select: {
                homeScore: true,
                awayScore: true,
                correctOutcome: true,
                exactScore: true,
                points: true,
              },
            },
          },
        }),
        prisma.match.findFirst({
          orderBy: { kickoffAt: "asc" },
          select: { kickoffAt: true },
        }),
      ]);

    const pointsMap = new Map(
      pointsByUser.map((row) => [
        row.userId,
        { points: row._sum.points ?? 0, completed: row._count._all },
      ]),
    );
    const correctMap = new Map(
      correctByUser.map((row) => [row.userId, row._count._all]),
    );
    const exactMap = new Map(
      exactByUser.map((row) => [row.userId, row._count._all]),
    );
    interface MemberAggregate {
      userId: string;
      avatarName: string;
      displayName: string;
      avatarColor: string;
      points: number;
      completedPredictions: number;
      correctOutcomes: number;
      exactScores: number;
    }

    const aggregates: MemberAggregate[] = members.map((member) => {
      const display = member.nickname ?? member.user.name;
      const stats = pointsMap.get(member.userId);
      return {
        userId: member.userId,
        avatarName: display,
        displayName: display,
        avatarColor: member.user.avatarColor,
        points: stats?.points ?? 0,
        completedPredictions: stats?.completed ?? 0,
        correctOutcomes: correctMap.get(member.userId) ?? 0,
        exactScores: exactMap.get(member.userId) ?? 0,
      };
    });

    aggregates.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      if (b.correctOutcomes !== a.correctOutcomes)
        return b.correctOutcomes - a.correctOutcomes;
      return a.displayName.localeCompare(b.displayName, "es");
    });

    let currentRank = 0;
    let previousPoints = Number.POSITIVE_INFINITY;
    const ranked: DashboardLeaderboardRow[] = aggregates.map((member, index) => {
      if (member.points < previousPoints) {
        currentRank = index + 1;
        previousPoints = member.points;
      }
      return {
        userId: member.userId,
        rank: currentRank,
        displayName: member.displayName,
        avatarName: member.avatarName,
        avatarColor: member.avatarColor,
        points: member.points,
        completedPredictions: member.completedPredictions,
        correctOutcomes: member.correctOutcomes,
        exactScores: member.exactScores,
        isCurrentUser: member.userId === userId,
      };
    });

    const me = ranked.find((row) => row.userId === userId);
    if (!me) return null;

    // Recent results + form, ordered most-recent first.
    const gradedForUser = gradedMatches
      .filter((m) => m.homeTeam && m.awayTeam)
      .map((m) => {
        const p = m.predictions[0];
        const prediction =
          p && p.homeScore !== null && p.awayScore !== null
            ? {
                homeScore: p.homeScore,
                awayScore: p.awayScore,
                correctOutcome: p.correctOutcome,
                exactScore: p.exactScore,
                points: p.points,
              }
            : null;
        return { match: m, prediction };
      });

    let streak = 0;
    for (const g of gradedForUser) {
      if (g.prediction?.correctOutcome) streak++;
      else break;
    }

    let bestPoints = 0;
    let bestMatchLabel: string | null = null;
    for (const g of gradedForUser) {
      if (g.prediction && g.prediction.points > bestPoints) {
        bestPoints = g.prediction.points;
        bestMatchLabel = `${g.match.homeTeam!.shortName} ${g.match.homeScore}–${g.match.awayScore} ${g.match.awayTeam!.shortName}`;
      }
    }

    const recentResults: DashboardRecentResult[] = gradedForUser
      .slice(0, 4)
      .map(({ match: m, prediction }) => ({
        id: m.id,
        matchNumber: m.matchNumber,
        groupCode: m.groupCode,
        kickoffAt: m.kickoffAt.toISOString(),
        homeTeam: m.homeTeam!,
        awayTeam: m.awayTeam!,
        finalScore: { homeScore: m.homeScore!, awayScore: m.awayScore! },
        prediction,
      }));

    return {
      quiniela: {
        id: quiniela.id,
        name: quiniela.name,
        slug: quiniela.slug,
        isLocked: quiniela.isLocked,
      },
      totalMembers: members.length,
      user: {
        points: me.points,
        rank: me.rank,
        completedPredictions: me.completedPredictions,
        totalPredictions: totalMatches,
        missingPredictions: Math.max(totalMatches - me.completedPredictions, 0),
        correctOutcomes: me.correctOutcomes,
        exactScores: me.exactScores,
      },
      nextMatch: nextMatch && nextMatch.homeTeam && nextMatch.awayTeam
        ? {
            id: nextMatch.id,
            matchNumber: nextMatch.matchNumber,
            groupCode: nextMatch.groupCode,
            kickoffAt: nextMatch.kickoffAt.toISOString(),
            lockAt: nextMatch.lockAt.toISOString(),
            venue: nextMatch.venue,
            city: nextMatch.city,
            homeTeam: nextMatch.homeTeam,
            awayTeam: nextMatch.awayTeam,
          }
        : null,
      leaderboard: ranked.slice(0, LEADERBOARD_LIMIT),
      tournamentStartAt: firstMatch?.kickoffAt.toISOString() ?? null,
      recentResults,
      form: {
        streak,
        bestPoints,
        bestMatchLabel,
        exactScores: me.exactScores,
      },
    };
  },
);
