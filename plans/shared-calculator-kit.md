# Plan: Shared calculator kit

**Created**: 2026-08-15
**Status**: Complete
**Plan file**: `plans/shared-calculator-kit.md`

Native `<input type="number">` spinners on Safari (and some Chrome) fire `input` on pointerdown and repeat until pointerup. Replacing results DOM in that window steals pointerup, so the stepper sticks or ignores the next click. `shared/defer-form-paint.ts` exists and three apps use it; five still paint on every `input`, and Safari often never fires `pointerdown` on the spinner arrows, so the defer helper still misses. Fix this once with shared controls, not per-app patches.

Stay vanilla TypeScript + HTML-string mounts. Do not add a framework. Apps keep their own `calculator.ts` (the question each app answers). Shared code is chrome, growth math, and export.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| R1 | Number increment/decrement works on Cloudflare (Safari/Chrome): paint only after pointerup; no stuck stepper | conversation; CONVENTIONS.md |
| R2 | Rate/inflation fields always show one decimal (3.2, 10.3), step 0.1, no float junk | conversation |
| R3 | Child add/remove is one component; per-row Remove matches Trump Account Modeler | conversation |
| R4 | CPI + market growth fields, defaults (3.2 / 10.3), and compound/inflate/deflate math live in `shared/` | conversation; inventory note |
| R5 | Print toolbar + print CSS are shared; PDF generation (jsPDF) is liftable from Trust Fund Kid | conversation |
| R6 | Reset restores named defaults, clears that app’s storage keys, re-renders children/lists | conversation |
| R7 | CONVENTIONS.md documents the kit; new apps import it; no new copies of money/spinner/child-list | CONVENTIONS.md |

## Tasks

### Wave 1 — Stepper + rate field (the production bug)

- [x] **1.1** Shared number stepper: hide native spinners (`appearance: textfield`); `−` / `+` buttons with `setPointerCapture`; hold-to-repeat; paint callback only on pointerup/cancel (and on typed `change` / Enter). Keep `type="number"` for min/max/keyboard.
  - Verify: File exists `shared/stepper.ts` + `shared/styles/controls.css`. Click-and-hold +/− does not replace results until release. Rapid clicks both directions both apply.
  - Reqs: R1

- [x] **1.2** Rate field helper on top of the stepper: `step=0.1`, display `toFixed(1)`, parse/round to one decimal. Integer stepper variant for years/counts (`step=1`).
  - Verify: `bindRateField(input)` then programmatically step 3.2 → 3.3 → 3.2; `input.value` is `"3.3"` / `"3.2"`, never `"3.3000000004"`.
  - Reqs: R2

- [x] **1.3** Wire steppers on **Trump Account Modeler** first (rates + funding year + child spacing). Keep `bindLiveForm` as a safety net for leftover number inputs.
  - Verify: `npm run build`; local Pages preview; Safari (or WebKit) click CPI/market spinners 10× each direction; results update after release; next click is not stuck.
  - Reqs: R1, R2

### Wave 2 — Growth fields, reset, child list

> Depends on: Wave 1

- [x] **2.1** `shared/growth.ts`: `roundUsd`, `inflate`, `deflate`, `growYears`, `realFactor`; `DEFAULT_CPI_PCT = 3.2`, `DEFAULT_MARKET_PCT = 10.3`. `shared/money.ts` as the one formatter (`formatCurrency`, `formatPct` → one decimal, `formatNominalReal`, `formatMonthYear`).
  - Verify: Small unit test file `shared/growth.test.ts` (or first app that already has Vitest) covers inflate/deflate round-trip and `formatPct(0.032) === "3.2%"`.
  - Reqs: R4

- [x] **2.2** `mountGrowthFields(form)` or static HTML snippet + `bindGrowthFields(form)` for the CPI / market pair (labels, hints, rate steppers, defaults). Trust Fund Kid switches to 3.2 / 10.3 unless a comment documents otherwise.
  - Verify: Trump, child-brokerage, pot-trust, prefund, growth-factor, trust-fund-kid all show 3.2 / 10.3 after reset.
  - Reqs: R2, R4

- [x] **2.3** `bindCalculatorReset({ form, storageKeys, fieldDefaults, onReset })`: clear keys, write defaults, call `onReset` (children), then paint.
  - Verify: Trump Reset restores funding year, 3.2, 10.3, one child; localStorage key gone; results match a fresh load.
  - Reqs: R6

