# Plan: Estate trust picker

**Created**: 2026-07-14  
**Status**: Superseded — see [`trust-intent-picker.md`](trust-intent-picker.md)  
**Plan file**: `plans/trust-picker.md`

> **Abandoned.** The implementation-facet picker shipped in `estate-trusts` was deleted 2026-07-14. Use `trust-intent-picker.md` for the intent-facet redesign and locked test cases.

## Analysis (read first)

### What the notebook already gives you

`notebook/estate-planning/notes/glossary-and-trust-types.md` is already a facet matrix:

- **~24 trust / plan types** with the same facet rows (Also called, Revocable, Crummey, Basis step-up, Marital deduction, GST, Spendthrift, See-through IRA, etc.).
- **5 group headings** that map cleanly to category chips: Probate/everyday · Married-couple estate-tax · Descendant/control · Lifetime irrevocable · Charitable.
- **`apps/estate-trusts`** already syncs that note, splits it into per-type pages under `/estate-trusts/trusts/{slug}/`, and lists groups in `TRUST_TYPES` (`routes.mjs`).

So the picker is not inventing taxonomy — it is making the existing facet tables **queryable**.

### Why it is not “just filter the markdown”

Facet *cells* are prose, not enums:

| Facet | Example values in source |
|-------|--------------------------|
| Crummey powers | `No` · `Yes — typical…` · `Sometimes` · `Common for…` · `Rare` |
| Basis step-up | `At grantor's death` · `no second step-up` · `Carryover` · `N/A` |
| Marital deduction | `Yes` · `No` · `N/A while grantor alive` · conditional |

A checkbox UI needs a **normalized facet schema** (enums / booleans / multi-select) plus optional `detail` prose for display. Prose stays the human explanation; enums drive matching.

### Product shape (recommended)

Two complementary selection modes on one page (`/estate-trusts/picker/`):

1. **Category chips** — one or more of the five groups (marital vs charitable vs lifetime, etc.). Empty = all groups.
2. **Feature facets** — toggles/selects for individual properties (Crummey, step-up at grantor death, marital deduction, GST/dynasty, see-through IRA, revocable, inter vivos, etc.).

**Matching model (decided):** soft score, not pure AND — with **explicit miss display**.

- Selected **group**: hard filter (must be in selected groups if any selected).
- Selected **features**: each match adds score.
- Pure AND of every feature quickly returns empty sets (e.g. marital deduction + Crummey + dynasty).
- Results sorted by score; each result shows **matched** facets and **selected-but-missing** facets (e.g. “Has: Crummey · Missing: marital deduction”) so soft ranking never hides gaps.
- Link to existing trust page.

**Not a recommender / advisor.** Same disclaimer as the rest of the site: educational only. Picker surfaces types that *deal with* selected facets — it does not say “you should use X.”

### Architecture (recommended)

Stay inside **`estate-trusts`** (static site + small client JS), not a new Vite modeler:

| Layer | Role |
|-------|------|
| Notebook MD | Canonical narrative + facet prose (unchanged primary authoring) |
| `trust-facets.json` (or `.mjs` data module) | Machine-readable enums per slug; curated, versioned with app |
| Build (`build.mjs`) | Emit `/picker/index.html` + embed/copy JSON; keep linking to `/trusts/{slug}/` |
| Client JS | Filter/score UI; no server |

Avoid parsing free-text facet cells at runtime as the sole source — too brittle. Prefer: **author curated JSON once**, with a build check that every `TRUST_TYPES` slug has a facets record, and optionally a script that diffs prose tables vs JSON keys for drift.

Alternative considered and deferred: full React modeler like `illinois-estate-tax-modeler`. Heavier than needed for checkbox → ranked list.

### Pickable facet set (v1 proposal)

Curate a subset that is both useful and enum-stable. Leave “Also called”, “Key tradeoff”, “Primary purpose”, “Typical beneficiaries” as display-only (search/text), not checkboxes.

