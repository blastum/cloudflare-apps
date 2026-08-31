# Plan: Trust clause taxonomy and picker quality

**Created**: 2026-08-20  
**Status**: Complete  
**Plan file**: `plans/trust-clause-taxonomy-and-picker.md`  
**Builds on**: `plans/trust-intent-picker.md` (intent-first UX — do not revert to legal-enum picker)  
**Canonical prose**: `estate-planning-trust-reference/notebook/estate-planning/notes/glossary-and-trust-types.md`

---

## Problem

The trust explorer (`apps/_trust-intent-picker/`) and the deployed calculators model trusts at the **type** level (pot, Crummey, QTIP, etc.) with **18 glossary facet rows** per type. That basis is incomplete for clause-level attributes users and attorneys actually discuss:

- Distribution standards (HEMS vs liberal vs pure discretion) are collapsed into one intent checkbox.
- Administrative clauses (decanting, in terrorem, trustee removal, tax apportionment, incentive provisions) are absent from schemas — some appear only in notebook prose or the ABA glossary.
- **Grantor-trust income tax status** is conflated with **revocable control** (`access_grantor_control`).
- State-specific vehicles (e.g. Michigan **enhanced life estate / lady bird deed**) are not in the catalog at all.
- Glossary sync to the app expects a broken path (`NotebookLinkManager/...`); generated data may be stale.

The abandoned implementation-facet picker (`plans/trust-picker.md`) failed because legal attributes are **not orthogonal**. This plan adds exhaustive **clause coverage in the technical layer** while keeping the **intent-first primary UI**.

---

## Design principles (non-negotiable)

1. **Primary picker stays intent-based** — plain-language goals, curated mappings (`intent-schema.mjs`, `intent-mappings.mjs`).
2. **Clauses live in the technical layer** — per-type facet tables, glossary entries, and optional collapsed “clause checklist” on result pages. Not 40 legal checkboxes on the home screen.
3. **Three layers, explicit separation**:
   - **Trust type** — catalog entry (25 today: `pot`, `crummey-trust`, `qtip`, …).
   - **Type attributes** — properties that describe the whole instrument (revocable, inter vivos, grantor-trust for income tax, marital deduction eligibility).
   - **Clauses / provisions** — optional or typical language blocks (Crummey powers, spendthrift, HEMS standard, POA, decanting, …). A type may **typify** a clause without **requiring** it; values are `typical` | `optional` | `unusual` | `no` | `n/a`, not boolean-only.
4. **Lifecycle transitions are not static clauses** — e.g. pot → separate shares at maturity is a **phase** or **caveat**, not a pot-trust checkbox (lesson from 2026-07-14 failure).
5. **Notebook is source of truth** — app consumes generated JSON; do not fork prose in Cloudflare-apps.

---

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| R1 | Produce an **exhaustive clause & attribute taxonomy** covering the user's list plus gaps discovered in ABA/ISBA/notebook sources (incl. lady bird / enhanced life estate where relevant) | User query |
| R2 | Document **coverage matrix**: each clause × each trust type (typical / optional / unusual / no / n/a) with one-line rationale | User query |
| R3 | Extend **glossary facet tables** (notebook) beyond 18 rows so clause-level attributes are first-class | User query |
| R4 | Add missing **glossary term entries** (decanting, in terrorem, incentive clause, tax apportionment, ascertainable vs discretionary, lady bird deed, …) | User query |
| R5 | **Regenerate** `trust-pages.json` and static trust pages from notebook via fixed sync script | Broken sync path |
| R6 | **Intent mappings** reflect clause reality — e.g. HEMS vs liberal discretion vs pure discretion as distinct access intents where they change recommendations | User query |
| R7 | Result UI shows **matched clauses** (technical `<details>`) without requiring users to know IRC vocabulary to get useful ranked types | trust-intent-picker spec |
| R8 | **Scenario tests** locked in `check-intent-mappings.mjs` still pass; add tests for new access/clause-sensitive scenarios | trust-intent-picker spec |
| R9 | Trust picker **deployed** to staging (remove `_` prefix or add to build) with cross-links from estate apps | Workspace integration |
| R10 | Calculators (`lump-sum-trust-group-modeler`, `trust-fund-kid-modeler`) cross-link to picker pages for **pot** and **Crummey/separate-share** context — no calculator rewrite required in this plan | Scope boundary |

