import "server-only";

import { cache } from "react";

import { bonusMessages } from "@/lib/bonus/messages";
import { prisma } from "@/lib/prisma";

export type BonusCategory =
  | "CHAMPION"
  | "RUNNER_UP"
  | "THIRD_PLACE"
  | "GOLDEN_BOOT"
  | "GOLDEN_GLOVE"
  | "GOLDEN_BALL";

const CATEGORY_ORDER: BonusCategory[] = [
  "CHAMPION",
  "RUNNER_UP",
  "THIRD_PLACE",
  "GOLDEN_BOOT",
  "GOLDEN_GLOVE",
  "GOLDEN_BALL",
];
const TEAM_CATEGORIES = new Set<BonusCategory>(["CHAMPION", "RUNNER_UP", "THIRD_PLACE"]);

export interface RevealPicker {
  userId: string;
  name: string;
  avatarColor: string;
  isCurrentUser: boolean;
}

/** A distinct choice within a category (a team, or a normalized player name). */
export interface RevealOption {
  key: string;
  label: string;
  teamCode: string | null;
  count: number;
  share: number; // 0–100, of players who picked in this category
  pickers: RevealPicker[];
}

export interface RevealCategory {
  category: BonusCategory;
  label: string;
  emoji: string;
  points: number;
  isPlayer: boolean;
  picked: number; // how many players made a pick here
  options: RevealOption[]; // consensus-sorted, most popular first
  missing: RevealPicker[]; // players who left it blank
}

export interface BonusRevealData {
  quiniela: { id: string; name: string };
  locked: boolean;
  totalPlayers: number;
  categories: RevealCategory[];
}

/** Strip accents + lowercase so "Mbappé" and "mbappe" group together. */
function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Built from the ACTUAL picks the family wrote (no presets → many spellings,
// nicknames and typos). Maps known variants to one canonical name so the
// consensus isn't split. Unknown names fall back to what the person wrote.
const PLAYER_CANON: Array<[string, string[]]> = [
  ["Kylian Mbappé", ["mbappe", "kylian mbappe", "embape", "mbapoe", "kiliam embapee", "mbappe kylian"]],
  ["Cristiano Ronaldo", ["cristiano ronaldo", "cr7", "cristiano"]],
  ["Lamine Yamal", ["lamine yamal", "lamina yamal", "yamal"]],
  ["Emiliano 'Dibu' Martínez", ["emiliano martinez", "dibu", "dibu martinez", "e martinez"]],
  ["Diogo Costa", ["diogo costa"]],
  ["Joan García", ["joan garcia"]],
  ["Unai Simón", ["unai simon"]],
  ["Ousmane Dembélé", ["dembele", "dembélé", "ousmane dembele"]],
  ["Julián Álvarez", ["julian alvarez"]],
  ["João Neves", ["joao neves"]],
  ["Vinícius Júnior", ["vinicius junior", "vinicius", "vini jr"]],
  ["Lionel Messi", ["messi", "lionel messi", "leo messi"]],
  ["Mike Maignan", ["maignan"]],
  ["Jordan Pickford", ["jordan pickford", "pickford"]],
];
const ALIAS = new Map<string, string>();
for (const [canon, variants] of PLAYER_CANON) for (const v of variants) ALIAS.set(v, canon);

/** Resolve a free-text player name to its canonical form (or the raw text). */
function canonPlayer(raw: string): string {
  return ALIAS.get(normName(raw)) ?? raw.trim();
}

export const getBonusReveal = cache(
  async (userId: string): Promise<BonusRevealData | null> => {
    const membership = await prisma.quinielaMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: { quiniela: { select: { id: true, name: true } } },
    });
    if (!membership) return null;
    const quinielaId = membership.quiniela.id;

    const [members, picks, firstMatch] = await Promise.all([
      prisma.quinielaMember.findMany({
        where: { quinielaId, user: { role: "MEMBER" } },
        select: { nickname: true, user: { select: { id: true, name: true, avatarColor: true } } },
      }),
      prisma.bonusPick.findMany({
        where: { quinielaId, user: { role: "MEMBER" } },
        select: {
          userId: true,
          category: true,
          playerName: true,
          team: { select: { code: true, name: true } },
        },
      }),
      prisma.match.findFirst({
        where: { stage: "GROUP" },
        orderBy: { kickoffAt: "asc" },
        select: { kickoffAt: true },
      }),
    ]);

    const locked = firstMatch
      ? Date.now() >= firstMatch.kickoffAt.getTime() - 30 * 60 * 1000
      : false;

    const picker = (uid: string): RevealPicker | null => {
      const m = members.find((x) => x.user.id === uid);
      if (!m) return null;
      return {
        userId: uid,
        name: m.nickname ?? m.user.name,
        avatarColor: m.user.avatarColor,
        isCurrentUser: uid === userId,
      };
    };

    const byCat = new Map<BonusCategory, typeof picks>();
    for (const p of picks) {
      const c = p.category as BonusCategory;
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c)!.push(p);
    }

    const categories: RevealCategory[] = CATEGORY_ORDER.map((category) => {
      const meta = bonusMessages.categories[category];
      const isPlayer = !TEAM_CATEGORIES.has(category);
      const catPicks = (byCat.get(category) ?? []).filter((p) =>
        isPlayer ? !!p.playerName : !!p.team,
      );

      // Group into options (by team code, or normalized player name).
      const groups = new Map<
        string,
        { label: string; teamCode: string | null; labelCounts: Map<string, number>; pickers: RevealPicker[] }
      >();
      for (const p of catPicks) {
        const key = isPlayer ? canonPlayer(p.playerName!) : p.team!.code;
        const label = isPlayer ? canonPlayer(p.playerName!) : p.team!.name;
        if (!groups.has(key)) {
          groups.set(key, {
            label,
            teamCode: isPlayer ? null : p.team!.code,
            labelCounts: new Map(),
            pickers: [],
          });
        }
        const g = groups.get(key)!;
        g.labelCounts.set(label, (g.labelCounts.get(label) ?? 0) + 1);
        const who = picker(p.userId);
        if (who) g.pickers.push(who);
      }

      const picked = catPicks.length;
      const options: RevealOption[] = Array.from(groups.entries())
        .map(([key, g]) => {
          // Display the most-common original spelling for player names.
          const label = [...g.labelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          return {
            key,
            label,
            teamCode: g.teamCode,
            count: g.pickers.length,
            share: picked > 0 ? Math.round((g.pickers.length / picked) * 100) : 0,
            pickers: g.pickers.sort((a, b) => a.name.localeCompare(b.name, "es")),
          };
        })
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));

      const pickedUserIds = new Set(catPicks.map((p) => p.userId));
      const missing = members
        .filter((m) => !pickedUserIds.has(m.user.id))
        .map((m) => picker(m.user.id)!)
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

      return {
        category,
        label: meta.label,
        emoji: meta.emoji,
        points: meta.points,
        isPlayer,
        picked,
        options,
        missing,
      };
    });

    return {
      quiniela: membership.quiniela,
      locked,
      totalPlayers: members.length,
      categories,
    };
  },
);
