import "server-only";

import { prisma } from "@/lib/prisma";
import type { PredictionTeam } from "@/lib/predictions/data";
import { knockoutLockMs } from "@/lib/predictions/locks";

// Display-only: matches excluded from scoring by an admin fairness decision are
// tagged "No cuenta" in this view. This does NOT change any scoring logic — the
// points for these matches are zeroed directly in the data. Keep in sync with
// any manual exclusions applied to production.
const EXCLUDED_MATCH_NUMBERS = new Set<number>([
  73, // R32-1 Sudáfrica–Canadá (rushed first KO game)
  89, // R16-1 Canadá–Marruecos (lock bug: stored kickoff was 4 h late, editable during the game)
]);

// Members hidden from the public "Pronósticos de todos" reveal. The admin account
// is excluded by role (consistent with the leaderboard); these extra/duplicate
// accounts are excluded by username. They still exist — just not shown in this view.
const HIDDEN_REVEAL_USERNAME_KEYS = ["rrryyeoshen"];

// Reusable filter: only real members, minus the hidden accounts above.
const REVEAL_USER_FILTER = {
  role: "MEMBER",
  usernameKey: { notIn: HIDDEN_REVEAL_USERNAME_KEYS },
} as const;

export interface AllPredEntry {
  userId: string;
  name: string;
  avatarColor: string;
  homeScore: number | null;
  awayScore: number | null;
  points: number;
  correctOutcome: boolean;
  exactScore: boolean;
}

export interface AllPredMatch {
  id: string;
  matchNumber: number;
  groupCode: string;
  // Tournament matchday within the group stage (1, 2 or 3).
  jornada: number;
  kickoffAt: string;
  status: string;
  homeTeam: PredictionTeam;
  awayTeam: PredictionTeam;
  finalScore: { homeScore: number; awayScore: number } | null;
  isLocked: boolean;
  totalPicks: number;
  // % of revealed picks that went home win / draw / away win
  outcomeSplit: { home: number; draw: number; away: number };
  // most common predicted scorelines, e.g. "2-0"
  topScores: { line: string; count: number }[];
  entries: AllPredEntry[];
}

export interface AllPredGroup {
  code: string;
  matches: AllPredMatch[];
}

// One member's knockout pick (or absence of one). `hasPrediction` is shown even
// before a match locks so people can see who still needs to fill it in; the
// actual scoreline is only revealed once the match locks (anti-copy).
export interface AllPredKnockoutEntry {
  userId: string;
  name: string;
  avatarColor: string;
  hasPrediction: boolean;
  homeScore: number | null;
  awayScore: number | null;
  pickedWinnerTeamId: string | null;
  points: number;
  exactScore: boolean;
  correctWinner: boolean;
}

export interface AllPredKnockoutMatch {
  id: string;
  matchNumber: number;
  stage: string;
  bracketSlot: string;
  kickoffAt: string;
  status: string;
  isLocked: boolean;
  // Excluded from scoring by admin decision (display tag only).
  excluded: boolean;
  homeTeam: PredictionTeam | null;
  awayTeam: PredictionTeam | null;
  finalScore: { homeScore: number; awayScore: number } | null;
  decidedByPenalties: boolean;
  advancerTeamId: string | null;
  totalPicks: number;
  totalMembers: number;
  outcomeSplit: { home: number; draw: number; away: number };
  // % of those who picked who backed each side to advance.
  advanceSplit: { home: number; away: number };
  topScores: { line: string; count: number }[];
  // Every member (predictors + those with "Sin pronóstico").
  entries: AllPredKnockoutEntry[];
}

export interface AllPredKnockoutRound {
  stage: string;
  label: string;
  matches: AllPredKnockoutMatch[];
}

export interface AllPredictionsData {
  quiniela: { id: string; name: string };
  memberCount: number;
  groups: AllPredGroup[];
  // All group matches in chronological (kickoff) order, ungrouped.
  orderedMatches: AllPredMatch[];
  knockoutRounds: AllPredKnockoutRound[];
  lockedCount: number;
}

const KNOCKOUT_STAGE_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

const KNOCKOUT_STAGE_LABEL: Record<string, string> = {
  ROUND_OF_32: "Octavos (32)",
  ROUND_OF_16: "Octavos",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semis",
  THIRD_PLACE: "3.er lugar",
  FINAL: "Final",
};

const GROUP_LOCK_LEAD_MS = 30 * 60 * 1000;

