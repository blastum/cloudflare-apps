import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { INTENT_FACET_IDS } from './intent-schema.mjs'
import { INTENT_MAPPINGS } from './intent-mappings.mjs'
import { isFullScore, matchIntents, STRONG_WEIGHT } from './match-by-intent.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const glossaryPath = join(
  root,
  '../../../NotebookLinkManager/notebook/estate-planning/notes/glossary-and-trust-types.md',
)

/** @type {string[]} */
const failures = []

/**
 * @param {boolean} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) failures.push(message)
}

/**
 * @param {string} label
 * @param {() => void} fn
 */
function test(label, fn) {
  try {
    fn()
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function validateSchema() {
  for (const entry of INTENT_MAPPINGS) {
    const ids = [
      ...(entry.strong ?? []),
      ...(entry.weak ?? []),
      ...(entry.incompatible ?? []),
    ]
    for (const id of ids) {
      assert(INTENT_FACET_IDS.has(id), `Unknown intent "${id}" on mapping ${entry.slug}`)
    }
  }
}

async function validateGlossaryAnchors() {
  const glossary = await readFile(glossaryPath, 'utf8')
  const anchors = new Set([...glossary.matchAll(/href="#([a-z0-9-]+)"/g)].map((m) => m[1]))

  for (const entry of INTENT_MAPPINGS) {
    assert(
      anchors.has(entry.glossaryAnchor),
      `Glossary anchor missing for ${entry.slug}: #${entry.glossaryAnchor}`,
    )
  }
}

function rankOf(results, slug) {
  return results.findIndex((result) => result.slug === slug)
}

// TC-1: Grandchildren — annual gifts — own slice
test('TC-1: grandchildren annual gifts fixed slice', () => {
  const selection = {
    beneficiary_grandchildren: true,
    start_during_life: true,
    fund_annual_gift_exclusion: true,
    structure_fixed_slice: true,
    structure_class_grows: true,
  }

  const results = matchIntents(selection, INTENT_MAPPINGS)

  assert(results.length > 0, 'TC-1: expected at least one result')
  assert(results[0].slug === 'crummey-trust', `TC-1: expected crummey-trust #1, got ${results[0]?.slug}`)

  const topScore = results[0].score
  for (const slug of ['pot', 'ilit', 'b-trust', 'separate-share', 'rlt']) {
    const entry = results.find((result) => result.slug === slug)
    assert(!entry || entry.score < topScore, `TC-1: ${slug} must not tie or beat crummey-trust`)
  }

  for (const id of [
    'start_during_life',
    'fund_annual_gift_exclusion',
    'structure_fixed_slice',
    'beneficiary_grandchildren',
  ]) {
    assert(
      results[0].matched.includes(id),
      `TC-1: crummey-trust must strongly match ${id}`,
    )
  }

  const separateShareRank = rankOf(results, 'separate-share')
  assert(
    separateShareRank === -1 || separateShareRank > 0,
    'TC-1: separate-share must not outrank crummey-trust',
  )
})

// TC-2: Wife — Illinois shield — needs — remainder to child
test('TC-2: spouse Illinois shield discretionary remainder to children', () => {
  const selection = {
    beneficiary_spouse: true,
    start_at_first_spouse_death: true,
    tax_illinois_estate: true,
    tax_federal_estate: true,
    access_discretionary_needs: true,
    remainder_to_children: true,
  }

  const results = matchIntents(selection, INTENT_MAPPINGS)

  assert(results[0]?.slug === 'b-trust', `TC-2: expected b-trust #1, got ${results[0]?.slug}`)

  const qtipRank = rankOf(results, 'qtip')
  const claytonRank = rankOf(results, 'clayton-qtip')
  assert(qtipRank === 1, `TC-2: expected qtip #2, got rank ${qtipRank + 1}`)
  assert(claytonRank === 2, `TC-2: expected clayton-qtip #3, got rank ${claytonRank + 1}`)

  const topScore = results[0].score
  for (const slug of ['crummey-trust', 'pot', 'ilit', 'rlt']) {
    const entry = results.find((result) => result.slug === slug)
    assert(!entry || entry.score < topScore, `TC-2: ${slug} must not tie or beat b-trust`)
  }

  for (const id of [
    'tax_illinois_estate',
    'tax_federal_estate',
    'beneficiary_spouse',
    'remainder_to_children',
    'access_discretionary_needs',
  ]) {
    assert(results[0].matched.includes(id), `TC-2: b-trust must match ${id}`)
  }
})

// TC-3: Regression — abandoned picker failure mode
test('TC-3: lifetime annual gift fixed slice regression', () => {
  const selection = {
    start_during_life: true,
    fund_annual_gift_exclusion: true,
    structure_fixed_slice: true,
  }

  const results = matchIntents(selection, INTENT_MAPPINGS)
  const fullScore = selection.start_during_life
    ? Object.values(selection).filter(Boolean).length * STRONG_WEIGHT
    : 0
  const topAtFull = results.filter((result) => result.score === fullScore && isFullScore(result))

  assert(topAtFull.length === 1, `TC-3: expected one full-score top result, got ${topAtFull.length}`)
  assert(topAtFull[0].slug === 'crummey-trust', 'TC-3: only crummey-trust at full score')

  const potAbsent = results.every((result) => result.slug !== 'pot')
  assert(potAbsent, 'TC-3: pot must not appear without structure_shared_pool')

  const withPool = {
    start_during_life: true,
    fund_annual_gift_exclusion: true,
    structure_shared_pool: true,
  }
  const poolResults = matchIntents(withPool, INTENT_MAPPINGS)
  const potEntry = poolResults.find((result) => result.slug === 'pot')
  assert(potEntry && potEntry.score > 0, 'TC-3: pot should appear when structure_shared_pool selected')

  const withUnrelated = {
    ...selection,
    beneficiary_charity: true,
    constraint_ira_assets: true,
  }
  const stableResults = matchIntents(withUnrelated, INTENT_MAPPINGS)
  assert(
    stableResults[0]?.slug === 'crummey-trust',
    'TC-3: crummey-trust must remain #1 when unrelated intents added',
  )

  const baselineSlugs = results.map((result) => result.slug)
  const stableSlugs = stableResults.map((result) => result.slug)
  assert(
    stableSlugs[0] === baselineSlugs[0],
    'TC-3: top result must not flip when unrelated intents added',
  )
})

async function main() {
  validateSchema()
  await validateGlossaryAnchors()

  if (failures.length > 0) {
    console.error('check-intent-mappings failed:\n')
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    process.exit(1)
  }

  console.log('check-intent-mappings: all checks passed (TC-1, TC-2, TC-3, schema, glossary)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
