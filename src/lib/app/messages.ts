export const appMessages = {
  brand: {
    name: "La Selva Quiniela",
    tagline: "Mundial 2026",
  },
  nav: {
    dashboard: "Inicio",
    predictions: "Pronósticos",
    leaderboard: "Clasificación",
    rules: "Reglas",
    profile: "Perfil",
    admin: "Admin",
    primary: "Navegación principal",
    open: "Abrir menú",
    close: "Cerrar menú",
  },
  roles: {
    admin: "Administradora/o",
    member: "Miembro",
  },
  placeholder: {
    eyebrow: "Próximamente",
    description:
      "Esta sección se conectará en la siguiente fase del proyecto. Aquí podrás continuar tu actividad sin salir de la app.",
  },
  pages: {
    dashboardTitle: "Inicio",
    predictionsTitle: "Pronósticos",
    predictionsSubtitle:
      "Tus marcadores del Mundial 2026. Llegan en la fase de pronósticos.",
    leaderboardTitle: "Clasificación",
    leaderboardSubtitle:
      "Ranking familiar partido a partido. Llegará junto con el sistema de puntos.",
    rulesTitle: "Reglas y puntajes",
    rulesSubtitle:
      "Cómo se calculan los puntos, qué pasa al cerrar un partido y cómo se decide la clasificación.",
    profileTitle: "Tu perfil",
    profileSubtitle:
      "Apodo, avatar y datos de tu cuenta. Pronto podrás editarlo desde aquí.",
    adminTitle: "Panel de administración",
    adminSubtitle:
      "Gestión de invitaciones, resultados de partidos y reglas de puntaje.",
  },
} as const;

export type AppMessages = typeof appMessages;