---

## Target clause catalog (seed list)

User-provided clauses (must all appear in taxonomy R1 with definitions):

| ID | Clause / attribute | Notes |
|----|-------------------|--------|
| C01 | Crummey withdrawal rights | Notice + temporary withdrawal for annual exclusion |
| C02 | Pot / spray / sprinkle | Shared pool; trustee allocates by need |
| C03 | Separate-share | Fixed slice / sub-trust per beneficiary |
| C04 | Spendthrift | Anti-alienation; creditor/divorce protection |
| C05 | HEMS / ascertainable standard | Health, education, maintenance, support |
| C06 | Pure discretionary distributions | Trustee discretion without ascertainable standard |
| C07 | Power of appointment | General vs limited; testamentary vs inter vivos |
| C08 | Decanting provision | Move to new trust with different terms |
| C09 | Incentive clauses | School, employment, sobriety, etc. |
| C10 | Trustee removal / replacement | Beneficiary or trust protector powers |
| C11 | In terrorem / no-contest | Penalty for challenging trust |
| C12 | GST exemption allocation | Lock GST status / inclusion ratio language |
| C13 | QTIP / marital deduction | Spouse income for life; 706 marital deduction |
| C14 | Tax apportionment | Who pays estate / GST / generation tax |
| C15 | Dynasty / perpetual | Duration / rule against perpetuities |
| C16 | Grantor-trust vs non-grantor | **Income tax** status (IRC §§ 671–679), not revocability |
| C17 | See-through / conduit / accumulation | IRA beneficiary trust rules |
| C18 | Special / supplemental needs | SNT; preserve public benefits |
| C19 | Ascertainable vs fully discretionary | Cross-cutting distribution taxonomy (C05 vs C06) |

**Type attributes** (orthogonal to clauses but currently under-modeled):

| ID | Attribute | Notes |
|----|-----------|--------|
| A01 | Revocable vs irrevocable | Grantor can revoke/amend? |
| A02 | Inter vivos vs testamentary | Already in glossary |
| A03 | When created | Life / death / first spouse death |
| A04 | Beneficiary pool structure | Pooled vs separate (related to C02/C03) |

**State / non-trust vehicles** (separate annex — not trust types but users ask):

| ID | Vehicle | Notes |
|----|---------|--------|
| S01 | Lady bird / enhanced life estate deed | Michigan-style retained control + automatic transfer at death; deed not trust |
| S02 | Illinois RAP / perpetual trust duration | Already partially in dynasty caveats |

**Research additions** (expect to add during Wave 1 — not exhaustive yet):

- Hanging Crummey / 5-and-5 safe harbor  
- Trust protector / directed trust  
- Mandatory income vs discretionary principal  
- Unitrust / payout percentage (CRT)  
- Pecuniary vs fractional funding formulas  
- SECURE Act 10-year / eligible designated beneficiary  
- Illinois estate tax apportionment (Form 700 context)  
- Third-party vs first-party SNT  
- General vs limited vs testamentary POA  

---

## Gap snapshot (today)

| Item | Notebook glossary | trust-pages.json / picker |
|------|-------------------|---------------------------|
| Crummey, pot, separate share, spendthrift, GST, QTIP, dynasty, SNT, see-through | Partial (facet rows) | Partial |
| HEMS / ascertainable vs discretionary | Term in `estate-planning-glossary.md`; not a facet row | One intent: `access_discretionary_needs` (“HEMS-style”) |
| Grantor-trust income tax | “Income tax” facet | Conflated with `access_grantor_control` |
| POA, decanting, in terrorem, incentive, trustee removal, tax apportionment | Missing or ABA-only | Missing |
| Lady bird deed | Missing | Missing |

---

## Tasks

### Wave 1 — Research and taxonomy (foundation)

- [x] **1.1** Inventory current picker + glossary state: read `_trust-intent-picker` modules, `trust-pages.json`, and `glossary-and-trust-types.md`; produce a one-page **gap table** (clause × present/missing/partial).
  - Verify: File `notebook/estate-planning/notes/trust-clause-taxonomy-draft.md` exists with gap table and “sources consulted” list.
  - Reqs: R1

