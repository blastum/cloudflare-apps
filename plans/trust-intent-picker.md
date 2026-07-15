# Spec: Trust intent picker (agent handoff)

**Created**: 2026-07-14  
**Status**: Ready for implementation  
**Supersedes**: `plans/trust-picker.md` (implementation-facet approach — abandoned)  
**Plan file**: `plans/trust-intent-picker.md`

---

## Read this first (agent)

You are building (or redesigning) a **trust-type explorer** for estate planning education. The previous attempt failed. **Do not repeat it.**

<table>
  <thead>
    <tr><th>Do</th><th>Do not</th></tr>
  </thead>
  <tbody>
    <tr><td>Use <strong>intent facets</strong> — plain-language goals the user actually has</td><td>Expose legal/tax implementation labels as primary UI checkboxes (inter vivos, Crummey, separate_share, etc.)</td></tr>
    <tr><td>Curate a <strong>mapping table</strong>: intent selection → ranked trust types + why</td><td>Let users combine orthogonal legal enums and hope scoring works</td></tr>
    <tr><td>Lock <strong>scenario tests</strong> in code before shipping</td><td>Iterate facet enums in chat and redeploy until something "feels right"</td></tr>
    <tr><td>Show legal detail on <strong>result pages</strong> (optional "technical view")</td><td>Require users to know terms like Crummey or inter vivos to get useful results</td></tr>
    <tr><td>Educational disclaimer — surfaces structures that <em>deal with</em> stated goals</td><td>Present as legal/tax advice or "you should use X"</td></tr>
  </tbody>
</table>

**Current repo state (2026-07-14):**
- `apps/estate-trusts/` was **deleted** from `cloudflare-apps` and removed from the live site.
- Canonical trust-type prose remains in the notebook: `NotebookLinkManager/notebook/estate-planning/notes/glossary-and-trust-types.md`
- Old plan `plans/trust-picker.md` documents the abandoned implementation-facet design for archaeology only.

---

## Problem statement

Users do not think in trust-taxonomy. They think in goals:

> "I want a trust for my grandchildren, funded with the annual gift exemption, with each grandchild having their own slice."

> "I want a trust for my wife that shields part of my estate from Illinois tax, lets her take what she needs, and passes to my child when she dies."

The abandoned picker asked for **implementation facets** (inter vivos, testamentary, Crummey, separate share, pot, dynasty, etc.). Results kept changing every time a facet was "fixed" because:

1. **Legal attributes are not orthogonal** — the same real-world structure spans multiple labels; one label spans multiple structures.
2. **`either` / `sometimes` enums** created whack-a-mole — tightening one filter broke another scenario.
3. **Lifecycle complexity** — e.g. pot → divide into separate shares at a milestone is a transition, not a static checkbox.
4. **Overlapping catalog entries** — "separate share trust" vs "Crummey trust" vs "dynasty" vs "pot" fight for the same user intent.

**Verdict:** Correctable with human-designed intent facets + curated mappings. **Not** fixable by a smarter model iterating legal enums.

---

## Product shape (recommended)

### Intent-first picker

One page (or wizard-lite flow) where the user selects **goal facets** in plain language. Results show:

- Ranked trust type(s) from the glossary
- **Matched intents** — which goals this structure addresses
- **Gaps / tradeoffs** — which selected intents are only partially met
- **Why** — one paragraph in plain language
- **Technical detail** (collapsed) — inter vivos, Crummey, etc. for readers who want it
- Link to full trust-type write-up (glossary page or rebuilt static page)

### Matching model

```
User intent selection  →  curated intent→type mapping  →  ranked results + caveats
```

- **Soft score** across selected intents (not pure AND of everything).
- Each result shows **matched** and **selected-but-missing** intents.
- Optional **hard filters** only where unambiguous (e.g. "must be revocable" disqualifies irrevocable types).

### Where it lives

Options for implementer (pick one with user):

| Option | Path | Notes |
|--------|------|-------|
| New slim app | `apps/trust-intent-picker/` or revive `estate-trusts` with new UX only | Static site + small client JS; sync glossary from notebook |
| Notebook artifact | `notebook/estate-planning/projects/.../documents/` | Reference tool, no deploy |
| Illinois modeler adjunct | Link from existing estate apps | Only if scope stays tiny |

