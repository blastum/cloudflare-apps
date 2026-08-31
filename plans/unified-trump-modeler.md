# Plan: Unified Trump Account Modeler (calendar years)

**Created**: 2026-08-13
**Status**: Complete
**Plan file**: `plans/unified-trump-modeler.md`

Merge `trump-account-modeler`, `trump-account-modeler-deluxe`, and `trump-prefund-modeler` into one app at `/trump-account-modeler/`. Drive contribution caps, seed, and contribution windows from **calendar years**, not model-year 0. Dynasty stays deleted.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| R1 | One public Trump app. Modes: one child vs several children. One-child lump-sum sidecar (deluxe) is a checkbox, not a separate app. | conversation 2026-08-13 |
| R2 | Roth conversion + IRA projection stay on the one-child path (unique value of the basic app). | existing `trump-account-modeler` |
| R3 | Several-children path sizes one lump-sum pot that pays each child’s statutory contributions until empty (today’s prefund modeler). | existing `trump-prefund-modeler` |
| R4 | Timeline is calendar years. First private contribution year is `max(2026, birthYear)` (accounts open tax year 2026; statute: no contribs before 2026-07-04). Last contribution year is the calendar year the child turns 17. | IRC §530A; user “real years” |
| R5 | Private contribution cap is **$5,000** in 2026 and 2027. For tax years **after 2027**, index $5,000 by the user’s CPI assumption using the statutory shape: §1(f)(3) COLA with base calendar year **2026**, round **down to $100**. | IRC §530A(b); user |
| R6 | One-time **$1,000** federal pilot seed if birth date is in **2025-01-01 … 2028-12-31**. Does not count toward the $5,000 cap. No seed outside those birth years (including 2026–2027 contribution years for a 2024 or 2029 birth). | IRC / Form 4547; IRS trumpaccounts.gov |
| R7 | Seed is deposited in the child’s first contribution year (2026 for 2025 births; birth year for 2026–2028 births). Shown as its own line, no basis (same as today’s “federal pilot”). | conversation + existing starting-balance treatment |
| R8 | Every child has **birth year and birth month**. No “months between children.” No “fund in year” offset from first birth. Several-children: add/remove children, each with their own date. Child 0 required. | conversation |
| R9 | Lump-sum **funding year** is a calendar year (default 2026). Pot/sidecar pays only contributions on or after that year. | conversation + existing prefund `fundInYear` |
| R10 | Roth/IRA tax uses 2026 single brackets and standard deduction, inflated by CPI from **2026**, not from “starting age.” Conversion year = calendar year the child turns 18. | existing tax.ts, adapted to calendar years |
| R11 | Old URLs redirect: `/trump-prefund-modeler/` → several-children mode; `/trump-account-modeler-deluxe/` → one-child with lump-sum on. Then delete those two app folders. | consolidation suggestion |
| R12 | Home page: one Trump tile. Drop the separate Lump-Sum Trump tile. README matches. | consolidation suggestion |

## Statute (checked 2026-08-13)

User recollection vs text:

- **Cap years:** user is right. $5,000 is nominal for 2026 and 2027. Indexing starts for taxable years **after 2027** (first indexed year = **2028**).
- **Index formula:** §530A uses §1(f)(3) substituting **calendar year 2026** for 2016, round down to $100. §1(f)(3) COLA for a calendar year uses the **preceding** calendar year’s CPI vs the base. Model with constant CPI `r`:

```
cap(Y) = 0                         if Y < 2026
cap(Y) = 5000                      if Y in {2026, 2027}
cap(Y) = floor100(5000 * (1+r)^(Y-2027))   if Y >= 2028
```

So 2028 reflects **one** year of inflation (2027 vs 2026), not two. This is an approximation (C-CPI-U vs user’s long-run CPI). Document that in the UI hint.

- **Seed:** not “2026 and 2027 contribution years.” Pilot is **births after 2024-12-31 and before 2029-01-01** (2025–2028). $1,000 once, excluded from the private cap. Can be claimed any time during the growth period; we pin it to first contribution year (R7).
- **Growth period:** child has not turned 18 before year-end. Last private contribution year = `birthYear + 17`. Birth month is collected for display/order; eligibility uses calendar year of the 17th birthday (Dec 31 edge cases ignored).
- **2026 is a short contribution window** (Jul 4–Dec 31) but the **annual cap is still $5,000**. Keep a year-grained model; footnote the July 4 start.

Sources: 26 USC §530A (uscode.house.gov); Form 4547 instructions; IRS Trump Accounts page; CRS R48910.

## Target UI

Keep the existing calculator chrome. Replace the input grid.

