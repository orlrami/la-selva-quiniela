// Official 2026 World Cup knockout feeder tree, derived from ESPN's R16/QF/SF/
// Final slot labels (e.g. R16-1 = "Winner R32-1 vs Winner R32-3"). Match numbers:
// R32 = 73–88, R16 = 89–96, QF = 97–100, SF = 101–102, 3rd = 103, Final = 104.
//
// Maps each source match → the match its WINNER advances to, and the side it
// fills. The two semifinals also feed the third-place match with their LOSERS.
// Home is always the lower-numbered feeder (matches ESPN's "X at Y" ordering).

export type Side = "HOME" | "AWAY";

export const WINNER_FEEDS: Record<number, [number, Side]> = {
  // R32 → R16
  73: [89, "HOME"], 75: [89, "AWAY"],
  74: [90, "HOME"], 77: [90, "AWAY"],
  76: [91, "HOME"], 78: [91, "AWAY"],
  79: [92, "HOME"], 80: [92, "AWAY"],
  83: [93, "HOME"], 84: [93, "AWAY"],
  81: [94, "HOME"], 82: [94, "AWAY"],
  86: [95, "HOME"], 88: [95, "AWAY"],
  85: [96, "HOME"], 87: [96, "AWAY"],
  // R16 → QF
  89: [97, "HOME"], 90: [97, "AWAY"],
  93: [98, "HOME"], 94: [98, "AWAY"],
  91: [99, "HOME"], 92: [99, "AWAY"],
  95: [100, "HOME"], 96: [100, "AWAY"],
  // QF → SF
  97: [101, "HOME"], 98: [101, "AWAY"],
  99: [102, "HOME"], 100: [102, "AWAY"],
  // SF → Final
  101: [104, "HOME"], 102: [104, "AWAY"],
};

// Semifinal losers → third-place match.
export const LOSER_FEEDS: Record<number, [number, Side]> = {
  101: [103, "HOME"],
  102: [103, "AWAY"],
};