Default recommendation: **new slim static app** under `cloudflare-apps`, glossary as read-only source, intent data in curated `.mjs` module.

---

## Intent facet schema (v1 proposal)

Facets are **user-meaningful goals**, not IRC vocabulary. Group in the UI under headings below.

### Who benefits

| Facet ID | Label | Values |
|----------|-------|--------|
| `beneficiary_spouse` | My spouse | boolean |
| `beneficiary_children` | My children | boolean |
| `beneficiary_grandchildren` | My grandchildren | boolean |
| `beneficiary_descendants` | Descendants generally (bloodline) | boolean |
| `beneficiary_charity` | Charity | boolean |
| `beneficiary_one_person` | One named person only | boolean |

*Multi-select allowed — e.g. spouse first, then child as remainder.*

### When it starts

| Facet ID | Label | Values |
|----------|-------|--------|
| `start_during_life` | While I'm alive | boolean |
| `start_at_my_death` | When I die | boolean |
| `start_at_first_spouse_death` | When the first spouse dies | boolean |

### How I fund it

| Facet ID | Label | Values |
|----------|-------|--------|
| `fund_annual_gift_exclusion` | Annual gift tax exemption ($19k/donee; gift-splitting OK) | boolean |
| `fund_lifetime_exemption` | Lifetime gift/estate exemption | boolean |
| `fund_at_death` | Assets from my estate at death | boolean |
| `fund_life_insurance` | Life insurance premiums | boolean |

### Structure among beneficiaries

| Facet ID | Label | Values |
|----------|-------|--------|
| `structure_shared_pool` | Shared pool — trustee balances by need (pot) | boolean |
| `structure_fixed_slice` | Fixed slice per person — own account/share | boolean |
| `structure_one_beneficiary` | Single beneficiary only | boolean |
| `structure_class_grows` | Class can grow (e.g. future grandchildren) | boolean |

### Tax goals

| Facet ID | Label | Values |
|----------|-------|--------|
| `tax_illinois_estate` | Reduce Illinois estate tax | boolean |
| `tax_federal_estate` | Reduce federal estate tax | boolean |
| `tax_gst_multigen` | Multi-generation / GST planning | boolean |
| `tax_not_primary` | Tax planning is not the main goal | boolean |

### Access and distributions (while trust is active)

| Facet ID | Label | Values |
|----------|-------|--------|
| `access_discretionary_needs` | Beneficiary/trustee takes what's needed (HEMS-style) | boolean |
| `access_fixed_income` | Fixed or mandated income | boolean |
| `access_staged_ages` | Staged principal at ages (e.g. 25/30/35) | boolean |
| `access_grantor_control` | I want to change my mind later / retain control | boolean → implies revocable, disqualifies most irrevocable gifts |

### Remainder / what happens next

| Facet ID | Label | Values |
|----------|-------|--------|
| `remainder_to_spouse` | Then to spouse | boolean |
| `remainder_to_children` | Then to my children | boolean |
| `remainder_to_grandchildren` | Then to grandchildren | boolean |
| `remainder_per_stirpes` | Deceased child's share to their descendants | boolean |

### Optional constraint chips

| Facet ID | Label | Values |
|----------|-------|--------|
| `constraint_ira_assets` | Must work with inherited IRA / see-through rules | boolean |
| `constraint_special_needs` | Beneficiary has special needs / government benefits | boolean |
| `constraint_creditor_protection` | Strong creditor/spendthrift protection | boolean |

---

## Curated mapping (starter)

Implementer maintains `intent-mappings.mjs` (or similar). Example rows — **human-reviewed, not LLM-generated at runtime**:

