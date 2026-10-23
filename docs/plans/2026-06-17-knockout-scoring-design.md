# Knockout (Playoffs) Scoring — Design

Date: 2026-06-17
Status: Approved direction (awaiting spec review)

## Goal
Make the knockout stage its own scoring world: reward **who advances**, the
**outcome**, and the **exact score** independently and additively, with hard
escalation by round so late games can overturn the group-stage standings.
Handle penalty shootouts correctly (today they are faked with a +1 bump).

## Decisions (locked)
- **Fully additive** per match: `points = advance + outcome + exact` (all stack).
- **Points table** (advance / outcome / exact):
  | Stage | Advance | Outcome | Exact |
  |---|---|---|---|
  | ROUND_OF_32 | 4 | 2 | 6 |
  | ROUND_OF_16 | 6 | 3 | 9 |
  | QUARTER_FINAL | 10 | 4 | 14 |
  | SEMI_FINAL | 15 | 6 | 20 |
  | THIRD_PLACE | 6 | 3 | 8 |
  | FINAL | 25 | 10 | 30 |
  - Max single match (perfect Final) = 65.
- **Store true score + advancer** (no more +1 bump).

## Scoring model
For a graded KO match with true 90/120 score `(H,A)` and advancer `advancerTeamId`
(the team that progresses — pens winner if `decidedByPenalties`):

- **advance**: `+advancePts[stage]` if `prediction.pickedWinnerTeamId === advancerTeamId`.
- **outcome**: `+outcomePts[stage]` if W/D/L of `(predHome,predAway)` === W/D/L of `(H,A)`
  (draws included — a predicted draw counts when the real match was a draw).
- **exact**: `+exactPts[stage]` if `predHome===H && predAway===A`.

Flags written to `Prediction`: `correctWinner = advance hit`, `correctOutcome =
outcome hit`, `exactScore = exact hit`, `points = sum`.

Note: exact implies outcome here, so an exact decisive pick scores advance+outcome+exact.
This is intended (fully-additive decision).

## Data model
`Match` (new fields, migration):
- `advancerTeamId String?` — FK to Team, the team that progresses. Set at grading.
- `decidedByPenalties Boolean @default(false)`.
- relation `advancerTeam Team? @relation("Advancer", ...)`.

`Prediction`: no new fields (reuses pickedWinnerTeamId / correctWinner / correctOutcome / exactScore).

## Components to change
1. **prisma/schema.prisma** — add the two Match fields + relation; migration.
2. **src/lib/autograder/espn.ts** — stop the +1 bump; return true `homeScore/awayScore`
   plus `decidedByPenalties` and the advancer code (shootout/`winner`).
3. **src/lib/autograder/grader.ts** — map advancer code → teamId; pass
   `advancerTeamId` + `decidedByPenalties` to `setMatchResult`.
4. **src/lib/admin/match-results.ts** — `setMatchResult` accepts optional
   `advancerTeamId` + `decidedByPenalties`; writes them; `clearMatchResult`
   resets them + `correctWinner`.
5. **src/lib/scoring.ts**
   - `evaluateKnockoutPrediction` → additive model above; take per-stage
     `{advance, outcome, exact}` and actual `{homeScore, awayScore, advancerTeamId}`.
   - `getKnockoutPointsForQuiniela` → return `{advance,outcome,exact}` per stage
     from new ScoreRule keys (fallback to DEFAULT_KNOCKOUT_POINTS table).
   - KO branch of `recomputePredictionsForMatch` → pass advancer + true score.
   - `propagateBracketWinner` → use `match.advancerTeamId` (fallback to score) so
     penalty results propagate correctly.
6. **prisma/seed.ts** — replace the single `knockout-winner` ScoreRule per stage
   with three keys: `knockout-advance`, `knockout-outcome`, `knockout-exact`
   (18 rows). Non-destructive upsert (does not touch scores).
7. **UI** — knockout pick card already captures score + penalty winner (no
   change to input). Add graded KO display: show advancer, "Penales" tag, and
   per-layer colour (advance / outcome / exact). Mirror on the bracket/preview.

## Rules consistency
- Group stage unchanged (outcome 2 / exact 5, exact replaces outcome).
- Knockout is the only place where layers stack additively.

## Migration / safety
- Nullable Match fields → safe additive migration.
- Re-seed is non-destructive to existing scores; only ScoreRule rows change.
- On VPS: `seed.ts` must stay self-contained (runner image has no `src/`) — the
  KO points table lives inline in seed, mirrored by scoring.ts defaults.

## Timing & bracket resolution (group end 27th → R32 starts 28th)

**Constraint:** R32 matchups are unknowable until the last group game grades
(late 27th): they need the 12 winners, 12 runners-up, and the 8 best third-placed
teams ranked across all groups. So the window before the first R32 game (28th) is
inherently short — same as real life. We cannot show real R32 teams "days before".

**Current gap:** there is NO group→R32 resolver. R32 matches are seeded with R16
feeds only; `propagateBracketWinner` handles KO→KO but never fills R32 from group
results. This must be built — it is what opens KO predictions.

**Approach (recommended):**
1. **`resolveGroupsIntoR32()`** (new, in scoring.ts):
   - Runs when the last group match grades. Hook it into the grading cascade
     (`setMatchResult` after `recomputeGroupOrderBonuses`) and/or the autograder
     cron, guarded by "all 72 group matches FINAL" so it only fires once.
   - Computes each group's final order (reuse `buildStandingsFromMatches`),
     takes winners + runners-up + ranks the 12 third-placed teams, then assigns
     them to the 16 R32 slots via the **official FIFA 2026 slot-allocation table**
     (incl. the best-thirds combination map). Writes `homeTeamId`/`awayTeamId`
     into the R32 matches. Idempotent.
   - Fires within ~10 min of the last group game → KO predictions open
     automatically, no manual step.
2. **Progressive by nature:** KO is already match-by-match. R16+ teams fill in as
   each prior round grades (`propagateBracketWinner`). The pick card already shows
   "Por confirmar" until both teams are set, then accepts a prediction.
3. **Locking:** keep the existing **per-match KO lock = kickoff − 1h**. Do NOT use
   one shared KO deadline (KO spans ~3 weeks). Consequence:
   - R32 games on the 28th: a few hours' window (unavoidable).
   - Every later match: progressively more time.
4. **Mitigate the tight day-1 window:**
   - Show an "¡Octavos abiertos!" banner + (PWA) notification the moment R32
     resolves, so people jump in immediately.
   - Optional: a guaranteed-minimum window for 28th R32 games — lock them at
     `min(kickoff − 1h, R32_resolved_at + N hours)` is NOT possible (can't extend
     past kickoff); the only real lever is resolving ASAP (covered by #1).

**Rejected:** predicting on placeholder slots ("1A vs 2B") before teams are known
— the advancer pick needs a real team, third-place placement isn't final until the
end anyway, and it confuses users. Predict on resolved teams only.

## Out of scope (mention only)
- Champion / top-scorer BonusPick rewards (separate `BonusPick` model already exists).
