import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export interface AdminMember {
  userId: string;
  username: string;
  name: string;
  role: "MEMBER" | "ADMIN";
  membershipRole: "PLAYER" | "ADMIN";
  avatarColor: string;
  joinedAt: string;
}

export interface AdminInvite {
  id: string;
  token: string;
  maxUses: number;
  useCount: number;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  status: "active" | "expired" | "exhausted";
}

export interface AdminOverview {
  quiniela: { id: string; name: string };
  members: AdminMember[];
  invites: AdminInvite[];
  counts: {
    members: number;
    activeInvites: number;
    matchesScored: number;
    matchesPending: number;
    matchesTotal: number;
  };
}

function classifyInvite(
  invite: { expiresAt: Date; useCount: number; maxUses: number },
): AdminInvite["status"] {
  if (invite.expiresAt.getTime() <= Date.now()) return "expired";
  if (invite.useCount >= invite.maxUses) return "exhausted";
  return "active";
}

export const getAdminOverview = cache(
  async (): Promise<AdminOverview | null> => {
    const quiniela = await prisma.quiniela.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });
    if (!quiniela) return null;

    const [members, invites, matchesTotal, matchesScored] = await Promise.all([
      prisma.quinielaMember.findMany({
        where: { quinielaId: quiniela.id },
        orderBy: { joinedAt: "asc" },
        select: {
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
              avatarColor: true,
            },
          },
        },
      }),
      prisma.invite.findMany({
        where: { quinielaId: quiniela.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          token: true,
          maxUses: true,
          useCount: true,
          expiresAt: true,
          usedAt: true,
          createdAt: true,
        },
      }),
      prisma.match.count({ where: { stage: "GROUP" } }),
      prisma.match.count({
        where: {
          stage: "GROUP",
          homeScore: { not: null },
          awayScore: { not: null },
        },
      }),
    ]);

    const adminMembers: AdminMember[] = members.map((m) => ({
      userId: m.user.id,
      username: m.user.username,
      name: m.user.name,
      role: m.user.role,
      membershipRole: m.role,
      avatarColor: m.user.avatarColor,
      joinedAt: m.joinedAt.toISOString(),
    }));

    const adminInvites: AdminInvite[] = invites.map((i) => ({
      id: i.id,
      token: i.token,
      maxUses: i.maxUses,
      useCount: i.useCount,
      expiresAt: i.expiresAt.toISOString(),
      usedAt: i.usedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
      status: classifyInvite(i),
    }));

    return {
      quiniela,
      members: adminMembers,
      invites: adminInvites,
      counts: {
        members: members.length,
        activeInvites: adminInvites.filter((i) => i.status === "active").length,
        matchesScored,
        matchesPending: matchesTotal - matchesScored,
        matchesTotal,
      },
    };
  },
);

export interface AdminMatch {
  id: string;
  matchNumber: number;
  groupCode: string;
  kickoffAt: string;
  lockAt: string;
  venue: string;
  city: string;
  status: "SCHEDULED" | "LIVE" | "FINAL" | "POSTPONED" | "CANCELLED";
  homeTeam: { code: string; name: string; shortName: string; flagEmoji: string | null } | null;
  awayTeam: { code: string; name: string; shortName: string; flagEmoji: string | null } | null;
  result: { homeScore: number; awayScore: number } | null;
  predictionCount: number;
}

export interface AdminMatchesGroup {
  code: string;
  matches: AdminMatch[];
  scored: number;
  total: number;
}

export interface AdminMatchesData {
  quiniela: { id: string; name: string };
  groups: AdminMatchesGroup[];
  totals: { scored: number; total: number };
}

export const getAdminMatches = cache(async (): Promise<AdminMatchesData> => {
  const quiniela = await prisma.quiniela.findFirstOrThrow({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  const [matches, predictionCounts] = await Promise.all([
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
        status: true,
        homeScore: true,
        awayScore: true,
        homeTeam: {
          select: { code: true, name: true, shortName: true, flagEmoji: true },
        },
        awayTeam: {
          select: { code: true, name: true, shortName: true, flagEmoji: true },
        },
      },
    }),
    prisma.prediction.groupBy({
      by: ["matchId"],
      where: { quinielaId: quiniela.id },
      _count: { _all: true },
    }),
  ]);

  const predictionMap = new Map(
    predictionCounts.map((row) => [row.matchId, row._count._all]),
  );

  const groupMap = new Map<string, AdminMatch[]>();
  for (const match of matches) {
    const code = match.groupCode ?? "?";
    if (!groupMap.has(code)) groupMap.set(code, []);
    const result =
      match.homeScore !== null && match.awayScore !== null
        ? { homeScore: match.homeScore, awayScore: match.awayScore }
        : null;
    groupMap.get(code)!.push({
      id: match.id,
      matchNumber: match.matchNumber,
      groupCode: code,
      kickoffAt: match.kickoffAt.toISOString(),
      lockAt: match.lockAt.toISOString(),
      venue: match.venue,
      city: match.city,
      status: match.status,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      result,
      predictionCount: predictionMap.get(match.id) ?? 0,
    });
  }

  const groups: AdminMatchesGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([code, matches]) => ({
      code,
      matches,
      total: matches.length,
      scored: matches.filter((m) => m.result !== null).length,
    }));

  const totals = groups.reduce(
    (acc, g) => ({ scored: acc.scored + g.scored, total: acc.total + g.total }),
    { scored: 0, total: 0 },
  );

  return { quiniela, groups, totals };
});