- [x] **1.2** Mine authoritative sources for clause definitions: `estate-planning-glossary.md`, `aba-estate-planning-glossary.md`, James C. Blasius trust review tracker (distribution/POA/spendthrift sections), `five-vessels-funding-architecture.md`, ISBA/Illinois materials in notebook, external Michigan lady bird deed summary (add source doc to notebook if needed).
  - Verify: Every C01–C19 and A01–A04 has a **definition paragraph** and **see also** links in the draft taxonomy file.
  - Reqs: R1, R4

- [x] **1.3** Classify each item as **type attribute**, **clause**, **phase/transition**, or **non-trust vehicle**; document non-orthogonality rules (e.g. Crummey + separate share common together; pot → separate share is a phase).
  - Verify: Taxonomy file has a “Classification” column; at least 5 documented **interaction rules** (when two labels apply to one real plan).
  - Reqs: R1

- [x] **1.4** Build **coverage matrix** draft: 25 trust types × (C01–C19 + key attributes). Use enum `typical | optional | unusual | no | n/a`.
  - Verify: Matrix is a table in the taxonomy file; each row sum checked against one real trust type section in glossary (spot-check 5 types: crummey-trust, pot, qtip, snt, rlt).
  - Reqs: R2

### Wave 2 — Notebook / glossary extension
> Depends on: Wave 1

- [x] **2.1** Extend “How to read the facet tables” in `glossary-and-trust-types.md` with new rows: **Distribution standard**, **Power of appointment**, **Decanting**, **In terrorem**, **Trustee removal**, **Incentive provisions**, **Tax apportionment**, **GST allocation detail** (or split existing GST row). Keep tables readable — move long prose to `estate-planning-glossary.md`.
  - Verify: Facet legend lists ≥ 25 rows; old 18 rows still present for backward compatibility.
  - Reqs: R3

- [x] **2.2** Fill new facet cells for all 25 trust types in `glossary-and-trust-types.md` using Wave 1 matrix.
  - Verify: `rg "Distribution standard" glossary-and-trust-types.md` hits all type sections; no empty cells where `typical` or `optional` in matrix.
  - Reqs: R2, R3

- [x] **2.3** Add glossary entries for missing terms (decanting, in terrorem, incentive trust clause, tax apportionment, lady bird deed, trust protector, discretionary vs ascertainable). Link from quick-reference clusters.
  - Verify: Each new term has an entry in `estate-planning-glossary.md`; lady bird deed entry notes **deed ≠ trust** and Illinois/Michigan relevance.
  - Reqs: R4

- [x] **2.4** Add notebook annex `notebook/estate-planning/notes/state-specific-estate-vehicles.md` for S01/S02 (lady bird, IL duration) so trust picker can link without polluting trust-type catalog.
  - Verify: File exists; linked from glossary index.
  - Reqs: R1, R4

### Wave 3 — App data model and sync
> Depends on: Wave 2

- [x] **3.1** Fix `apps/_trust-intent-picker/scripts/sync-glossary.mjs` to read glossary from workspace path (`estate-planning-trust-reference/notebook/...` or env-configurable); document in script header.
  - Verify: `node apps/_trust-intent-picker/scripts/sync-glossary.mjs` succeeds from repo root without manual symlink.
  - Reqs: R5

- [x] **3.2** Extend sync to emit **clause facets** into `trust-pages.json`: `{ id, label, value, group: "clause" | "attribute" }` per type, parsed from extended facet tables.
  - Verify: `trust-pages.json` includes keys for C01–C19; sample type `crummey-trust` shows Crummey = typical, spendthrift = typical.
  - Reqs: R3, R5

- [x] **3.3** Add `clause-schema.mjs` — canonical list of clause IDs, labels, groups, short descriptions (generated or hand-maintained; single source for UI labels).
  - Verify: Module exports 19+ clauses; IDs match taxonomy C01–C19.
  - Reqs: R3

- [x] **3.4** Update static trust pages (`public/trusts/*/index.html` or render template) to show grouped **Attributes** vs **Clauses** in technical section.
  - Verify: Open `public/trusts/pot/index.html` locally — new facet rows visible.
  - Reqs: R7

### Wave 4 — Intent layer refinement
> Depends on: Wave 1 (matrix), Wave 3 (clause data)