```
[ One child | Several children ]

Each child:
  Birth year (number)   Birth month (select 1–12)
  [Add child]  (several mode)

Shared:
  Funding year (calendar; default 2026)     — several always; one-child only if lump-sum on
  [x] Contribute the statutory max each year
      else: Annual contribution ($) min’d against that year’s cap
  [x] Include $1,000 pilot seed if birth-eligible     (one-child; several applies per child)
  Average CPI (%)     Average market growth (%)

One child only:
  [ ] Pay contributions from a funding-year lump sum
```

Drop: starting age, months-between, fund-in-year offset, year-0 contribution max as the inflation base, deluxe-only URL.

Results:

- Tables keyed by **calendar year** (and age).
- One child: year table (contrib, optional funding-account column, Trump balance, real $), Roth conversion scenarios, IRA if unconverted. Seed row in first contrib year.
- Several: required lump sum, per-child PV / funded years / missed-if-funded-late, pot by calendar year.

## Model (canonical)

Per child `i` with `birthYear`, `birthMonth`:

```
firstContribYear(i) = max(2026, birthYear)
lastContribYear(i)  = birthYear + 17
seedEligible(i)     = 2025 <= birthYear <= 2028
seedYear(i)         = firstContribYear(i)     // only if seedEligible and checkbox on
```

Private contribution in calendar year `Y` (if `firstContribYear <= Y <= lastContribYear` and `Y >= fundingYear` when lump-sum/pot applies):

```
cap(Y) as above
amount(Y) = min(userAmount or cap(Y), cap(Y))
```

Starting Trump balance: seed in `seedYear` (not a user “starting balance” field). No seed → start at 0.

Lump-sum / pot: PV at `fundingYear` of remaining private contribs (not seed). Withdraw-then-grow, pot empty after last funded contrib. Real $ deflated to **2026** (not birth year 0).

Roth: conversion starts in `birthYear + 18`. Brackets/deduction inflate `conversionYear - 2026` years.

A child already 18+ in 2026 has an empty schedule (valid; show a short empty state).

## Tasks

### Wave 1 — Statute helpers + tests (no UI)

- [x] **1.1** Add vitest to `apps/trump-account-modeler` (mirror `trump-prefund-modeler`: `vitest` + `"test": "vitest run"`).
  - Verify: `npm test` in that app runs (even if zero tests yet).
  - Reqs: R5, R6

- [x] **1.2** New `src/statute.ts`: `CONTRIBUTION_START_YEAR = 2026`, `CAP_INDEX_START_YEAR = 2028`, `SEED_BIRTH_YEARS = {min: 2025, max: 2028}`, `SEED_AMOUNT = 1000`, `BASE_CAP = 5000`, `floorTo100`, `privateCap(year, cpiRate)`, `seedEligible(birthYear)`, `firstContributionYear(birthYear)`, `lastContributionYear(birthYear)`, `seedYear(birthYear)`, `ageAtYearEnd(birthYear, calendarYear)`.
  - Verify: unit tests — `privateCap(2026|2027, any) === 5000`; `privateCap(2028, 0.1) === 5500`; `privateCap(2028, 0.032)` rounds **down** to $100; `privateCap(2025, *) === 0`; seed true for 2025 and 2028, false for 2024 and 2029; last year for birth 2009 is 2026; first year for birth 2024 is 2026; first year for birth 2027 is 2027.
  - Reqs: R4, R5, R6, R7

### Wave 2 — One-child calculator on calendar years
> Depends on: Wave 1

- [x] **2.1** Replace `CalculatorInputs`: `birthYear`, `birthMonth`, `fundingYear`, `contributeMax`, `annualContribution`, `includeSeed`, `enableLumpSum`, `cpiRate`, `marketRate`. Drop `startingAge`, `startingBalance`, `contributionInflationIndexed`.
  - Verify: `CalculatorInputs` in `calculator.ts` has those fields; grep finds no `startingAge` / `startingBalance` / `year0ContributionMax`.
  - Reqs: R4, R8, R9

- [x] **2.2** Rewrite one-child projection: calendar-year rows from `min(fundingYear, firstContribYear, seedYear)` through last contrib year (and through IRA ages when not converting). Seed in `seedYear` as a non-cap deposit with no basis. Private contribs use `privateCap`. Lump-sum column from deluxe (`requiredPrefundAmount` / withdraw-then-grow) when `enableLumpSum`, PV of **private** contribs on/after `fundingYear` only.
  - Verify: tests — born 2026-01, seed on, max contrib, no lump-sum: 2026 row has seed 1000 + contrib 5000; born 2024: no seed, contribs 2026 … 2041 (turns 17 in 2041); born 2029: no seed, first contrib 2029; lump-sum PV matches Σ C_y / (1+r)^(y−fundingYear).
  - Reqs: R2, R4, R5, R6, R7, R9

