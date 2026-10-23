import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

// Inlined here (not imported from src/lib) because the production Docker runner
// image only ships prisma/ + the generated client, not src/. Kept in sync with
// src/lib/teams/fifa-ranks.ts; the autograder live-syncs ranks after boot anyway.
const FIFA_RANKS: Record<string, number> = {
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5, MAR: 6, POR: 7, NED: 8, GER: 9,
  BEL: 10, CRO: 11, MEX: 13, COL: 14, USA: 15, SEN: 16, JPN: 17, URU: 18,
  SUI: 19, AUT: 21, KOR: 22, AUS: 23, IRN: 24, TUR: 26, NOR: 27, ECU: 28,
  EGY: 29, CIV: 30, ALG: 31, CAN: 32, PAN: 34, SWE: 35, SCO: 38, PAR: 42,
  COD: 43, CZE: 44, QAT: 49, UZB: 50, TUN: 56, KSA: 59, IRQ: 60, RSA: 61,
  BIH: 63, CPV: 64, JOR: 67, GHA: 73, NZL: 82, CUW: 83, HAI: 85,
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatorio para ejecutar el seed.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const quinielaSlug = "la-selva-quiniela";

const teams = [
  { code: "MEX", name: "México", shortName: "México", groupCode: "A", flagEmoji: "🇲🇽" },
  { code: "RSA", name: "Sudáfrica", shortName: "Sudáfrica", groupCode: "A", flagEmoji: "🇿🇦" },
  { code: "KOR", name: "Corea del Sur", shortName: "Corea", groupCode: "A", flagEmoji: "🇰🇷" },
  { code: "CZE", name: "República Checa", shortName: "Rep. Checa", groupCode: "A", flagEmoji: "🇨🇿" },
  { code: "CAN", name: "Canadá", shortName: "Canadá", groupCode: "B", flagEmoji: "🇨🇦" },
  { code: "SUI", name: "Suiza", shortName: "Suiza", groupCode: "B", flagEmoji: "🇨🇭" },
  { code: "QAT", name: "Catar", shortName: "Catar", groupCode: "B", flagEmoji: "🇶🇦" },
  { code: "BIH", name: "Bosnia y Herzegovina", shortName: "Bosnia", groupCode: "B", flagEmoji: "🇧🇦" },
  { code: "BRA", name: "Brasil", shortName: "Brasil", groupCode: "C", flagEmoji: "🇧🇷" },
  { code: "MAR", name: "Marruecos", shortName: "Marruecos", groupCode: "C", flagEmoji: "🇲🇦" },
  { code: "HAI", name: "Haití", shortName: "Haití", groupCode: "C", flagEmoji: "🇭🇹" },
  { code: "SCO", name: "Escocia", shortName: "Escocia", groupCode: "C", flagEmoji: "🏴" },
  { code: "USA", name: "Estados Unidos", shortName: "EE. UU.", groupCode: "D", flagEmoji: "🇺🇸" },
  { code: "PAR", name: "Paraguay", shortName: "Paraguay", groupCode: "D", flagEmoji: "🇵🇾" },
  { code: "AUS", name: "Australia", shortName: "Australia", groupCode: "D", flagEmoji: "🇦🇺" },
  { code: "TUR", name: "Turquía", shortName: "Turquía", groupCode: "D", flagEmoji: "🇹🇷" },
  { code: "GER", name: "Alemania", shortName: "Alemania", groupCode: "E", flagEmoji: "🇩🇪" },
  { code: "CUW", name: "Curazao", shortName: "Curazao", groupCode: "E", flagEmoji: "🇨🇼" },
  { code: "CIV", name: "Costa de Marfil", shortName: "C. Marfil", groupCode: "E", flagEmoji: "🇨🇮" },
  { code: "ECU", name: "Ecuador", shortName: "Ecuador", groupCode: "E", flagEmoji: "🇪🇨" },
  { code: "NED", name: "Países Bajos", shortName: "Países Bajos", groupCode: "F", flagEmoji: "🇳🇱" },
  { code: "JPN", name: "Japón", shortName: "Japón", groupCode: "F", flagEmoji: "🇯🇵" },
  { code: "TUN", name: "Túnez", shortName: "Túnez", groupCode: "F", flagEmoji: "🇹🇳" },
  { code: "SWE", name: "Suecia", shortName: "Suecia", groupCode: "F", flagEmoji: "🇸🇪" },
  { code: "BEL", name: "Bélgica", shortName: "Bélgica", groupCode: "G", flagEmoji: "🇧🇪" },
  { code: "EGY", name: "Egipto", shortName: "Egipto", groupCode: "G", flagEmoji: "🇪🇬" },
  { code: "IRN", name: "Irán", shortName: "Irán", groupCode: "G", flagEmoji: "🇮🇷" },
  { code: "NZL", name: "Nueva Zelanda", shortName: "N. Zelanda", groupCode: "G", flagEmoji: "🇳🇿" },
  { code: "ESP", name: "España", shortName: "España", groupCode: "H", flagEmoji: "🇪🇸" },
  { code: "CPV", name: "Cabo Verde", shortName: "Cabo Verde", groupCode: "H", flagEmoji: "🇨🇻" },
  { code: "KSA", name: "Arabia Saudí", shortName: "Arabia", groupCode: "H", flagEmoji: "🇸🇦" },
  { code: "URU", name: "Uruguay", shortName: "Uruguay", groupCode: "H", flagEmoji: "🇺🇾" },
  { code: "FRA", name: "Francia", shortName: "Francia", groupCode: "I", flagEmoji: "🇫🇷" },
  { code: "SEN", name: "Senegal", shortName: "Senegal", groupCode: "I", flagEmoji: "🇸🇳" },
  { code: "NOR", name: "Noruega", shortName: "Noruega", groupCode: "I", flagEmoji: "🇳🇴" },
  { code: "IRQ", name: "Irak", shortName: "Irak", groupCode: "I", flagEmoji: "🇮🇶" },
  { code: "ARG", name: "Argentina", shortName: "Argentina", groupCode: "J", flagEmoji: "🇦🇷" },
  { code: "ALG", name: "Argelia", shortName: "Argelia", groupCode: "J", flagEmoji: "🇩🇿" },
  { code: "AUT", name: "Austria", shortName: "Austria", groupCode: "J", flagEmoji: "🇦🇹" },
  { code: "JOR", name: "Jordania", shortName: "Jordania", groupCode: "J", flagEmoji: "🇯🇴" },
  { code: "POR", name: "Portugal", shortName: "Portugal", groupCode: "K", flagEmoji: "🇵🇹" },
  { code: "UZB", name: "Uzbekistán", shortName: "Uzbekistán", groupCode: "K", flagEmoji: "🇺🇿" },
  { code: "COL", name: "Colombia", shortName: "Colombia", groupCode: "K", flagEmoji: "🇨🇴" },
  { code: "COD", name: "RD Congo", shortName: "RD Congo", groupCode: "K", flagEmoji: "🇨🇩" },
  { code: "ENG", name: "Inglaterra", shortName: "Inglaterra", groupCode: "L", flagEmoji: "🏴" },
  { code: "CRO", name: "Croacia", shortName: "Croacia", groupCode: "L", flagEmoji: "🇭🇷" },
  { code: "GHA", name: "Ghana", shortName: "Ghana", groupCode: "L", flagEmoji: "🇬🇭" },
  { code: "PAN", name: "Panamá", shortName: "Panamá", groupCode: "L", flagEmoji: "🇵🇦" },
];

// Matchups, venues, and kickoff times follow the official 2026 FIFA schedule.
const fixtures = [
  ["2026-06-11", "A", "MEX", "RSA", "Estadio Ciudad de México", "Ciudad de México"],
  ["2026-06-11", "A", "KOR", "CZE", "Estadio Guadalajara", "Guadalajara"],
  ["2026-06-12", "B", "CAN", "BIH", "Estadio Toronto", "Toronto"],
  ["2026-06-12", "D", "USA", "PAR", "Estadio Los Angeles", "Los Angeles"],
  ["2026-06-13", "B", "QAT", "SUI", "Estadio de la Bahía de San Francisco", "Área de la Bahía de San Francisco"],
  ["2026-06-13", "C", "BRA", "MAR", "Estadio Nueva York/Nueva Jersey", "Nueva York/Nueva Jersey"],
  ["2026-06-13", "C", "HAI", "SCO", "Estadio Boston", "Boston"],
  ["2026-06-13", "D", "AUS", "TUR", "Estadio BC Place Vancouver", "Vancouver"],
  ["2026-06-14", "E", "GER", "CUW", "Estadio Houston", "Houston"],
  ["2026-06-14", "F", "NED", "JPN", "Estadio Dallas", "Dallas"],
  ["2026-06-14", "E", "CIV", "ECU", "Estadio Filadelfia", "Filadelfia"],
  ["2026-06-14", "F", "SWE", "TUN", "Estadio Monterrey", "Monterrey"],
  ["2026-06-15", "H", "ESP", "CPV", "Estadio Atlanta", "Atlanta"],
  ["2026-06-15", "G", "BEL", "EGY", "Estadio Seattle", "Seattle"],
  ["2026-06-15", "H", "KSA", "URU", "Estadio Miami", "Miami"],
  ["2026-06-15", "G", "IRN", "NZL", "Estadio Los Angeles", "Los Angeles"],
  ["2026-06-16", "I", "FRA", "SEN", "Estadio Nueva York/Nueva Jersey", "Nueva York/Nueva Jersey"],
  ["2026-06-16", "I", "IRQ", "NOR", "Estadio Boston", "Boston"],
  ["2026-06-16", "J", "ARG", "ALG", "Estadio Kansas City", "Kansas City"],
  ["2026-06-16", "J", "AUT", "JOR", "Estadio de la Bahía de San Francisco", "Área de la Bahía de San Francisco"],
  ["2026-06-17", "K", "POR", "COD", "Estadio Houston", "Houston"],
  ["2026-06-17", "L", "ENG", "CRO", "Estadio Dallas", "Dallas"],
  ["2026-06-17", "L", "GHA", "PAN", "Estadio Toronto", "Toronto"],
  ["2026-06-17", "K", "UZB", "COL", "Estadio Ciudad de México", "Ciudad de México"],
  ["2026-06-18", "A", "CZE", "RSA", "Estadio Atlanta", "Atlanta"],
  ["2026-06-18", "B", "SUI", "BIH", "Estadio Los Angeles", "Los Angeles"],
  ["2026-06-18", "B", "CAN", "QAT", "Estadio BC Place Vancouver", "Vancouver"],
  ["2026-06-18", "A", "MEX", "KOR", "Estadio Guadalajara", "Guadalajara"],
  ["2026-06-19", "D", "USA", "AUS", "Estadio Seattle", "Seattle"],
  ["2026-06-19", "C", "SCO", "MAR", "Estadio Boston", "Boston"],
  ["2026-06-19", "C", "BRA", "HAI", "Estadio Filadelfia", "Filadelfia"],
  ["2026-06-19", "D", "TUR", "PAR", "Estadio de la Bahía de San Francisco", "Área de la Bahía de San Francisco"],
  ["2026-06-20", "F", "NED", "SWE", "Estadio Houston", "Houston"],
  ["2026-06-20", "E", "GER", "CIV", "Estadio Toronto", "Toronto"],
  ["2026-06-20", "E", "ECU", "CUW", "Estadio Kansas City", "Kansas City"],
  ["2026-06-20", "F", "TUN", "JPN", "Estadio Monterrey", "Monterrey"],
  ["2026-06-21", "H", "ESP", "KSA", "Estadio Atlanta", "Atlanta"],
  ["2026-06-21", "G", "BEL", "IRN", "Estadio Los Angeles", "Los Angeles"],
  ["2026-06-21", "H", "URU", "CPV", "Estadio Miami", "Miami"],
  ["2026-06-21", "G", "NZL", "EGY", "Estadio BC Place Vancouver", "Vancouver"],
  ["2026-06-22", "J", "ARG", "AUT", "Estadio Dallas", "Dallas"],
  ["2026-06-22", "I", "FRA", "IRQ", "Estadio Filadelfia", "Filadelfia"],
  ["2026-06-22", "I", "NOR", "SEN", "Estadio Nueva York/Nueva Jersey", "Nueva York/Nueva Jersey"],
  ["2026-06-22", "J", "JOR", "ALG", "Estadio de la Bahía de San Francisco", "Área de la Bahía de San Francisco"],
  ["2026-06-23", "K", "POR", "UZB", "Estadio Houston", "Houston"],
  ["2026-06-23", "L", "ENG", "GHA", "Estadio Boston", "Boston"],
  ["2026-06-23", "L", "PAN", "CRO", "Estadio Toronto", "Toronto"],
  ["2026-06-23", "K", "COL", "COD", "Estadio Guadalajara", "Guadalajara"],
  ["2026-06-24", "B", "SUI", "CAN", "Estadio BC Place Vancouver", "Vancouver"],
  ["2026-06-24", "B", "BIH", "QAT", "Estadio Seattle", "Seattle"],
  ["2026-06-24", "C", "SCO", "BRA", "Estadio Miami", "Miami"],
  ["2026-06-24", "C", "MAR", "HAI", "Estadio Atlanta", "Atlanta"],
  ["2026-06-24", "A", "CZE", "MEX", "Estadio Ciudad de México", "Ciudad de México"],
  ["2026-06-24", "A", "RSA", "KOR", "Estadio Monterrey", "Monterrey"],
  ["2026-06-25", "E", "CUW", "CIV", "Estadio Filadelfia", "Filadelfia"],
  ["2026-06-25", "E", "ECU", "GER", "Estadio Nueva York/Nueva Jersey", "Nueva York/Nueva Jersey"],
  ["2026-06-25", "F", "JPN", "SWE", "Estadio Dallas", "Dallas"],
  ["2026-06-25", "F", "TUN", "NED", "Estadio Kansas City", "Kansas City"],
  ["2026-06-25", "D", "TUR", "USA", "Estadio Los Angeles", "Los Angeles"],
  ["2026-06-25", "D", "PAR", "AUS", "Estadio de la Bahía de San Francisco", "Área de la Bahía de San Francisco"],
  ["2026-06-26", "I", "NOR", "FRA", "Estadio Boston", "Boston"],
  ["2026-06-26", "I", "SEN", "IRQ", "Estadio Toronto", "Toronto"],
  ["2026-06-26", "H", "CPV", "KSA", "Estadio Houston", "Houston"],
  ["2026-06-26", "H", "URU", "ESP", "Estadio Guadalajara", "Guadalajara"],
  ["2026-06-26", "G", "EGY", "IRN", "Estadio Seattle", "Seattle"],
  ["2026-06-26", "G", "NZL", "BEL", "Estadio BC Place Vancouver", "Vancouver"],
  ["2026-06-27", "L", "PAN", "ENG", "Estadio Nueva York/Nueva Jersey", "Nueva York/Nueva Jersey"],
  ["2026-06-27", "L", "CRO", "GHA", "Estadio Filadelfia", "Filadelfia"],
  ["2026-06-27", "K", "COL", "POR", "Estadio Miami", "Miami"],
  ["2026-06-27", "K", "COD", "UZB", "Estadio Atlanta", "Atlanta"],
  ["2026-06-27", "J", "ALG", "AUT", "Estadio Kansas City", "Kansas City"],
  ["2026-06-27", "J", "JOR", "ARG", "Estadio Dallas", "Dallas"],
] as const;

const groupKickoffsUTC = [
  "2026-06-11T19:00:00.000Z",
  "2026-06-12T02:00:00.000Z",
  "2026-06-12T19:00:00.000Z",
  "2026-06-13T01:00:00.000Z",
  "2026-06-13T19:00:00.000Z",
  "2026-06-13T22:00:00.000Z",
  "2026-06-14T01:00:00.000Z",
  "2026-06-14T04:00:00.000Z",
  "2026-06-14T17:00:00.000Z",
  "2026-06-14T20:00:00.000Z",
  "2026-06-14T23:00:00.000Z",
  "2026-06-15T02:00:00.000Z",
  "2026-06-15T16:00:00.000Z",
  "2026-06-15T19:00:00.000Z",
  "2026-06-15T22:00:00.000Z",
  "2026-06-16T01:00:00.000Z",
  "2026-06-16T19:00:00.000Z",
  "2026-06-16T22:00:00.000Z",
  "2026-06-17T01:00:00.000Z",
  "2026-06-17T04:00:00.000Z",
  "2026-06-17T17:00:00.000Z",
  "2026-06-17T20:00:00.000Z",
  "2026-06-17T23:00:00.000Z",
  "2026-06-18T02:00:00.000Z",
  "2026-06-18T16:00:00.000Z",
  "2026-06-18T19:00:00.000Z",
  "2026-06-18T22:00:00.000Z",
  "2026-06-19T01:00:00.000Z",
  "2026-06-19T19:00:00.000Z",
  "2026-06-19T22:00:00.000Z",
  "2026-06-20T01:00:00.000Z",
  "2026-06-20T04:00:00.000Z",
  "2026-06-20T17:00:00.000Z",
  "2026-06-20T20:00:00.000Z",
  "2026-06-21T00:00:00.000Z",
  "2026-06-21T04:00:00.000Z",
  "2026-06-21T16:00:00.000Z",
  "2026-06-21T19:00:00.000Z",
  "2026-06-21T22:00:00.000Z",
  "2026-06-22T01:00:00.000Z",
  "2026-06-22T17:00:00.000Z",
  "2026-06-22T21:00:00.000Z",
  "2026-06-23T00:00:00.000Z",
  "2026-06-23T03:00:00.000Z",
  "2026-06-23T17:00:00.000Z",
  "2026-06-23T20:00:00.000Z",
  "2026-06-23T23:00:00.000Z",
  "2026-06-24T02:00:00.000Z",
  "2026-06-24T19:00:00.000Z",
  "2026-06-24T19:00:00.000Z",
  "2026-06-24T22:00:00.000Z",
  "2026-06-24T22:00:00.000Z",
  "2026-06-25T01:00:00.000Z",
  "2026-06-25T01:00:00.000Z",
  "2026-06-25T20:00:00.000Z",
  "2026-06-25T20:00:00.000Z",
  "2026-06-25T23:00:00.000Z",
  "2026-06-25T23:00:00.000Z",
  "2026-06-26T02:00:00.000Z",
  "2026-06-26T02:00:00.000Z",
  "2026-06-26T19:00:00.000Z",
  "2026-06-26T19:00:00.000Z",
  "2026-06-27T00:00:00.000Z",
  "2026-06-27T00:00:00.000Z",
  "2026-06-27T03:00:00.000Z",
  "2026-06-27T03:00:00.000Z",
  "2026-06-27T21:00:00.000Z",
  "2026-06-27T21:00:00.000Z",
  "2026-06-27T23:30:00.000Z",
  "2026-06-27T23:30:00.000Z",
  "2026-06-28T02:00:00.000Z",
  "2026-06-28T02:00:00.000Z",
] as const;

function buildGroupMatches() {
  return fixtures.map(([_day, groupCode, homeTeamCode, awayTeamCode, venue, city], index) => {
    const kickoffAt = new Date(groupKickoffsUTC[index]);
    return {
      matchNumber: index + 1,
      stage: "GROUP" as const,
      groupCode,
      kickoffAt,
      lockAt: kickoffAt,
      venue,
      city,
      homeTeamCode,
      awayTeamCode,
    };
  });
}

function normalizeUsername(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("SEED_ADMIN_PASSWORD is required");
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin La Selva";
  const adminUsernameKey = normalizeUsername(adminUsername);
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { usernameKey: adminUsernameKey },
    update: {
      username: adminUsername,
      name: adminName,
      passwordHash,
      role: "ADMIN",
    },
    create: {
      username: adminUsername,
      usernameKey: adminUsernameKey,
      name: adminName,
      passwordHash,
      role: "ADMIN",
      avatarColor: "#e7bd54",
    },
  });

  const quiniela = await prisma.quiniela.upsert({
    where: { slug: quinielaSlug },
    update: {
      name: "La Selva Quiniela",
      description: "Quiniela familiar privada para el Mundial 2026.",
    },
    create: {
      name: "La Selva Quiniela",
      slug: quinielaSlug,
      description: "Quiniela familiar privada para el Mundial 2026.",
    },
  });

  await prisma.quinielaMember.upsert({
    where: {
      userId_quinielaId: {
        userId: admin.id,
        quinielaId: quiniela.id,
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: admin.id,
      quinielaId: quiniela.id,
      role: "ADMIN",
      nickname: "Admin",
    },
  });

  for (const team of teams) {
    const withRank = { ...team, fifaRank: FIFA_RANKS[team.code] ?? null };
    await prisma.team.upsert({
      where: { code: team.code },
      update: withRank,
      create: withRank,
    });
  }

  const teamRecords = await prisma.team.findMany();
  const teamByCode = new Map(teamRecords.map((team) => [team.code, team]));

  for (const match of buildGroupMatches()) {
    const homeTeam = teamByCode.get(match.homeTeamCode);
    const awayTeam = teamByCode.get(match.awayTeamCode);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Equipo faltante para ${match.homeTeamCode} vs ${match.awayTeamCode}`);
    }

    await prisma.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {
        stage: match.stage,
        groupCode: match.groupCode,
        kickoffAt: match.kickoffAt,
        lockAt: match.lockAt,
        venue: match.venue,
        city: match.city,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
      },
      create: {
        matchNumber: match.matchNumber,
        stage: match.stage,
        groupCode: match.groupCode,
        kickoffAt: match.kickoffAt,
        lockAt: match.lockAt,
        venue: match.venue,
        city: match.city,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
      },
    });
  }

  const groupScoreRules = [
    {
      key: "group-outcome",
      label: "Resultado correcto",
      description: "Acertar ganador o empate en fase de grupos.",
      points: 2,
    },
    {
      key: "group-exact-score",
      label: "Marcador exacto",
      description: "Acertar el marcador exacto en fase de grupos.",
      points: 5,
    },
  ];

  for (const rule of groupScoreRules) {
    await prisma.scoreRule.upsert({
      where: {
        quinielaId_stage_key: {
          quinielaId: quiniela.id,
          stage: "GROUP",
          key: rule.key,
        },
      },
      update: rule,
      create: { quinielaId: quiniela.id, stage: "GROUP", ...rule },
    });
  }

  // Knockout scoring: two layers stack per match — advance (picked the team that
  // goes through, penalty winner included) + exact (exact 90/120-min score).
  const knockoutLayers: Array<{
    stage:
      | "ROUND_OF_32"
      | "ROUND_OF_16"
      | "QUARTER_FINAL"
      | "SEMI_FINAL"
      | "THIRD_PLACE"
      | "FINAL";
    label: string;
    advance: number;
    exact: number;
  }> = [
    { stage: "ROUND_OF_32", label: "Octavos (Ronda de 32)", advance: 3, exact: 5 },
    { stage: "ROUND_OF_16", label: "Octavos de Final", advance: 4, exact: 7 },
    { stage: "QUARTER_FINAL", label: "Cuartos de Final", advance: 6, exact: 10 },
    { stage: "SEMI_FINAL", label: "Semifinales", advance: 9, exact: 14 },
    { stage: "THIRD_PLACE", label: "Tercer lugar", advance: 4, exact: 6 },
    { stage: "FINAL", label: "Final", advance: 12, exact: 19 },
  ];
  const koLayerKeys = [
    { key: "knockout-advance", label: "Avanza", desc: "Acertar al equipo que avanza (incluye penales)." },
    { key: "knockout-exact", label: "Marcador exacto", desc: "Acertar el marcador exacto del tiempo reglamentario." },
  ] as const;

  // Drop superseded knockout rules (old single-key winner + the outcome layer).
  await prisma.scoreRule.deleteMany({
    where: { quinielaId: quiniela.id, key: { in: ["knockout-winner", "knockout-outcome"] } },
  });

  for (const rule of knockoutLayers) {
    const values: Record<string, number> = {
      "knockout-advance": rule.advance,
      "knockout-exact": rule.exact,
    };
    for (const layer of koLayerKeys) {
      const points = values[layer.key];
      const label = `${rule.label} · ${layer.label}`;
      await prisma.scoreRule.upsert({
        where: { quinielaId_stage_key: { quinielaId: quiniela.id, stage: rule.stage, key: layer.key } },
        update: { label, description: layer.desc, points },
        create: { quinielaId: quiniela.id, stage: rule.stage, key: layer.key, label, description: layer.desc, points },
      });
    }
  }

  // ------------------------------------------------------------------
  // Knockout bracket: 32 placeholder matches with team slots that will be
  // filled in once the group stage finishes. Each match's winner (and the
  // semifinal losers) feed into the next round automatically.
  // ------------------------------------------------------------------

  type KnockoutStage =
    | "ROUND_OF_32"
    | "ROUND_OF_16"
    | "QUARTER_FINAL"
    | "SEMI_FINAL"
    | "THIRD_PLACE"
    | "FINAL";

  interface KnockoutSpec {
    matchNumber: number;
    stage: KnockoutStage;
    bracketSlot: string;
    kickoffAt: Date;
    winnerFeedsToSlot: string | null;
    winnerFeedsAs: "HOME" | "AWAY" | null;
    loserFeedsToSlot: string | null;
    loserFeedsAs: "HOME" | "AWAY" | null;
  }

  const knockoutSpecs: KnockoutSpec[] = [];

  // Round of 32 — 16 matches across June 28 – July 3.
  const r32Kickoffs = [
    "2026-06-28T19:00:00.000Z",
    "2026-06-29T20:30:00.000Z",
    "2026-06-30T01:00:00.000Z",
    "2026-06-29T17:00:00.000Z",
    "2026-06-30T21:00:00.000Z",
    "2026-06-30T17:00:00.000Z",
    "2026-07-01T02:00:00.000Z",
    "2026-07-01T16:00:00.000Z",
    "2026-07-02T00:00:00.000Z",
    "2026-07-01T20:00:00.000Z",
    "2026-07-02T23:00:00.000Z",
    "2026-07-02T19:00:00.000Z",
    "2026-07-03T03:00:00.000Z",
    "2026-07-03T22:00:00.000Z",
    "2026-07-04T01:30:00.000Z",
    "2026-07-03T18:00:00.000Z",
  ];
  for (let i = 0; i < 16; i++) {
    knockoutSpecs.push({
      matchNumber: 73 + i,
      stage: "ROUND_OF_32",
      bracketSlot: `R32-${i + 1}`,
      kickoffAt: new Date(r32Kickoffs[i]),
      winnerFeedsToSlot: `R16-${Math.floor(i / 2) + 1}`,
      winnerFeedsAs: i % 2 === 0 ? "HOME" : "AWAY",
      loserFeedsToSlot: null,
      loserFeedsAs: null,
    });
  }

  // Round of 16 — 8 matches over July 4 / July 5 / July 6 / July 7.
  const r16Kickoffs = [
    "2026-07-04T21:00:00.000Z",
    "2026-07-04T17:00:00.000Z",
    "2026-07-05T20:00:00.000Z",
    "2026-07-06T00:00:00.000Z",
    "2026-07-06T19:00:00.000Z",
    "2026-07-07T00:00:00.000Z",
    "2026-07-07T16:00:00.000Z",
    "2026-07-07T20:00:00.000Z",
  ];
  for (let i = 0; i < 8; i++) {
    knockoutSpecs.push({
      matchNumber: 89 + i,
      stage: "ROUND_OF_16",
      bracketSlot: `R16-${i + 1}`,
      kickoffAt: new Date(r16Kickoffs[i]),
      winnerFeedsToSlot: `QF-${Math.floor(i / 2) + 1}`,
      winnerFeedsAs: i % 2 === 0 ? "HOME" : "AWAY",
      loserFeedsToSlot: null,
      loserFeedsAs: null,
    });
  }

  // Quarterfinals — 4 matches across July 9 + July 10.
  const qfKickoffs = [
    "2026-07-09T20:00:00.000Z",
    "2026-07-10T19:00:00.000Z",
    "2026-07-11T21:00:00.000Z",
    "2026-07-12T01:00:00.000Z",
  ];
  for (let i = 0; i < 4; i++) {
    knockoutSpecs.push({
      matchNumber: 97 + i,
      stage: "QUARTER_FINAL",
      bracketSlot: `QF-${i + 1}`,
      kickoffAt: new Date(qfKickoffs[i]),
      winnerFeedsToSlot: `SF-${Math.floor(i / 2) + 1}`,
      winnerFeedsAs: i % 2 === 0 ? "HOME" : "AWAY",
      loserFeedsToSlot: null,
      loserFeedsAs: null,
    });
  }

  // Semifinals — 2 matches; loser feeds the Third place match.
  const sfKickoffs = [
    "2026-07-14T19:00:00.000Z",
    "2026-07-15T19:00:00.000Z",
  ];
  for (let i = 0; i < 2; i++) {
    knockoutSpecs.push({
      matchNumber: 101 + i,
      stage: "SEMI_FINAL",
      bracketSlot: `SF-${i + 1}`,
      kickoffAt: new Date(sfKickoffs[i]),
      winnerFeedsToSlot: "FINAL",
      winnerFeedsAs: i === 0 ? "HOME" : "AWAY",
      loserFeedsToSlot: "THIRD",
      loserFeedsAs: i === 0 ? "HOME" : "AWAY",
    });
  }

  // Third place + final.
  knockoutSpecs.push({
    matchNumber: 103,
    stage: "THIRD_PLACE",
    bracketSlot: "THIRD",
    kickoffAt: new Date("2026-07-18T21:00:00.000Z"),
    winnerFeedsToSlot: null,
    winnerFeedsAs: null,
    loserFeedsToSlot: null,
    loserFeedsAs: null,
  });
  knockoutSpecs.push({
    matchNumber: 104,
    stage: "FINAL",
    bracketSlot: "FINAL",
    kickoffAt: new Date("2026-07-19T19:00:00.000Z"),
    winnerFeedsToSlot: null,
    winnerFeedsAs: null,
    loserFeedsToSlot: null,
    loserFeedsAs: null,
  });

  // Override the feed graph with the OFFICIAL 2026 bracket (R32 winners pair
  // 1&3, 2&5, ... not sequentially). Mirrors src/lib/standings/ko-bracket.ts;
  // kept inline because the seed runs without src/ on the VPS.
  const WINNER_FEED_BY_SLOT: Record<string, [string, "HOME" | "AWAY"]> = {
    "R32-1": ["R16-1", "HOME"], "R32-3": ["R16-1", "AWAY"],
    "R32-2": ["R16-2", "HOME"], "R32-5": ["R16-2", "AWAY"],
    "R32-4": ["R16-3", "HOME"], "R32-6": ["R16-3", "AWAY"],
    "R32-7": ["R16-4", "HOME"], "R32-8": ["R16-4", "AWAY"],
    "R32-11": ["R16-5", "HOME"], "R32-12": ["R16-5", "AWAY"],
    "R32-9": ["R16-6", "HOME"], "R32-10": ["R16-6", "AWAY"],
    "R32-14": ["R16-7", "HOME"], "R32-16": ["R16-7", "AWAY"],
    "R32-13": ["R16-8", "HOME"], "R32-15": ["R16-8", "AWAY"],
    "R16-1": ["QF-1", "HOME"], "R16-2": ["QF-1", "AWAY"],
    "R16-5": ["QF-2", "HOME"], "R16-6": ["QF-2", "AWAY"],
    "R16-3": ["QF-3", "HOME"], "R16-4": ["QF-3", "AWAY"],
    "R16-7": ["QF-4", "HOME"], "R16-8": ["QF-4", "AWAY"],
    "QF-1": ["SF-1", "HOME"], "QF-2": ["SF-1", "AWAY"],
    "QF-3": ["SF-2", "HOME"], "QF-4": ["SF-2", "AWAY"],
    "SF-1": ["FINAL", "HOME"], "SF-2": ["FINAL", "AWAY"],
  };
  const LOSER_FEED_BY_SLOT: Record<string, [string, "HOME" | "AWAY"]> = {
    "SF-1": ["THIRD", "HOME"], "SF-2": ["THIRD", "AWAY"],
  };
  for (const spec of knockoutSpecs) {
    const w = WINNER_FEED_BY_SLOT[spec.bracketSlot];
    const l = LOSER_FEED_BY_SLOT[spec.bracketSlot];
    spec.winnerFeedsToSlot = w ? w[0] : null;
    spec.winnerFeedsAs = w ? w[1] : null;
    spec.loserFeedsToSlot = l ? l[0] : null;
    spec.loserFeedsAs = l ? l[1] : null;
  }

  // Two-pass: first upsert every match without the feed FKs (so all rows
  // exist), then patch the feed FKs by bracketSlot lookup. Idempotent.
  const KNOCKOUT_VENUE = "Estadio por confirmar";
  const KNOCKOUT_CITY = "Sede por confirmar";

  for (const spec of knockoutSpecs) {
    await prisma.match.upsert({
      where: { matchNumber: spec.matchNumber },
      // NOTE: never overwrite kickoffAt/lockAt on reseed. Knockout kickoff times
      // belong to the actual team pairing (real ESPN schedule), not the fixed
      // slot — syncKickoffsFromEspn corrects them once teams resolve. Clobbering
      // here on every boot would revert those fixes and reopen the lock bug.
      update: {
        stage: spec.stage,
        bracketSlot: spec.bracketSlot,
        venue: KNOCKOUT_VENUE,
        city: KNOCKOUT_CITY,
      },
      create: {
        matchNumber: spec.matchNumber,
        stage: spec.stage,
        groupCode: null,
        bracketSlot: spec.bracketSlot,
        kickoffAt: spec.kickoffAt,
        lockAt: spec.kickoffAt,
        venue: KNOCKOUT_VENUE,
        city: KNOCKOUT_CITY,
      },
    });
  }

  const knockoutRecords = await prisma.match.findMany({
    where: { bracketSlot: { not: null } },
    select: { id: true, bracketSlot: true },
  });
  const slotToId = new Map(
    knockoutRecords.map((m) => [m.bracketSlot!, m.id]),
  );

  for (const spec of knockoutSpecs) {
    await prisma.match.update({
      where: { matchNumber: spec.matchNumber },
      data: {
        winnerFeedsToId: spec.winnerFeedsToSlot
          ? (slotToId.get(spec.winnerFeedsToSlot) ?? null)
          : null,
        winnerFeedsAs: spec.winnerFeedsAs,
        loserFeedsToId: spec.loserFeedsToSlot
          ? (slotToId.get(spec.loserFeedsToSlot) ?? null)
          : null,
        loserFeedsAs: spec.loserFeedsAs,
      },
    });
  }

  await prisma.invite.upsert({
    where: { token: "demo-la-selva-2026" },
    update: {
      quinielaId: quiniela.id,
      createdById: admin.id,
      expiresAt: new Date("2026-06-11T18:00:00.000Z"),
    },
    create: {
      quinielaId: quiniela.id,
      token: "demo-la-selva-2026",
      createdById: admin.id,
      expiresAt: new Date("2026-06-11T18:00:00.000Z"),
      maxUses: 50,
    },
  });

  await prisma.standingSnapshot.deleteMany({
    where: {
      quinielaId: quiniela.id,
      userId: admin.id,
    },
  });

  await prisma.standingSnapshot.create({
    data: {
      quinielaId: quiniela.id,
      userId: admin.id,
      rank: 1,
      points: 0,
      missingPredictions: 72,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
