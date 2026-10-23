// Official 2026 World Cup Round-of-32 slot allocation (fixed bracket template,
// independent of the draw). Verified vs the published bracket — match numbers
// 73–88, groups A–L. Each R32 match's two slots are a group winner, a group
// runner-up, or one of the eight best third-placed teams drawn from a fixed pool
// of five groups. The seed assigns these the same matchNumbers (73 + i).
//
// Sources: worldcupwiki.com + en.wikipedia.org/2026_FIFA_World_Cup_knockout_stage

export type SlotRef =
  | { kind: "winner"; group: string }
  | { kind: "runnerUp"; group: string }
  | { kind: "third"; pool: string[] };

export const R32_SLOTS: Record<number, { home: SlotRef; away: SlotRef }> = {
  73: { home: { kind: "runnerUp", group: "A" }, away: { kind: "runnerUp", group: "B" } },
  74: { home: { kind: "winner", group: "E" }, away: { kind: "third", pool: ["A", "B", "C", "D", "F"] } },
  75: { home: { kind: "winner", group: "F" }, away: { kind: "runnerUp", group: "C" } },
  76: { home: { kind: "winner", group: "C" }, away: { kind: "runnerUp", group: "F" } },
  77: { home: { kind: "winner", group: "I" }, away: { kind: "third", pool: ["C", "D", "F", "G", "H"] } },
  78: { home: { kind: "runnerUp", group: "E" }, away: { kind: "runnerUp", group: "I" } },
  79: { home: { kind: "winner", group: "A" }, away: { kind: "third", pool: ["C", "E", "F", "H", "I"] } },
  80: { home: { kind: "winner", group: "L" }, away: { kind: "third", pool: ["E", "H", "I", "J", "K"] } },
  81: { home: { kind: "winner", group: "D" }, away: { kind: "third", pool: ["B", "E", "F", "I", "J"] } },
  82: { home: { kind: "winner", group: "G" }, away: { kind: "third", pool: ["A", "E", "H", "I", "J"] } },
  83: { home: { kind: "runnerUp", group: "K" }, away: { kind: "runnerUp", group: "L" } },
  84: { home: { kind: "winner", group: "H" }, away: { kind: "runnerUp", group: "J" } },
  85: { home: { kind: "winner", group: "B" }, away: { kind: "third", pool: ["E", "F", "G", "I", "J"] } },
  86: { home: { kind: "winner", group: "J" }, away: { kind: "runnerUp", group: "H" } },
  87: { home: { kind: "winner", group: "K" }, away: { kind: "third", pool: ["D", "E", "I", "J", "L"] } },
  88: { home: { kind: "runnerUp", group: "D" }, away: { kind: "runnerUp", group: "G" } },
};

/** Human label for a slot, in Spanish (e.g. "Ganador A", "2º B", "3º (A/B/C/D/F)"). */
export function slotLabel(ref: SlotRef): string {
  if (ref.kind === "winner") return `Ganador ${ref.group}`;
  if (ref.kind === "runnerUp") return `2º ${ref.group}`;
  return `3º (${ref.pool.join("/")})`;
}
