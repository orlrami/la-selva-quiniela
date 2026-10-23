import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export interface LeaderboardRow {
  userId: string;
  rank: number;
  displayName: string;
  avatarName: string;
  avatarColor: string;
  points: number;
  completedPredictions: number;
  missingPredictions: number;
  correctOutcomes: number;
  exactScores: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  quiniela: { id: string; name: string; isLocked: boolean };
  totalMembers: number;
  totalMatches: number;
  finalMatches: number;
  rows: LeaderboardRow[];
  me: LeaderboardRow | null;
}

export const getLeaderboard = cache(
  async (userId: string): Promise<LeaderboardData | null> => {
    const membership = await prisma.quinielaMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: {
        quiniela: { select: { id: true, name: true, isLocked: true } },
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
      finalMatches,
    ] = await Promise.all([
      prisma.quinielaMember.findMany({
        where: { quinielaId: quiniela.id, user: { role: "MEMBER" } },
        select: {
          userId: true,
          nickname: true,
          user: { select: { name: true, avatarColor: true } },
        },
      }),
      prisma.prediction.groupBy({
        by: ["userId"],
        where: { quinielaId: quiniela.id },
        _sum: { points: true },
        _count: { _all: true },
      }),
      // "correctos" = got the result right but NOT the exact score (mutually
      // exclusive from exactos). Scoped to GROUP — knockout uses its own scale.
      prisma.prediction.groupBy({
        by: ["userId"],
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
      prisma.match.count({
        where: { stage: "GROUP", homeScore: { not: null }, awayScore: { not: null } },
      }),
    ]);

    const pointsMap = new Map(
      pointsByUser.map((row) => [
        row.userId,
        { points: row._sum.points ?? 0, completed: row._count._all },
      ]),
    );
    const correctMap = new Map(correctByUser.map((row) => [row.userId, row._count._all]));
    const exactMap = new Map(exactByUser.map((row) => [row.userId, row._count._all]));

    interface Aggregate {
      userId: string;
      displayName: string;
      avatarName: string;
      avatarColor: string;
      points: number;
      completedPredictions: number;
      correctOutcomes: number;
      exactScores: number;
    }

    const aggregates: Aggregate[] = members.map((member) => {
      const display = member.nickname ?? member.user.name;
      const stats = pointsMap.get(member.userId);
      return {
        userId: member.userId,
        displayName: display,
        avatarName: display,
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
      if (b.correctOutcomes !== a.correctOutcomes) return b.correctOutcomes - a.correctOutcomes;
      return a.displayName.localeCompare(b.displayName, "es");
    });

    let currentRank = 0;
    let previousPoints = Number.POSITIVE_INFINITY;
    const rows: LeaderboardRow[] = aggregates.map((member, index) => {
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
        missingPredictions: Math.max(totalMatches - member.completedPredictions, 0),
        correctOutcomes: member.correctOutcomes,
        exactScores: member.exactScores,
        isCurrentUser: member.userId === userId,
      };
    });

    const me = rows.find((row) => row.isCurrentUser) ?? null;

    return {
      quiniela,
      totalMembers: members.length,
      totalMatches,
      finalMatches,
      rows,
      me,
    };
  },
);
