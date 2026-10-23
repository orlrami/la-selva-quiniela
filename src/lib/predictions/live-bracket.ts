import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { computeGroupClinch, type GroupClinch } from "@/lib/standings/clinch";
import { type StandingMatch, type TeamMeta } from "@/lib/standings/group-standings";
import { R32_SLOTS, slotLabel, type SlotRef } from "@/lib/standings/r32-mapping";

export interface BracketTeamLite {
  id: string;
  code: string;
  name: string;
  shortName: string;
  flagEmoji: string | null;
}

export interface LiveSlot {
  label: string; // "Ganador A" / "2º B" / "3º (A/B/C/D/F)"
  team: BracketTeamLite | null; // set only when the position is confirmed
  locked: boolean;
  candidates: BracketTeamLite[]; // contenders when not yet locked
}

export interface LiveR32Match {
  matchNumber: number;
  bracketSlot: string;
  kickoffAt: string;
  home: LiveSlot;
  away: LiveSlot;
  finalScore: { home: number; away: number } | null;
  decidedByPenalties: boolean;
  /** Team that advanced (for highlighting the winner once played). */
  advancerTeamId: string | null;
}

export interface LiveBracketData {
  quiniela: { id: string; name: string } | null;
  r32: LiveR32Match[];
  groupsDecided: number; // groups whose final order is fully settled (0..12)
  totalGroups: number;
}

/** Build the live Round-of-32 view from current group results. */
export const getLiveBracket = cache(async (userId: string): Promise<LiveBracketData> => {
  const membership = await prisma.quinielaMember.findFirst({
    where: { userId },
    select: { quiniela: { select: { id: true, name: true } } },
  });

  const groupMatches = await prisma.match.findMany({
    where: { stage: "GROUP" },
    select: {
      matchNumber: true,
      groupCode: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true } },
      awayTeam: { select: { id: true, code: true, name: true, shortName: true, flagEmoji: true, fifaRank: true } },
    },
    orderBy: { matchNumber: "asc" },
  });

  const r32Matches = await prisma.match.findMany({
    where: { stage: "ROUND_OF_32" },
    select: {
      matchNumber: true,
      bracketSlot: true,
      kickoffAt: true,
      homeScore: true,
      awayScore: true,
      advancerTeamId: true,
      decidedByPenalties: true,
      homeTeam: { select: { id: true, code: true, name: true, shortName: true, flagEmoji: true } },
      awayTeam: { select: { id: true, code: true, name: true, shortName: true, flagEmoji: true } },
    },
    orderBy: { matchNumber: "asc" },
  });

  // Per-group inputs + a global team-lite lookup.
  const teamLite = new Map<string, BracketTeamLite>();
  const byGroup = new Map<
    string,
    { teams: Map<string, TeamMeta>; played: StandingMatch[]; remaining: Array<{ homeTeamId: string; awayTeamId: string }> }
  >();

  for (const m of groupMatches) {
    if (!m.groupCode || !m.homeTeam || !m.awayTeam) continue;
    if (!byGroup.has(m.groupCode)) byGroup.set(m.groupCode, { teams: new Map(), played: [], remaining: [] });
    const g = byGroup.get(m.groupCode)!;
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!teamLite.has(t.id)) teamLite.set(t.id, { id: t.id, code: t.code, name: t.name, shortName: t.shortName, flagEmoji: t.flagEmoji });
      if (!g.teams.has(t.id)) g.teams.set(t.id, { id: t.id, name: t.name, fifaRank: t.fifaRank });
    }
    if (m.homeScore !== null && m.awayScore !== null) {
      g.played.push({ homeTeamId: m.homeTeam.id, awayTeamId: m.awayTeam.id, homeScore: m.homeScore, awayScore: m.awayScore });
    } else {
      g.remaining.push({ homeTeamId: m.homeTeam.id, awayTeamId: m.awayTeam.id });
    }
  }

  const clinch = new Map<string, GroupClinch>();
  let groupsDecided = 0;
  for (const [code, g] of byGroup) {
    const c = computeGroupClinch({ teams: Array.from(g.teams.values()), played: g.played, remaining: g.remaining });
    clinch.set(code, c);
    if (g.remaining.length === 0 && g.played.length > 0) groupsDecided++;
  }

  const lite = (id: string | null | undefined): BracketTeamLite | null => (id ? teamLite.get(id) ?? null : null);
  const liteList = (ids: string[]): BracketTeamLite[] => ids.map((id) => teamLite.get(id)).filter((t): t is BracketTeamLite => !!t);

  const resolveSlot = (ref: SlotRef, confirmed: BracketTeamLite | null): LiveSlot => {
    const label = slotLabel(ref);
    // A team ESPN has officially confirmed into this slot (persisted) wins.
    if (confirmed) return { label, team: confirmed, locked: true, candidates: [] };
    if (ref.kind === "winner" || ref.kind === "runnerUp") {
      const c = clinch.get(ref.group);
      if (!c) return { label, team: null, locked: false, candidates: [] };
      const slot = ref.kind === "winner" ? c.slots.winner : c.slots.runnerUp;
      if (slot.lockedTeamId) return { label, team: lite(slot.lockedTeamId), locked: true, candidates: [] };
      return { label, team: null, locked: false, candidates: liteList(slot.candidates) };
    }
    // Third-place pool: union of each pool group's third-place contenders.
    // Never locked here — the exact best-thirds→slot assignment (495-combo
    // table) is not yet encoded, so these stay provisional until that lands.
    const seen = new Set<string>();
    const candidates: BracketTeamLite[] = [];
    for (const grp of ref.pool) {
      const c = clinch.get(grp);
      if (!c) continue;
      for (const id of c.slots.third.candidates) {
        if (seen.has(id)) continue;
        seen.add(id);
        const t = teamLite.get(id);
        if (t) candidates.push(t);
      }
    }
    return { label, team: null, locked: false, candidates };
  };

  const r32: LiveR32Match[] = r32Matches.map((m) => {
    const map = R32_SLOTS[m.matchNumber];
    const fallback: SlotRef = { kind: "third", pool: [] };
    return {
      matchNumber: m.matchNumber,
      bracketSlot: m.bracketSlot ?? `R32-${m.matchNumber - 72}`,
      kickoffAt: m.kickoffAt.toISOString(),
      finalScore: m.homeScore !== null && m.awayScore !== null ? { home: m.homeScore, away: m.awayScore } : null,
      decidedByPenalties: m.decidedByPenalties,
      advancerTeamId: m.advancerTeamId,
      home: resolveSlot(map?.home ?? fallback, m.homeTeam),
      away: resolveSlot(map?.away ?? fallback, m.awayTeam),
    };
  });

  return {
    quiniela: membership?.quiniela ?? null,
    r32,
    groupsDecided,
    totalGroups: byGroup.size,
  };
});
