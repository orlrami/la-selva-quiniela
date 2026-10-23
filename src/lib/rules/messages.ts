export const rulesMessages = {
  page: {
    title: "Reglas y puntajes",
    subtitle:
      "Cómo se ganan los puntos, cuándo se cierran los pronósticos y cómo se decide la clasificación.",
  },
  scoring: {
    title: "Puntajes por partido",
    description:
      "Solo se reparten puntos cuando el administrador carga el resultado oficial de un partido. Hasta entonces todos quedan en cero.",
    columnTrigger: "Cuando aciertas…",
    columnPoints: "Ganas",
    pointsSuffix: "pts",
    rows: {
      exactLabel: "Marcador exacto",
      exactDescription: "Aciertas el marcador exacto del partido.",
      outcomeLabel: "Resultado correcto",
      outcomeDescription:
        "Aciertas quién gana o si hay empate, aunque el marcador sea distinto.",
      missLabel: "Resultado incorrecto",
      missDescription: "Tu pronóstico no coincide con lo que pasó.",
      noPickLabel: "Sin pronóstico",
      noPickDescription: "No marcaste antes del cierre del partido.",
    },
    footnote:
      "El marcador exacto reemplaza al resultado correcto: no se suman los dos. Es 5 puntos en lugar de 2.",
  },
  knockoutScoring: {
    title: "Eliminatorias — Puntos",
    description:
      "Pronosticas un marcador y, si hay empate, quién gana en penales. Ganas dos tipos de puntos que SE SUMAN: AVANZA (acertar qué equipo pasa, incluye penales) y EXACTO (acertar el marcador exacto del tiempo reglamentario).",
    columns: {
      stage: "Ronda",
      exact: "Marcador exacto",
      winner: "Solo ganador",
    },
    footnote:
      "Las dos capas se suman. Ejemplo en Final (1-1, gana A en penales): si pones 1-1 + A ganas 31 (exacto 19 + avanza 12); si pones 1-1 + B ganas 19 (acertaste el marcador, no quién pasó); si pones 2-1 + A ganas 12 (acertaste quién pasa, no el marcador).",
  },
  bonus: {
    title: "Bonus",
    description: "Puntos extra por predicciones especiales.",
    specialTitle: "Predicciones Especiales",
    specialDescription:
      "Antes de que empiece el torneo puedes hacer 6 predicciones extra. Se cierran junto con la fase de grupos, 30 minutos antes del primer partido.",
    specialItems: [
      { label: "Campeón 🏆", points: 25 },
      { label: "Finalista 🥈", points: 15 },
      { label: "Tercer lugar 🥉", points: 10 },
      { label: "Bota de Oro 👟", points: 15 },
      { label: "Guante de Oro 🧤", points: 10 },
      { label: "Balón de Oro ⭐", points: 15 },
    ],
  },
  deadlines: {
    title: "Cuándo se cierran los pronósticos",
    description:
      "Cada partido de eliminatorias cierra 30 minutos antes de su inicio. La fase de grupos cierra 30 minutos antes de su primer partido.",
    rules: [
      "Antes del cierre puedes ajustar tus pronósticos todas las veces que quieras.",
      "Cada partido de eliminatorias cierra 30 minutos antes de su propio inicio. Hasta ese momento puedes predecir o cambiar ese partido.",
      "Antes del cierre nadie ve los pronósticos individuales de los demás. Al cerrarse un partido, los pronósticos de todos se hacen públicos en «Pronósticos de todos».",
      "La fase de grupos se cierra 30 minutos antes de su primer partido y queda bloqueada toda junta.",
      "Las predicciones especiales (bonus) se cierran junto con la fase de grupos.",
      "Si no marcaste nada antes del cierre, ese partido cuenta como faltante y suma 0 puntos.",
    ],
    tableHeader: {
      stage: "Fase",
      closes: "Cierra",
    },
  },
  tiebreakers: {
    title: "Cómo se decide la clasificación",
    description:
      "Cuando dos personas tienen el mismo puntaje aplicamos este orden:",
    items: [
      "Más puntos totales.",
      "Más marcadores exactos.",
      "Más resultados correctos.",
    ],
  },
} as const;

export type RulesMessages = typeof rulesMessages;