| Facet key | Control | Enum / values |
|-----------|---------|----------------|
| `groups` | multi chip | existing `TRUST_TYPES.group` strings |
| `revocable` | tri-state or Yes/No/Any | `yes` · `no` · `na` |
| `whenCreated` | multi | `during_life` · `at_death` · `at_first_spouse_death` |
| `interVivos` | Yes/No/Any | `inter_vivos` · `testamentary` · `either` |
| `maritalDeduction` | Yes/No/Any | `yes` · `no` · `na` |
| `usesEstateExclusion` | Yes/No/Any | `yes` · `no` · `partial` |
| `inSurvivorsEstate` | Yes/No/Any | `yes` · `no` · `depends` |
| `basisStepUp` | multi | `at_grantor_death` · `at_survivor_death` · `carryover_only` · `na` |
| `crummey` | Yes / Sometimes / No / Any | `yes` · `sometimes` · `no` |
| `gstDynasty` | Yes/Core/No/Any | `core` · `yes` · `no` |
| `spendthrift` | Yes/No/Any | `yes` · `no` · `limited` |
| `seeThroughIra` | Yes/No/Any | `yes` · `no` · `na` |
| `incomeTax` | multi | `grantor` · `trust_1041` · `pass_through` |

**UI grouping of feature controls (v1):** cluster checkboxes under headings so the full set stays scannable — e.g. Timing & form · Tax / estate · Basis & gifts · Beneficiary / protection. Categories (the five trust groups) stay as chips above.

“Charitable” is a **group**, not a facet — CRT/CLT already sit under Charitable trusts.

### UX sketch

```
[ Category chips: Everyday | Marital tax | Descendants | Lifetime irrev. | Charitable ]

Features (grouped)
  Timing & form     ☐ Revocable  ☐ Inter vivos  ☐ During life / at death …
  Tax / estate      ☐ Marital deduction  ☐ Uses exclusion  ☐ In survivor's estate
  Basis & gifts     ☐ Step-up at grantor death  ☐ Step-up at survivor  ☐ Crummey
  Beneficiary       ☐ GST / dynasty  ☐ Spendthrift  ☐ See-through IRA  ☐ Income tax …

Results (N) — sorted by match strength
  ILIT
    Has: Crummey · Missing: marital deduction
    [Open type page →]
  Portability-only plan  (plan — not a trust)
    Has: … · Missing: …
```

URL query params for shareable selections (`?g=…&f=crummey,gst`).

### Risks / design traps

1. **AND emptiness** — mitigate with soft score + “clear one facet” hints when zero results.
2. **Overlap / aliases** — QTIP vs C trust vs marital; portability is “not a trust.” Include with `isTrust: false` and a visible badge.
3. **Nuance loss** — “Sometimes Crummey” must not equal “Yes”; use three-way.
4. **Source drift** — JSON vs MD facet prose diverge; need sync check in Wave 1.
5. **Scope creep** — wizard (“Are you married? IL tax?”) is a different product; keep picker facet-driven unless requirements expand.

## Decisions (Q&A)

| # | Decision |
|---|----------|
| Q1 | Soft score + hard group filter. **Each result must show matched vs selected-but-missing facets.** |
| Q2 | Curated `trust-facets.json` (or `.mjs`) + build drift check — do not scrape prose enums at runtime. |
| Q3 | Include portability-only in results; badge as “plan (not a trust)” (`isTrust: false`). |
| Q4 | Full proposed facet set; feature controls **grouped** under UI section headings. |
| Q5 | App lives in `cloudflare-apps/apps/estate-trusts` as `/picker/` (not a separate package). Plan doc stays in `plans/trust-picker.md`. |
| Q6 | **No goal presets in v1** (no “IL marital tax” / “IRA to kids” shortcut buttons). Defer unless requested later. |

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| R1 | User can select trust **categories/groups** and see matching types | conversation |
| R2 | User can select individual **feature facets** (Crummey, step-up, etc.) and see types that deal with them | conversation |
| R2a | Soft-ranked results show **matched** and **selected-but-missing** facets per result | conversation 2026-07-14 |
| R3 | Results link to existing `estate-trusts` trust-type pages | conversation / existing app |
| R4 | Facet data stays aligned with notebook `glossary-and-trust-types.md` | notebook as SoT for prose |
| R5 | Educational disclaimer; not legal/tax advice | existing site voice |
| R6 | Page ships inside `apps/estate-trusts` (`/picker/`); nav + deploy with that app | conversation |
| R7 | Shareable/filterable URL state for selected facets | plan recommendation |
| R8 | Q1–Q6 decided before UI implementation | plan |
| R9 | Feature controls presented in **grouped** sections (full facet set) | conversation 2026-07-14 |

## Tasks

### Wave 1 — Facet data model & alignment
> No UI yet. Unblocks everything.