<table>
  <thead>
    <tr><th>Trust type (glossary slug)</th><th>Strong when these intents selected</th><th>Weak / partial</th><th>Does not fit</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>crummey-trust</code> (Crummey irrevocable gift trust)</td>
      <td><code>start_during_life</code>, <code>fund_annual_gift_exclusion</code>, <code>structure_fixed_slice</code>, <code>beneficiary_grandchildren</code> or <code>beneficiary_children</code></td>
      <td><code>tax_gst_multigen</code>, <code>access_staged_ages</code>, <code>structure_class_grows</code></td>
      <td><code>start_at_my_death</code>, <code>fund_at_death</code>, <code>beneficiary_spouse</code>, <code>tax_illinois_estate</code> as primary</td>
    </tr>
    <tr>
      <td><code>separate-share</code> (testamentary separate share / two-pot at death)</td>
      <td><code>start_at_my_death</code>, <code>structure_fixed_slice</code>, <code>fund_at_death</code></td>
      <td><code>beneficiary_grandchildren</code>, <code>access_staged_ages</code></td>
      <td><code>fund_annual_gift_exclusion</code>, <code>start_during_life</code></td>
    </tr>
    <tr>
      <td><code>pot</code></td>
      <td><code>structure_shared_pool</code>, <code>structure_class_grows</code>, <code>access_discretionary_needs</code></td>
      <td><code>fund_annual_gift_exclusion</code> (lifetime Crummey pot exists but messy), <code>structure_fixed_slice</code> after division only</td>
      <td><code>structure_fixed_slice</code> during pot phase</td>
    </tr>
    <tr>
      <td><code>b-trust</code> (bypass / credit shelter)</td>
      <td><code>start_at_first_spouse_death</code>, <code>beneficiary_spouse</code> (income/lifetime), <code>remainder_to_children</code>, <code>tax_illinois_estate</code>, <code>tax_federal_estate</code>, <code>access_discretionary_needs</code></td>
      <td><code>access_fixed_income</code></td>
      <td><code>fund_annual_gift_exclusion</code>, <code>start_during_life</code></td>
    </tr>
    <tr>
      <td><code>qtip</code> / <code>marital</code></td>
      <td><code>beneficiary_spouse</code>, <code>start_at_first_spouse_death</code>, <code>access_discretionary_needs</code>, <code>remainder_to_children</code></td>
      <td><code>tax_illinois_estate</code> (marital deduction defers tax, may not shield)</td>
      <td><code>fund_annual_gift_exclusion</code></td>
    </tr>
    <tr>
      <td><code>dynasty</code></td>
      <td><code>tax_gst_multigen</code>, <code>beneficiary_descendants</code>, <code>remainder_per_stirpes</code></td>
      <td><code>fund_annual_gift_exclusion</code> (often seeded via Crummey)</td>
      <td>Simple one-generation gift plan</td>
    </tr>
    <tr>
      <td><code>ilit</code></td>
      <td><code>fund_life_insurance</code>, <code>fund_annual_gift_exclusion</code>, <code>start_during_life</code></td>
      <td><code>tax_federal_estate</code></td>
      <td><code>structure_fixed_slice</code> for heir inheritance accounts</td>
    </tr>
  </tbody>
</table>

**Implementation note:** Map to glossary slugs in `glossary-and-trust-types.md`. Slug list may need sync if glossary changes.

---

## Locked test cases (must pass)

These come from real user sessions. **Encode as automated assertions** in `check-intent-mappings.mjs` (or equivalent) before shipping.

### TC-1: Grandchildren — annual gifts — own slice

**User story:** Trust for grandchildren, funded with annual gift tax exemption, multiple beneficiaries, each with their own slice.

**Intent selection:**

```
beneficiary_grandchildren: true
start_during_life: true
fund_annual_gift_exclusion: true
structure_fixed_slice: true
structure_class_grows: true   // optional but realistic
```

**Expected results (ranked):**

<table>
  <thead>
    <tr><th>Rank</th><th>Trust type</th><th>Score</th><th>Matched intents (must include)</th><th>Missing / caveats (acceptable)</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>Crummey trust</strong> (<code>crummey-trust</code>)</td>
      <td>Highest — all core intents</td>
      <td>during life, annual gifts, fixed slice per person, grandchildren</td>
      <td>GST planning optional; admin burden (notices, 5-and-5)</td>
    </tr>
    <tr>
      <td>2–3</td>
      <td>Dynasty (if GST selected), separate-share only if death-funded intents also toggled</td>
      <td>Lower</td>
      <td>Partial</td>
      <td>Separate-share at death should <strong>not</strong> outrank Crummey for this selection</td>
    </tr>
  </tbody>
</table>

**Must NOT top-rank:** pot (shared pool), ILIT, B trust, testamentary separate share, bypass trust.

**Plain-language result blurb (example):**  
*"Lifetime irrevocable gift trust with Crummey withdrawal powers and a separate sub-trust or account per grandchild — qualifies annual exclusion gifts while keeping each child's share segregated."*

