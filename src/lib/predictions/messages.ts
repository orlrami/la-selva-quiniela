export const predictionMessages = {
  page: {
    title: "Pronósticos",
    subtitle:
      "Anota tu marcador para cada partido antes de que se cierre. Se guarda solo en cada cambio.",
    progressLabel: (completed: number, total: number) =>
      `${completed} de ${total} pronósticos`,
  },
  phase: {
    groups: "Fase de grupos",
    knockout: "Eliminatorias",
    knockoutComingSoon: "Disponible más adelante.",
  },
  group: {
    label: (code: string) => `Grupo ${code}`,
    progress: (completed: number, total: number) =>
      `${completed}/${total} listos`,
  },
  card: {
    locked: "Cerrado",
    lockedHelp: "Ya no puedes editar este pronóstico.",
    closesIn: "Cierra en",
    empty: "Marca tu pronóstico",
    saving: "Guardando…",
    saved: "Guardado",
    error: "No se pudo guardar",
    retry: "Reintentar",
    yourPrediction: "Tu pronóstico",
    finalResult: "Resultado oficial",
    noPick: "Sin pronóstico",
    points: (n: number) => `+${n} ${n === 1 ? "pt" : "pts"}`,
    exactHit: "¡Marcador exacto!",
  },
  empty: {
    title: "Aún no hay partidos",
    description:
      "Cuando se publiquen los próximos partidos podrás cargar tus marcadores aquí.",
  },
  errors: {
    unauthenticated: "Tu sesión expiró. Vuelve a iniciar sesión.",
    notMember: "No perteneces a esta quiniela.",
    matchNotFound: "Este partido ya no está disponible.",
    locked: "Este partido ya está cerrado.",
    invalidScore: "El marcador debe ser un número entre 0 y 20.",
    server: "Algo salió mal. Inténtalo de nuevo.",
  },
} as const;

export type PredictionMessages = typeof predictionMessages;