- [x] **1.1** Resolve open questions Q1–Q6 with user; record answers in Notes
  - Verify: Notes section lists decided values for Q1–Q6
  - Reqs: R8
  - Done 2026-07-14 (Q3 confirmed: include portability, badge non-trust)

- [x] **1.2** Define `TrustFacetRecord` schema (TypeScript typedef or JSDoc): slug, group, isTrust, enums for each pickable facet, optional `labels` / `detail` snippets; document UI facet **groups**
  - Verify: Schema file exists under `apps/estate-trusts/src/` (e.g. `facets-schema.mjs` or `facets.d.ts`) documenting every enum + control groupings
  - Reqs: R2, R4, R9

- [x] **1.3** Author `trust-facets.json` (or `.mjs`) for all `TRUST_TYPES` slugs with curated enums derived from current facet tables
  - Verify: Record count === `TRUST_TYPES.length`; script or assert in build fails if slug missing
  - Reqs: R1, R2, R4

- [x] **1.4** Add build-time (or `npm run check:facets`) drift check: every trust page heading/slug present; optional warn if MD facet row labels change
  - Verify: `node apps/estate-trusts/src/check-facets.mjs` (or build hook) exits 0 on current data; fails when one slug removed from JSON
  - Reqs: R4

### Wave 2 — Matching logic (pure, testable)
> Depends on: Wave 1

- [x] **2.1** Implement `matchTrusts(selection, catalog)` → ranked hits with `{ matched[], missing[] }` per result (soft score + hard groups)
  - Verify: Node assertions — `{ features: ['crummey'] }` ranks ILIT above RLT and RLT lists Crummey in `missing`; `{ groups: ['Charitable trusts'] }` returns CRT+CLT only
  - Reqs: R1, R2, R2a

- [x] **2.2** Encode URL ↔ selection serialize/parse (`?g=&f=`)
  - Verify: Round-trip: parse(serialize(sel)) deep-equals sel for sample selections
  - Reqs: R7

### Wave 3 — Picker page in estate-trusts
> Depends on: Wave 2

- [x] **3.1** Build `/estate-trusts/picker/` page: chrome, disclaimer, category chips, **grouped** feature controls, results with matched + missing + links to `/trusts/{slug}/`
  - Verify: `npm run build` in `apps/estate-trusts` emits `dist/picker/index.html`; toggle Crummey + marital deduction — ILIT shows Crummey matched and marital missing
  - Reqs: R1, R2, R2a, R3, R5, R6, R9

- [x] **3.2** Wire nav: add Picker to site chrome (Trusts section or top-level); link from trusts index
  - Verify: Home and `/trusts/` contain link to picker; picker nav highlights correctly
  - Reqs: R6

- [x] **3.3** Style with existing `theme.css` / `site.css` patterns; mobile usable (chips wrap, grouped controls, results readable)
  - Verify: Manual narrow viewport — controls and results usable without horizontal scroll traps
  - Reqs: R6

### Wave 4 — Polish & verification
> Depends on: Wave 3

- [x] **4.1** Empty-state copy when zero matches after hard group filter (“relax a category”); clear-all control
  - Verify: Select empty-intersecting groups (if possible) or clear features — empty/clear behaviors work
  - Reqs: R2

- [x] **4.2** Sync path documented: after editing notebook glossary facets, update JSON enums (or checklist in `sync.mjs` README comment)
  - Verify: Short comment or `apps/estate-trusts/README` note describes sync order: notebook → sync MD → update facets JSON → build
  - Reqs: R4

- [x] **4.3** Final verification against all requirements
  - Verify: Walk R1–R9; Q3 decided; build green; picker demos category + feature + miss display
  - Reqs: R1–R9

## Out of scope (this plan)

- Legal/tax recommendation engine or “which trust should I use” wizard
- Editing trust content in the picker (still MD → build)
- New trust types not already in the glossary
- Illinois estate-tax modeler integration (can deep-link later)

## Notes

> Decisions, blockers, and discoveries made during execution.

- 2026-07-14: Idea validated against existing facet tables; data is strong but prose-valued — needs enum layer. Home: `apps/estate-trusts` `/picker/`.
- 2026-07-14: User answers — soft + show misses; curated JSON; full grouped facets; app under `cloudflare-apps/apps`; no presets v1.
- 2026-07-14: Q3 confirmed — include portability-only; badge “plan (not a trust)” via `isTrust: false`.
- 2026-07-14: Implemented — picker at `/estate-trusts/picker/`; data in `trust-facets.mjs`; `npm run check:facets` in build.