- [x] **2.3** Point Roth/IRA at calendar years: inflate 2026 brackets by `year - 2026`; conversion start = `birthYear + 18`. Keep existing scenario table (1-year vs multi-year).
  - Verify: tests — born 2026 → conversion year 2044; bracket inflation years = 18; born 2016 → conversion 2034, inflation years = 8.
  - Reqs: R10

### Wave 3 — Several-children pot
> Depends on: Wave 2

- [x] **3.1** Port prefund pot math onto calendar years: inputs `children: {birthYear, birthMonth}[]` (length ≥ 1), same shared rates/funding year. Per-child PV, combined withdrawals by calendar year, pot rows until empty. Flag children whose entire schedule is before `fundingYear` as missed.
  - Verify: move/adapt tests from `trump-prefund-modeler/src/calculator.test.ts` — two kids born 2026-01 and 2027-07, fund 2026, indexed caps; later child’s 2027 contrib equals the statutory cap for 2027 ($5000), not a CPI-from-birth amount. `npm test` in trump-account-modeler covers both one-child and several.
  - Reqs: R3, R4, R5, R8, R9

### Wave 4 — Unified UI
> Depends on: Wave 3

- [x] **4.1** Rewrite `index.html` + `main.ts` + `render.ts` + CSS for the target UI. Segmented control One / Several. Child list with year + month; add/remove (several). Defaults: one child, birth **2026-01**, funding year **2026**, contribute max on, seed on, lump-sum off, CPI 3.2%, market 10.3%. `?mode=several` and `?lump=1` for redirects.
  - Verify: `npm run build` in the app. Manual: one child 2026-01 shows 2026 seed + $5k; switch to several, add 2028-06 child, funding 2026, required lump sum updates; month select exists for every child.
  - Reqs: R1, R8, R9, R11

- [x] **4.2** Copy: hero + hints stating $5k for 2026–27, CPI index from 2028 ($100 steps, model CPI not C-CPI-U), $1k seed for births 2025–2028, contributions from tax year 2026 (window opens Jul 4, 2026).
  - Verify: those facts appear in `index.html` or rendered footnotes; no “year 0” / “prefund” / “18 contribution years from starting age”.
  - Reqs: R4, R5, R6

### Wave 5 — Cut over old apps and home
> Depends on: Wave 4

- [x] **5.1** Add Pages `_redirects` copied to `dist/` root by `scripts/build.mjs` (not under `dist/public/`):

```
/trump-prefund-modeler/          /trump-account-modeler/?mode=several  301
/trump-prefund-modeler           /trump-account-modeler/?mode=several  301
/trump-account-modeler-deluxe/   /trump-account-modeler/?lump=1         301
/trump-account-modeler-deluxe    /trump-account-modeler/?lump=1         301
```

  - Verify: after `npm run build`, `dist/_redirects` exists with those four lines.
  - Reqs: R11

- [x] **5.2** Delete `apps/trump-prefund-modeler/` and `apps/trump-account-modeler-deluxe/`. `npm install` to refresh the lockfile. Remove their home tile (lump-sum) and deluxe is already unlisted. Keep one Trump tile; update tag/description for calendar years + lump-sum-for-several. Update root `README.md` Apps list.
  - Verify: `ls apps | grep trump` is only `trump-account-modeler`; home `index.html` has one Trump card; README does not list deluxe or prefund as apps.
  - Reqs: R1, R11, R12

### Wave 6 — Final verification
> Depends on: Wave 5

- [x] **6.1** Walk R1–R12. `npm test` in `trump-account-modeler`. `npm run build` at repo root succeeds. Spot-check: 2026/2027 cap $5000; 2028 cap rounded down $100; seed only 2025–2028 births; birth month on child 0 and added children; old URLs documented in `_redirects`.
  - Verify: each R* has a matching test, file, or home/redirect artifact as above.

## Notes

> Decisions, blockers, and discoveries made during execution.

- 2026-08-13: Seed is **birth years 2025–2028**, not contribution years 2026–2027. Cap freeze is 2026–2027; index starts 2028.
- 2026-08-13: Birth month collected for every child (not only child 0). Annual eligibility still uses calendar year (`birthYear + 17`).
- 2026-08-13: Real dollars and tax inflation anchor to **calendar 2026**, not first birth.
- 2026-08-13: Employer $2,500 sub-limit and “qualified general contributions” (gov/charity, uncapped) are **out of scope**.
- 2026-08-13: Do not revive dynasty / multi-generation.