---

### TC-2: Wife — Illinois shield — needs — remainder to child

**User story:** Trust for wife; shield part of estate from Illinois tax; she takes what she needs; passes to child when she dies.

**Intent selection:**

```
beneficiary_spouse: true
start_at_first_spouse_death: true   // or start_at_my_death if modeled as first death
tax_illinois_estate: true
tax_federal_estate: true            // typically paired
access_discretionary_needs: true
remainder_to_children: true
```

**Expected results (ranked):**

<table>
  <thead>
    <tr><th>Rank</th><th>Trust type</th><th>Score</th><th>Matched intents</th><th>Caveats</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>B trust</strong> (bypass / credit shelter) (<code>b-trust</code>)</td>
      <td>Highest</td>
      <td>IL/federal shield, spouse benefit, remainder to children, discretionary</td>
      <td>Irrevocable at first death; uses deceased spouse's exemption</td>
    </tr>
    <tr>
      <td>2</td>
      <td>QTIP / marital trust</td>
      <td>High for spouse needs; weaker on "shield"</td>
      <td>Spouse income/needs, remainder to children</td>
      <td>Defers tax rather than sheltering; discuss with counsel</td>
    </tr>
    <tr>
      <td>3</td>
      <td>Clayton QTIP</td>
      <td>Partial</td>
      <td>Hybrid shelter + marital</td>
      <td>More complex</td>
    </tr>
  </tbody>
</table>

**Must NOT top-rank:** Crummey trust, pot, ILIT, RLT alone, grandchildren structures.

**Plain-language result blurb (example):**  
*"Credit-shelter (bypass) trust funded at first death — removes assets from the taxable estate up to the available exemption, supports spouse during life, remainder to children."*

---

### TC-3: Regression — abandoned picker failure mode

**Intent selection (old broken query):**

```
// Expressed as intents, not legal facets:
start_during_life: true
fund_annual_gift_exclusion: true
structure_fixed_slice: true
// User does NOT select: shared pool, at death funding, spouse
```

**Assert:**
- Exactly one top result at full score: **Crummey trust**
- **Pot** appears only if user also selects `structure_shared_pool`
- No result flips when unrelated intent facets are added (stable ranking)

---

## UX sketch

```
[ Who benefits ]     ☐ Spouse  ☐ Children  ☐ Grandchildren  ☐ Descendants  ☐ Charity

[ When & funding ]   ☐ While I'm alive  ☐ At my death  ☐ At first spouse death
                     ☐ Annual gift exemption  ☐ At death from estate  ☐ Life insurance …

[ Structure ]        ☐ Shared pool (pot)  ☐ Fixed slice per person  ☐ Class can grow

[ Tax goals ]        ☐ Illinois estate tax  ☐ Federal estate tax  ☐ Multi-gen GST

[ Access ]           ☐ Takes what's needed  ☐ Staged ages  ☐ I want to change my mind

[ Then to ]          ☐ Spouse  ☐ Children  ☐ Grandchildren  ☐ Per stirpes

Results (ranked)
  1. Crummey trust (irrevocable gift trust)
     ✓ Grandchildren  ✓ Annual gifts  ✓ Own slice  ✓ During life
     ⚠ Annual Crummey notices and per-beneficiary admin
     [Read more →]  [Technical details ▾]
```

URL state: `?i=grandchildren,annual_gift,fixed_slice,during_life` (serialize intent IDs).

---

## Architecture (implementation)

<table>
  <thead>
    <tr><th>Layer</th><th>File / location</th><th>Role</th></tr>
  </thead>
  <tbody>
    <tr><td>Glossary (prose)</td><td><code>NotebookLinkManager/notebook/estate-planning/notes/glossary-and-trust-types.md</code></td><td>Canonical trust-type descriptions; human-edited</td></tr>
    <tr><td>Intent schema</td><td><code>intent-schema.mjs</code></td><td>Facet IDs, labels, UI groups</td></tr>
    <tr><td>Intent mappings</td><td><code>intent-mappings.mjs</code></td><td>Per slug: strong / weak / incompatible intent IDs + copy</td></tr>
    <tr><td>Matcher</td><td><code>match-by-intent.mjs</code></td><td><code>matchIntents(selection, catalog) → { score, matched[], missing[], caveats[] }</code></td></tr>
    <tr><td>Tests</td><td><code>check-intent-mappings.mjs</code></td><td>TC-1, TC-2, TC-3 assertions; run in build</td></tr>
    <tr><td>UI</td><td>Static picker page</td><td>Grouped checkboxes, results, glossary links</td></tr>
  </tbody>
