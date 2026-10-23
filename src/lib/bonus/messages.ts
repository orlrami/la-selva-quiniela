export const bonusMessages = {
  section: {
    title: "Predicciones Especiales",
    subtitle: "Elige tus favoritos antes de que empiece el torneo. ¡Puntos extra si aciertas!",
  },
  categories: {
    CHAMPION: {
      label: "Campeón",
      description: "¿Quién ganará el Mundial?",
      points: 25,
      emoji: "🏆",
    },
    RUNNER_UP: {
      label: "Finalista",
      description: "¿Quién será el subcampeón?",
      points: 15,
      emoji: "🥈",
    },
    THIRD_PLACE: {
      label: "Tercer Lugar",
      description: "¿Quién quedará en tercer lugar?",
      points: 10,
      emoji: "🥉",
    },
    GOLDEN_BOOT: {
      label: "Bota de Oro",
      description: "Goleador del torneo",
      points: 15,
      emoji: "👟",
    },
    GOLDEN_GLOVE: {
      label: "Guante de Oro",
      description: "Mejor portero del torneo",
      points: 10,
      emoji: "🧤",
    },
    GOLDEN_BALL: {
      label: "Balón de Oro",
      description: "Mejor jugador del torneo",
      points: 15,
      emoji: "⭐",
    },
  },
  actions: {
    saved: "¡Guardado!",
    pick: "Elegir",
    change: "Cambiar",
    locked: "Cerrado",
    playerPlaceholder: "Nombre del jugador",
  },
} as const;

export type BonusMessages = typeof bonusMessages;