- [x] **4.1** Split access intents in `intent-schema.mjs`:
  - `access_hems_ascertainable` — HEMS / ascertainable standard  
  - `access_liberal_discretionary` — generous support, not a tight cage (Heather-style)  
  - `access_pure_discretion` — trustee wide latitude  
  - Rename/clarify `access_grantor_control` → revocable-amendment control only; add `tax_grantor_trust_income` only if needed in technical view, **not** as primary intent unless user testing says otherwise.
  - Verify: Schema exports new IDs; UI group “Access and distributions” has 3 distinct distribution intents.
  - Reqs: R6

- [x] **4.2** Update `intent-mappings.mjs` for all types affected by distribution split; add caveats where liberal vs HEMS both appear in real plans (five-vessels architecture).
  - Verify: `node apps/_trust-intent-picker/src/check-intent-mappings.mjs` passes.
  - Reqs: R6, R8

- [x] **4.3** Add scenario tests:
  - TC-4: Heather-style — spouse beneficiary + liberal/spendthrift + creditor protection → marital/discretionary types rank, not Crummey.  
  - TC-5: Grandchild pot with HEMS at maturity → pot + child-age-stage, caveat on phase to separate share.  
  - TC-6: IRA to trust → conduit/accumulation top ranks; `constraint_ira_assets` hard filter.
  - Verify: All TC-1–TC-6 pass in check script.
  - Reqs: R8

- [x] **4.4** Result renderer (`render.ts`): show **Clause highlights** — for selected intents, list which C* clauses typically implement them (read-only, from mapping helper).
  - Verify: Select `fund_annual_gift_exclusion` + `structure_fixed_slice` → Crummey result shows C01 + C03 badges in technical section.
  - Reqs: R7

### Wave 5 — Deploy and integration
> Depends on: Wave 3, Wave 4

- [x] **5.1** Promote app for build: rename `_trust-intent-picker` → `trust-intent-picker` (or add to `scripts/build.mjs` allowlist); add home tile + umbrella nav entry.
  - Verify: `npm run build` includes `/trust-intent-picker/` in `dist/`; `npm run staging` deploys it.
  - Reqs: R9

- [x] **5.2** Cross-links: Pot Trust Modeler + Trust Fund Kid Modeler → relevant trust type pages and picker with pre-filled `?i=` URLs.
  - Verify: Links present in app footers or help panels; pot → `pot` + structure intents; kid modeler → `crummey-trust`.
  - Reqs: R10

- [x] **5.3** Link picker from `five-vessels-funding-architecture.md` (notebook) as reference tool for vessel 4 (pot → spendthrift) and vessel 5 (Heather spendthrift).
  - Verify: Markdown link to staging/prod picker URL with example query string.
  - Reqs: R10

### Wave 6 — Final verification
> Depends on: Wave 5

- [x] **6.1** Walk requirements R1–R10 with checklist; fix any gaps.
  - Verify: Each R* has a “done” note in Notes section below with evidence link or command output.
  - Reqs: R1–R10

---

## Architecture sketch

```
User intents (29+ checkboxes)
        │
        ▼
intent-mappings.mjs ──► ranked trust types + caveats
        │
        ▼
trust-pages.json ◄── sync ── glossary-and-trust-types.md
   ├── type attributes (A*)
   └── clauses (C*)     ◄── estate-planning-glossary.md
        │
        ▼
Result page: plain-language why + technical <details> clauses
```

**Do not** wire C* clauses as independent scoring dimensions in v1 — they inform display, glossary completeness, and future “advanced mode” only.

---

## Notes

> Decisions, blockers, and discoveries made during execution.

- 2026-08-20: Plan created. Current app is `apps/_trust-intent-picker/` (not deployed). Supersedes facet-picker approach in `plans/trust-picker.md` for UI; reuses its enum *ideas* for technical layer only.
- 2026-08-20: Lady bird deed is a **deed**, not a trust type — document in state annex; optional link from RLT page (“alternative to probate for real estate”).
- 2026-08-20: `access_discretionary_needs` label “HEMS-style” is insufficient for five-vessels design (liberal + spendthrift for Heather). Wave 4 split required.
- 2026-08-20: **Executed (YOLO).** App renamed `apps/trust-intent-picker/` (builds to `/trust-intent-picker/`). Clause matrix in `src/clause-coverage.mjs`; sync reads notebook at `~/.cursor/activities/estate-planning-trust-reference`. TC-1–TC-6 pass. Local dev: `npm run dev` → http://localhost:8788/trust-intent-picker/