</table>

**Do not** parse glossary prose tables at runtime for matching. **Do** keep a drift check: every mapped slug exists in glossary.

---

## Lessons from abandoned implementation (do not repeat)

<table>
  <thead>
    <tr><th>Mistake</th><th>Why it failed</th><th>Intent-picker fix</th></tr>
  </thead>
  <tbody>
    <tr><td>Exposed <code>inter_vivos</code> vs <code>during_life</code> as separate user filters</td><td>Same axis split twice; users confused; pot matched wrong</td><td>Single <code>start_during_life</code> intent</td></tr>
    <tr><td><code>crummey: sometimes</code> on pot, bloodline, dynasty</td><td>Partial matches flooded results</td><td><code>fund_annual_gift_exclusion</code> maps strongly only to Crummey / ILIT</td></tr>
    <tr><td>Split separate-share vs Crummey then reclassified enums iteratively</td><td>Each fix moved goalposts</td><td>One user intent ("own slice + annual gifts") → one primary answer (Crummey)</td></tr>
    <tr><td>Soft score on legal facets without stable ontology</td><td>Whack-a-mole rankings</td><td>Curated strong/weak per intent per type</td></tr>
    <tr><td>No scenario tests</td><td>Regressions every deploy</td><td>TC-1–TC-3 in CI/build</td></tr>
  </tbody>
</table>

---

## Requirements (for plan/tasks)

| ID | Requirement |
|----|-------------|
| R1 | User selects **intent facets** in plain language |
| R2 | Results ranked by intent match strength with matched / missing / caveats |
| R3 | TC-1, TC-2, TC-3 pass in automated checks |
| R4 | Glossary remains source of truth for trust-type prose |
| R5 | Educational disclaimer; not legal advice |
| R6 | Legal/implementation detail available on results, not required as input |
| R7 | Shareable URL encoding of intent selection |
| R8 | Stable rankings — no flip-flop when unrelated intents added |

---

## Suggested tasks (waves)

### Wave 1 — Data model
- [ ] **1.1** Define `IntentFacet` schema + UI groups (`intent-schema.mjs`)
- [ ] **1.2** Author `intent-mappings.mjs` for all glossary slugs (start with TC-1/TC-2 types)
- [ ] **1.3** Implement `match-by-intent.mjs` with soft score + matched/missing/caveats
- [ ] **1.4** Add `check-intent-mappings.mjs` with TC-1, TC-2, TC-3 — verify: `node check-intent-mappings.mjs` exits 0

### Wave 2 — UI
- [ ] **2.1** Picker page with grouped intent controls + results
- [ ] **2.2** URL serialize/parse for intent IDs
- [ ] **2.3** Link results to glossary content (synced MD or static pages)

### Wave 3 — Deploy
- [ ] **3.1** Wire into `cloudflare-apps` build if deploying publicly
- [ ] **3.2** Home page card + disclaimer
- [ ] **3.3** Manual walkthrough TC-1 and TC-2 in browser

---

## Source references

- Glossary: `NotebookLinkManager/notebook/estate-planning/notes/glossary-and-trust-types.md`
- Grandchildren / Crummey pattern: `notebook/estate-planning/projects/inheritance-research/documents/grandchildren-trust-primer.md`
- Crummey mechanics: `notebook/estate-planning/documents/perissos-crummey-powers-summary.md`
- Abandoned plan (legal facets): `cloudflare-apps/plans/trust-picker.md`
- Agent transcript (failure analysis): conversation 2026-07-14 re pot trust, Crummey, separate share, picker redeploys

---

## Notes

- 2026-07-14: User rejected implementation-facet picker; deleted `estate-trusts` app from cloudflare-apps.
- 2026-07-14: Intent-facet reframing validated — goal language is stable; legal labels are derived output.
- 2026-07-14: A more capable LLM helps author the mapping table once; it does not fix non-orthogonal legal enums as UI inputs.
