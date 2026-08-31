# Plan: Brokerage Prefund Modeler rewrite

**Created**: 2026-07-22
**Status**: Complete
**Plan file**: `plans/brokerage-prefund-modeler-rewrite.md`
**Spec source**: `Master-Plan/notebook/estate-planning/notes/prefund-brokerage-description.txt` + user clarifications (2026-07-22)

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| R1 | Target balance at each child's age 21 is a fixed real amount in year-0 dollars (default $200,000). | User Q1 |
| R2 | Model year 0 = whichever comes first: funding year or first child's birth year. | User Q2 |
| R3 | Every child receives a separate lump-sum deposit at the same funding year (nominal dollars); no per-birth deposits. | User Q3 |
| R4 | Per-child deposit amounts differ so each child hits the same real target at age 21, accounting for birth spacing and funding timing. | User Q4 |
| R5 | Market growth from funding to age 21 uses exactly `(birthYear + 21) − fundingYear` compounding periods — not 22. | User Q5 |
| R6 | Real balances in outputs are deflated to year 0 via CPI. | User Q6 |
| R7 | CPI and nominal market return are constant for the full horizon; no taxes or fees. | User Q7 |
| R8 | Rewrite `apps/brokerage-prefund-modeler/` in place; old "prefund at year 0 / deposit at birth" model is a degenerate case. | User Q8 |
| R9 | Birth spacing is one equal interval between consecutive children. | User Q9 |
| R10 | Reported fund amounts (per child and total) are nominal dollars at the funding year. | User Q10 |
| R11 | Output table spans funding year through last child's age-21 year; row label is model-year offset from funding year (negative rows allowed before funding when year 0 precedes funding). | Original spec |
| R12 | Table columns show each child's nominal balance with real (year-0) in parentheses, matching existing app formatting. | Existing UI convention |

## Model (canonical)

Inputs:

| Input | Meaning |
|-------|---------|
| `childCount` | Number of grandchildren (≥ 1) |
| `childSpacingYears` | Whole years between consecutive births (≥ 0) |
| `fundingYearDelta` | Funding year minus first birth year. Negative = fund before first birth; zero = same year; positive = fund after first birth. |
| `targetRealAtAge21` | Real target at age 21, year-0 dollars |
| `cpiRate` | Constant annual CPI |
| `marketRate` | Constant annual nominal return |

Derived timeline (all in model years):

```
firstBirthYear = max(0, -fundingYearDelta)
fundingYear    = max(0, fundingYearDelta)
birthYear(i)   = firstBirthYear + i * childSpacingYears   // i = 0 … childCount−1
maturityYear(i)= birthYear(i) + 21
lastModelYear  = max maturityYear across children
```

Per child `i`:

```
nominalTarget(i) = targetRealAtAge21 * (1 + cpiRate) ** maturityYear(i)
growthPeriods(i) = maturityYear(i) - fundingYear          // must equal 21 when birth=fund=year 0
deposit(i)       = nominalTarget(i) / (1 + marketRate) ** growthPeriods(i)   // nominal at funding year
```

Year-end balance projection for model year `y` (when `y >= fundingYear`):

```
balanceNominal(i, y) = deposit(i) * (1 + marketRate) ** (y - fundingYear)
balanceReal(i, y)    = balanceNominal(i, y) / (1 + cpiRate) ** y
```

Table rows: `y` from `fundingYear` to `lastModelYear`; row label = `y - fundingYear` (delta from funding year).

Degenerate case (old app): `fundingYearDelta ≤ 0` with `fundingYear = 0` reproduces prefund-before-birth behavior. `fundingYearDelta = 0`, one child → single deposit at birth year 0.

## Tasks

### Wave 1 — Calculator core

- [x] **1.1** Replace `CalculatorInputs`: drop `yearsBeforeFirstBirth`; add signed `fundingYearDelta`. Update `constants.ts` defaults (`fundingYearDelta: 0`, keep existing rate/target defaults).
  - Verify: `grep yearsBeforeFirstBirth apps/brokerage-prefund-modeler/src/` returns no matches; `CalculatorInputs` exports `fundingYearDelta`.
  - Reqs: R2, R8

- [x] **1.2** Implement timeline helpers: `firstBirthYear`, `fundingYear`, `birthYearForChild`, `maturityYearForChild`, `lastModelYear`.
  - Verify: Unit-style assertions in a new `calculator.test.ts` (or inline dev checks): delta `−3` → fund 0, birth 3; delta `+2` → fund 2, birth 0; delta `0` → both 0.
  - Reqs: R2, R9

