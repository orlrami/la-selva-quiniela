// Centralized prediction lock timing — the single source of truth so the server
// enforcement (predictions/save.ts), the UI lock flags (predictions/data.ts) and
// the rules page (rules/data.ts) can never drift apart.

// Every knockout match closes 30 minutes before its own kickoff. Predictions are
// editable until then; at the lock they freeze and the picks are revealed in the
// "Pronósticos de todos" view. The same 30-minute lead applies to all rounds
// (including the Round of 32) — there is no shared round-wide deadline.
const KNOCKOUT_LOCK_LEAD_MS = 30 * 60 * 1000;

/**
 * Lock time (epoch ms) for a knockout match: 30 minutes before kickoff, for every
 * stage. `stage` is kept in the signature for call-site clarity but no longer
 * changes the result.
 */
export function knockoutLockMs(_stage: string, kickoffMs: number): number {
  return kickoffMs - KNOCKOUT_LOCK_LEAD_MS;
}
