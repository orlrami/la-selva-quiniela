# Live Bracket with Confirmed-Position Locks — Plan

Date: 2026-06-20
Status: Approved direction (decisions locked below)
Extends: `2026-06-17-knockout-scoring-design.md` (this builds the missing
`resolveGroupsIntoR32()` and the correct standings engine that gates it).

## Goal
Show the knockout bracket "as it stands" while the group stage is still in
progress. As each group game grades, recompute group standings and:
- fill R32 slots with the teams currently occupying each qualifying position,
- mark a team **🔒 confirmed** when its position is mathematically permanent,
- show contested slots as **"En disputa"** with the list of teams that can still
  land there.

Updates happen **after each game grades** (no live in-match API — accepted).

## Locked decisions (from user, 2026-06-20)
1. **Conservative locks** — a position is locked only if guaranteed in every
   remaining-result scenario with tiebreakers assumed *against* the team. Never
   shows a false permanent lock; may show 🔒 one game later than a fan would.
2. **Internal standings** — no visible group tables. Standings are computed
   behind the scenes and surface only as bracket fill + locks + candidates.
3. **Group-position locks only** (1st / qualified-top-2 / eliminated).
   Best-thirds are **not** locked; contested third slots show "En disputa" + the
   candidate teams that could fill them.
4. **Skip fair-play tiebreaker** (no card data stored) — fall back to
   `Team.fifaRank`. Revisit only if a real group tie ever reaches that step.

## FIFA 2026 tiebreakers (verified — judgemate.com + espn.com)
**Within a group** (head-to-head BEFORE overall GD — changed from 2018/2022):
1. Points
2. H2H points (matches among the still-tied teams only)
3. H2H goal difference
4. H2H goals scored
5. Overall goal difference
6. Overall goals scored
7. Fair-play / conduct score  *(skipped — no data; see decision 4)*
8. FIFA world ranking  *(no more drawing of lots)*

Subset re-application rule: when a criterion splits only some of the tied teams,
the criteria restart from the top for the teams that remain tied.

**Third-placed teams across groups** (no H2H — never met):
Points → overall GD → overall goals → fair-play *(skipped)* → FIFA ranking.

## Current state / gaps
- Two divergent standings fns use the wrong order `pts→GD→GF→alphabetical`:
  `scoring.ts:buildStandingsFromMatches` (powers GroupOrderBonus) and
  `predictions/data.ts:buildTeamStandings`. Both replaced by one engine.
- R32 matches seeded with R16 feeds only (`R32-1..16`); no group→R32 mapping
  exists anywhere. Must encode the official 2026 bracket pairings.
- `setMatchResult` (`admin/match-results.ts:32`) is the single grading cascade —
  both admin UI and autograder route through it. Hook the R32 resolver there.
- No card/conduct fields on `Team` (only `fifaRank`). Confirms decision 4.

## Build steps
1. **Standings engine** — `src/lib/standings/group-standings.ts`:
   `computeGroupStandings(matches, teamsMeta)` implementing the FIFA 2026 chain
   incl. subset re-application + fifaRank fallback. Pure, unit-tested. Replace
   both existing call sites. (Note: GroupOrderBonus scoring now uses real
   tiebreakers — a deliberate correctness change, flagged to user.)
2. **Clinch / lock** — `computeGroupClinch(group)`: enumerate remaining W/D/L
   scenarios (≤3^6, trivial), conservative rule —
   - locked top-K iff in every scenario `|{rivals with pts ≥ team.pts}| < K`,
   - eliminated iff in every scenario `|{rivals with pts > team.pts}| ≥ 2`.
   Also returns per-position candidate sets (teams appearing in that position in
   ≥1 scenario) for the "En disputa" UI.
3. **R32 mapping + resolver** — encode official 2026 R32 slot → group position
   table (12 winners, 12 runners-up, 8 thirds + the best-thirds combination map).
   `resolveR32Slots()` writes locked teams into R32 `homeTeamId/awayTeamId`,
   leaves contested slots null + exposes candidates. Idempotent. Hook into
   `setMatchResult` after `recomputeGroupOrderBonuses`, guarded.
4. **Bracket UI** — `bracket/page.tsx` + `bracket-match.tsx`: locked team solid +
   🔒 + tooltip ("Confirmado 1° Grupo A"); provisional greyed; contested slot
   "En disputa" + candidate chips. Mobile-first (390px).
5. **Preview** — scenario seed (some groups FINAL, some half-played) + run
   existing docker-compose stack to view it. Preview-only, not prod seed.

## Risks
- The R32 pairing + best-thirds combination table is the one fiddly correctness
  bit — source from FIFA/Wikipedia, unit-test against a known scenario.
- Clinch logic is the most likely place for a subtle bug — dedicated tests.
- Changing the shared standings order also changes GroupOrderBonus grading
  (more correct, but a scoring behavior change — confirmed acceptable).