- [x] **1.3** Rewrite deposit math: `nominalTargetAtMaturity`, `requiredDepositAtFunding` using `growthPeriods = maturityYear − fundingYear` (no `+ 1`). Remove `prefundAtYear0`, `requiredDepositAtBirth`, `standaloneSingleChildDeposit`.
  - Verify: One child, all years 0, target $200k real, CPI 3.2%, market 10.3% → `growthPeriods === 21`; age-21 nominal real balance equals target within rounding.
  - Reqs: R1, R4, R5, R10

- [x] **1.4** Rewrite `calculate()` outputs: per-child `depositAtFunding`, `birthYear`, `balanceAt21Nominal/Real`; totals `totalFundedNominal` (sum at funding year). Drop `requiredPrefund`, `requiredPrefundReal`, `depositAtBirth`, `prefundAtYear0`.
  - Verify: 3 children, spacing 2, fund year 0 → three distinct deposits; sum equals `totalFundedNominal`; each child `balanceAt21Real` ≈ target.
  - Reqs: R3, R4, R10

- [x] **1.5** Rewrite `projectAccountRows`: rows from `fundingYear` to `lastModelYear`; include `deltaFromFunding = modelYear − fundingYear`; real via `deflateToStart(..., modelYear)`; omit pre-funding years or show dashes only in render layer.
  - Verify: delta `+2`, 2 children → first table row delta `0` at model year 2; last row delta equals `lastModelYear − fundingYear`.
  - Reqs: R6, R11, R12

### Wave 2 — UI and wiring
> Depends on: Wave 1

- [x] **2.1** Update `index.html` form: replace "Years before first birth" with signed "Funding vs first birth (years)" — negative fund early, positive fund late, 0 same year. Update field hints and hero copy for new timeline anchor.
  - Verify: Form renders signed input; default 0; min/max sensible (e.g. −30 … +30).
  - Reqs: R2, R8

- [x] **2.2** Update `main.ts` `readInputs()`: parse signed integer `fundingYearDelta`; remove `yearsBeforeFirstBirth` clamp to ≥ 0.
  - Verify: Enter `−3` in form → `readInputs().fundingYearDelta === −3`.
  - Reqs: R2

- [x] **2.3** Rewrite `render.ts`: summary shows total funded at funding year (nominal) and per-child breakdown; per-child table columns `Birth year`, `Deposit at funding year`, `Balance at age 21`; account table row header `Δ from funding` (or equivalent label) with delta values; footnotes describe year-0 anchor and nominal-at-funding reporting.
  - Verify: Manual — negative delta shows funding before birth in summary; positive delta shows funding after first birth; totals match calculator.
  - Reqs: R10, R11, R12

- [x] **2.4** Preserve localStorage input persistence with updated field names; migrate or drop stale `yearsBeforeFirstBirth` key gracefully.
  - Verify: Change inputs, reload page — values persist; no console errors from missing fields.
  - Reqs: R8

### Wave 3 — Verification and docs
> Depends on: Wave 2

- [x] **3.1** Add `calculator.test.ts` with scenario matrix (minimum):
  - Single child, delta 0 (sanity + 21-period check)
  - Fund 3 years before first birth (delta −3)
  - Fund 2 years after first birth (delta +2), spacing 2, 2 children
  - Old degenerate: delta −5, spacing 2, 3 children (fund year 0, births 5/7/9)
  - Verify: `npm test` or `npx vitest run` in app package — all scenarios pass.
  - Reqs: R1–R7, R9, R10

- [x] **3.2** Build app: `npm run build` from repo root or app directory succeeds; spot-check dist output.
  - Verify: Build exits 0; open dev/preview — results update live on input change.
  - Reqs: R8

- [x] **3.3** Final requirement walkthrough
  - Verify: Checklist — each R1–R12 confirmed against running app and tests; note any intentional deviations in Notes.
  - Reqs: R1–R12

## Notes

> Decisions, blockers, and discoveries made during execution.

- 2026-07-22: Year-0 anchor = `min(fundingYear, firstBirthYear)` encoded as `firstBirthYear = max(0, −delta)`, `fundingYear = max(0, delta)`.
- 2026-07-22: Growth-period bug in current code — `TARGET_AGE + 1` and loop `age 0…21` apply 22 compounds; fix is `maturityYear − fundingYear` (21 when birth=fund=0).
- 2026-07-22: Old input `yearsBeforeFirstBirth` maps to `fundingYearDelta = −yearsBeforeFirstBirth` when migrating saved localStorage.
- 2026-07-22: Deposits sit in separate notional accounts from funding year; balances grow even before a child is born.
- 2026-07-22: No tax/fee modeling — out of scope per R7.
- 2026-07-22: Account table starts at model year 0 (not only funding year) so Δ from funding is negative when funding follows first birth; pre-funding cells show —.
- 2026-07-22: Real balances at maturity match target within ±$2 due to USD rounding on inflate/deflate/compound.
- 2026-07-22: Execution complete — 8 vitest tests pass; app build succeeds.
