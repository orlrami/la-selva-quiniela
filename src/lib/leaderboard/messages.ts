export const leaderboardMessages = {
  page: {
    title: "Clasificación",
    subtitle:
      "Cuanto más acertados tus pronósticos, más arriba apareces. Se actualiza apenas el administrador carga un resultado.",
  },
  summary: {
    eyebrow: "Tu posición",
    points: "puntos",
    rankSuffix: (total: number) =>
      total === 1 ? "de 1 jugador" : `de ${total} jugadores`,
    progress: (final: number, total: number) =>
      `${final} de ${total} partidos con resultado oficial`,
    you: "Tú",
  },
  row: {
    pointsLabel: "Puntos",
    youBadge: "Tú",
    exactShort: "exactos",
    correctShort: "correctos",
    missingShort: "faltantes",
    noActivity: "Sin pronósticos aún",
  },
  empty: {
    title: "Aún no hay jugadores",
    description:
      "Invita a la familia desde el panel de administración para que aparezcan aquí.",
  },
} as const;

export type LeaderboardMessages = typeof leaderboardMessages;