- [x] **2.4** `mountChildList(container, { mode: "birth-date" \| "month-zero", ... })`. Anchor row cannot be removed. Extra rows: spacing input (integer stepper) + per-row Remove (Trump behavior, not pot-trust “pop last”). Add child button included. `onChange` syncs state without replacing the focused row.
  - Verify: Trump uses it unchanged in UX. Pot trust Remove deletes that row, not always the last child. Adding a child does not steal focus from an open stepper.
  - Reqs: R3

### Wave 3 — Adopt kit in remaining finance apps

> Depends on: Wave 2

- [x] **3.1** Child-brokerage + pot-trust: steppers, growth fields, reset helper; pot-trust children via `mountChildList`. Delete per-app copies of the child-row HTML/handlers.
  - Verify: Both apps: spinner hold/release on Cloudflare preview; child Remove is per-row; Reset works.
  - Reqs: R1, R3, R6

- [x] **3.2** Brokerage-prefund, growth-factor-table, trust-fund-kid, Illinois estate: replace `form.addEventListener('input', render)` with steppers + `bindLiveForm`. Fix prefund `label > input` wrapping to `.form-field` + `label for`.
  - Verify: Grep `addEventListener('input', render)` in `apps/` returns no calculator paints (currency-input formatter is fine).
  - Reqs: R1, R7

- [x] **3.3** Sourdough: integer/0.1/0.5 steppers + `bindLiveForm` only (no growth/child kit). Same spinner contract.
  - Verify: Hydration stepper does not stick in Safari preview.
  - Reqs: R1

### Wave 4 — Print, PDF, conventions

> Depends on: Wave 3

- [x] **4.1** `bindPrintToolbar(results, { summarySelector })` + `shared/styles/print.css` (`.no-print`, print heading/footer, hide inputs). Apps keep their results HTML; they stop copying print button JS and `@media print` blocks.
  - Verify: Trump Print summary still opens the browser dialog and hides chrome. Pot-trust worksheet print mode still works (app-specific class hook is OK).
  - Reqs: R5

- [x] **4.2** Lift Trust Fund Kid `export-download.ts` to `shared/pdf.ts` (brand header, tables, Latin-1 sanitizing). App passes an `ExportDocument`. Other apps may keep `window.print()`; PDF is available without copy-paste.
  - Verify: Trust Fund Kid PDF still downloads; `apps/trust-fund-kid-modeler/src/export-download.ts` is a thin wrapper or gone.
  - Reqs: R5

- [x] **4.3** Update `CONVENTIONS.md`: steppers required; import from `shared/`; child list; growth defaults; reset; print. Point `apps/README.md` at the kit. Remove or re-export leftover `apps/*/src/shared/money.ts`.
  - Verify: `rg "src/shared/money" apps` is empty or re-exports from `../../../shared/money`.
  - Reqs: R7

### Wave 5 — Verification

> Depends on: Wave 4

- [x] **5.1** Final check against all requirements
  - Verify: `npm run build` succeeds. Safari/WebKit: every finance app CPI/market stepper hold-release; Trump and pot-trust child add/remove; Reset on Trump and pot-trust; one print path; Trust Fund Kid PDF. Walk R1–R7.
  - Reqs: R1–R7

## Notes

> Decisions, blockers, and discoveries made during execution.

- 2026-08-15: `bindLiveForm` is necessary but not sufficient. Safari spinner arrows often never send `pointerdown` on the input, so the pointer set stays empty and a mid-hold paint still steals pointerup. Custom ± buttons with pointer capture are the real fix.
- 2026-08-15: Apps still painting on every `input`: brokerage-prefund, growth-factor-table, trust-fund-kid, illinois-estate-tax, sourdough. Apps already on `bindLiveForm`: trump-account, child-brokerage, lump-sum-trust-group.
- 2026-08-15: Do not merge models. Shared kit is controls + growth math + export. Prefund childCount+equal-spacing stays a simple pair of integer fields unless we later switch it to the child list.
- 2026-08-15: Trust Fund Kid 3.0 / 10.0 is the only rate outlier; treat as a bug and align to 3.2 / 10.3.
- 2026-08-15: Kit shipped. Custom `−`/`+` steppers with pointer capture; `bindLiveForm` kept as safety net. Deployed to Cloudflare Pages production (`smirking-cat-software`).