export async function getAllPredictions(): Promise<AllPredictionsData | null> {
  const quiniela = await prisma.quiniela.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!quiniela) return null;

  const teamSelect = {
    select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true },
  } as const;

  const [members, matches, predictions, koMatches, koPredictions] = await Promise.all([
    prisma.quinielaMember.findMany({
      where: { quinielaId: quiniela.id, user: REVEAL_USER_FILTER },
      select: { user: { select: { id: true, name: true, avatarColor: true } } },
    }),
    prisma.match.findMany({
      where: { stage: "GROUP" },
      orderBy: [{ groupCode: "asc" }, { kickoffAt: "asc" }],
      select: {
        id: true,
        matchNumber: true,
        groupCode: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homeTeam: teamSelect,
        awayTeam: teamSelect,
      },
    }),
    prisma.prediction.findMany({
      where: { quinielaId: quiniela.id, match: { stage: "GROUP" }, user: REVEAL_USER_FILTER },
      select: {
        matchId: true,
        userId: true,
        homeScore: true,
        awayScore: true,
        points: true,
        correctOutcome: true,
        exactScore: true,
        user: { select: { name: true, avatarColor: true } },
      },
    }),
    prisma.match.findMany({
      where: { stage: { not: "GROUP" } },
      orderBy: [{ stage: "asc" }, { matchNumber: "asc" }],
      select: {
        id: true,
        matchNumber: true,
        stage: true,
        bracketSlot: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
        advancerTeamId: true,
        decidedByPenalties: true,
        homeTeam: teamSelect,
        awayTeam: teamSelect,
      },
    }),
    prisma.prediction.findMany({
      where: { quinielaId: quiniela.id, match: { stage: { not: "GROUP" } }, user: REVEAL_USER_FILTER },
      select: {
        matchId: true,
        userId: true,
        homeScore: true,
        awayScore: true,
        pickedWinnerTeamId: true,
        points: true,
        exactScore: true,
        correctWinner: true,
      },
    }),
  ]);

  // Group stage shares one deadline: 30 min before the first kickoff.
  const now = Date.now();
  let firstKickoff = Infinity;
  for (const m of matches) {
    const t = m.kickoffAt.getTime();
    if (t < firstKickoff) firstKickoff = t;
  }
  const groupsLocked = now >= firstKickoff - GROUP_LOCK_LEAD_MS;

  const byMatch = new Map<string, AllPredEntry[]>();
  for (const p of predictions) {
    if (p.homeScore === null || p.awayScore === null) continue;
    const list = byMatch.get(p.matchId) ?? [];
    list.push({
      userId: p.userId,
      name: p.user.name,
      avatarColor: p.user.avatarColor,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      points: p.points,
      correctOutcome: p.correctOutcome,
      exactScore: p.exactScore,
    });
    byMatch.set(p.matchId, list);
  }

  const groupMap = new Map<string, AllPredMatch[]>();
  // matches arrive ordered by groupCode then kickoff, so the Nth match of a
  // group maps to matchday floor(N/2)+1 (6 matches per group, 2 per jornada).
  const groupSeen = new Map<string, number>();
  for (const m of matches) {
    if (!m.homeTeam || !m.awayTeam) continue;
    const code = m.groupCode ?? "?";
    const seen = groupSeen.get(code) ?? 0;
    const jornada = Math.floor(seen / 2) + 1;
    groupSeen.set(code, seen + 1);
    const rawEntries = (byMatch.get(m.id) ?? []).sort(
      (a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"),
    );
    const isLocked = groupsLocked;
    const entries = isLocked ? rawEntries : [];

    let home = 0;
    let draw = 0;
    let away = 0;
    const scoreCounts = new Map<string, number>();
    for (const e of rawEntries) {
      if (e.homeScore! > e.awayScore!) home++;
      else if (e.homeScore! < e.awayScore!) away++;
      else draw++;
      const line = `${e.homeScore}-${e.awayScore}`;
      scoreCounts.set(line, (scoreCounts.get(line) ?? 0) + 1);
    }
    const total = rawEntries.length || 1;
    const topScores = Array.from(scoreCounts.entries())
      .map(([line, count]) => ({ line, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const finalScore =
      m.homeScore !== null && m.awayScore !== null
        ? { homeScore: m.homeScore, awayScore: m.awayScore }
        : null;

    const item: AllPredMatch = {
      id: m.id,
      matchNumber: m.matchNumber,
      groupCode: code,
      jornada,
      kickoffAt: m.kickoffAt.toISOString(),
      status: m.status,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      finalScore,
      isLocked,
      totalPicks: rawEntries.length,
      outcomeSplit: {
        home: Math.round((home / total) * 100),
        draw: Math.round((draw / total) * 100),
        away: Math.round((away / total) * 100),
      },
      topScores,
      entries,
    };
    const arr = groupMap.get(code) ?? [];
    arr.push(item);
    groupMap.set(code, arr);
  }

  const groups: AllPredGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([code, ms]) => ({ code, matches: ms }));

  const orderedMatches = groups
    .flatMap((g) => g.matches)
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime() ||
        a.matchNumber - b.matchNumber,
    );

  const lockedCount = orderedMatches.filter((m) => m.isLocked).length;

  // ---- Knockout rounds (everyone's picks; reveal scorelines after lock) ----
  const roster = members.map((m) => m.user);
  const koPredByMatchUser = new Map<string, (typeof koPredictions)[number]>();
  for (const p of koPredictions) koPredByMatchUser.set(`${p.matchId}:${p.userId}`, p);

  const koByStage = new Map<string, AllPredKnockoutMatch[]>();
  for (const m of koMatches) {
    const resolved = !!(m.homeTeam && m.awayTeam);
    const isLocked = now >= knockoutLockMs(m.stage, m.kickoffAt.getTime());
    // Reveal individual scorelines only once the match locks (anti-copy), same
    // rule as the group stage.
    const reveal = isLocked;

    const rawEntries = resolved
      ? roster
          .map((u) => ({ u, p: koPredByMatchUser.get(`${m.id}:${u.id}`) }))
          .filter((x) => x.p && x.p.homeScore !== null && x.p.awayScore !== null)
      : [];

    let home = 0;
    let draw = 0;
    let away = 0;
    let advHome = 0;
    let advAway = 0;
    const scoreCounts = new Map<string, number>();
    for (const { p } of rawEntries) {
      if (p!.homeScore! > p!.awayScore!) home++;
      else if (p!.homeScore! < p!.awayScore!) away++;
      else draw++;
      if (p!.pickedWinnerTeamId && p!.pickedWinnerTeamId === m.homeTeam?.id) advHome++;
      else if (p!.pickedWinnerTeamId && p!.pickedWinnerTeamId === m.awayTeam?.id) advAway++;
      const line = `${p!.homeScore}-${p!.awayScore}`;
      scoreCounts.set(line, (scoreCounts.get(line) ?? 0) + 1);
    }
    const totalPicks = rawEntries.length;
    const pct = (n: number) => (totalPicks ? Math.round((n / totalPicks) * 100) : 0);
    const advTotal = advHome + advAway || 1;
    const topScores = Array.from(scoreCounts.entries())
      .map(([line, count]) => ({ line, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const entries: AllPredKnockoutEntry[] = resolved
      ? roster
          .map((u) => {
            const p = koPredByMatchUser.get(`${m.id}:${u.id}`);
            const has = !!(p && p.homeScore !== null && p.awayScore !== null);
            return {
              userId: u.id,
              name: u.name,
              avatarColor: u.avatarColor,
              hasPrediction: has,
              homeScore: has && reveal ? p!.homeScore : null,
              awayScore: has && reveal ? p!.awayScore : null,
              pickedWinnerTeamId: has && reveal ? p!.pickedWinnerTeamId : null,
              points: reveal ? (p?.points ?? 0) : 0,
              exactScore: reveal ? (p?.exactScore ?? false) : false,
              correctWinner: reveal ? (p?.correctWinner ?? false) : false,
            };
          })
          .sort(
            (a, b) =>
              Number(b.hasPrediction) - Number(a.hasPrediction) ||
              b.points - a.points ||
              a.name.localeCompare(b.name, "es"),
          )
      : [];

    const item: AllPredKnockoutMatch = {
      id: m.id,
      matchNumber: m.matchNumber,
      stage: m.stage,
      bracketSlot: m.bracketSlot ?? "",
      kickoffAt: m.kickoffAt.toISOString(),
      status: m.status,
      isLocked,
      excluded: EXCLUDED_MATCH_NUMBERS.has(m.matchNumber),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      finalScore:
        m.homeScore !== null && m.awayScore !== null
          ? { homeScore: m.homeScore, awayScore: m.awayScore }
          : null,
      decidedByPenalties: m.decidedByPenalties,
      advancerTeamId: m.advancerTeamId,
      totalPicks,
      totalMembers: roster.length,
      outcomeSplit: { home: pct(home), draw: pct(draw), away: pct(away) },
      advanceSplit: { home: Math.round((advHome / advTotal) * 100), away: Math.round((advAway / advTotal) * 100) },
      topScores,
      entries,
    };
    const arr = koByStage.get(m.stage) ?? [];
    arr.push(item);
    koByStage.set(m.stage, arr);
  }

  const knockoutRounds: AllPredKnockoutRound[] = KNOCKOUT_STAGE_ORDER.filter((s) =>
    koByStage.has(s),
  ).map((stage) => ({
    stage,
    label: KNOCKOUT_STAGE_LABEL[stage] ?? stage,
    matches: koByStage.get(stage)!,
  }));

  return {
    quiniela,
    memberCount: members.length,
    groups,
    orderedMatches,
    knockoutRounds,
    lockedCount,
  };
}
