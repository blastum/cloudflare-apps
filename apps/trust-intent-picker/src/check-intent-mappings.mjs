import { readFile } from 'node:fs/promises'
import { CLAUSE_BY_ID } from './clause-schema.mjs'
import { JOBS, jobFromLegacyTokens } from './jobs.mjs'
import { INTENT_MAPPINGS } from './intent-mappings.mjs'
import { EXCLUSIVE_ADDON_PAIRS, VESSEL_RULES, allowedAddons, vesselRule } from './vessel-rules.mjs'
import { resolveNotebookFile } from '../scripts/glossary-path.mjs'

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

function catalogIdsInRules(rules) {
  return rules.map((row) => row.id).filter(Boolean)
}

function validateVesselCoverage() {
  for (const entry of INTENT_MAPPINGS) {
    assert(VESSEL_RULES.has(entry.slug), `Missing vessel rules for ${entry.slug}`)
  }

  for (const slug of VESSEL_RULES.keys()) {
    assert(
      INTENT_MAPPINGS.some((entry) => entry.slug === slug),
      `Vessel rules slug ${slug} has no glossary mapping`,
    )
  }
}

function validateClauseIds() {
  for (const rule of VESSEL_RULES.values()) {
    const ids = [
      ...catalogIdsInRules(rule.required),
      ...catalogIdsInRules(rule.optional),
      ...catalogIdsInRules(rule.forbidden),
    ]
    for (const id of ids) {
      assert(CLAUSE_BY_ID.has(id), `${rule.slug}: unknown clause id ${id}`)
    }

    const required = new Set(catalogIdsInRules(rule.required))
    const forbidden = new Set(catalogIdsInRules(rule.forbidden))
    for (const id of required) {
      assert(!forbidden.has(id), `${rule.slug}: ${id} is both required and forbidden`)
    }

    const optional = new Set(catalogIdsInRules(rule.optional))
    for (const id of required) {
      assert(!optional.has(id), `${rule.slug}: ${id} is both required and optional`)
    }

    for (const [a, b] of EXCLUSIVE_ADDON_PAIRS) {
      assert(
        !(required.has(a) && required.has(b)),
        `${rule.slug}: exclusive pair ${a}/${b} both required`,
      )
    }
  }
}

function validateJobs() {
  for (const job of JOBS) {
    assert(VESSEL_RULES.has(job.vessel), `Job ${job.id} points at unknown vessel ${job.vessel}`)
  }
}

async function validateGlossaryAnchors() {
  const glossaryPath = resolveNotebookFile('glossary-and-trust-types.md')
  const glossary = await readFile(glossaryPath, 'utf8')
  const anchors = new Set([...glossary.matchAll(/href="#([a-z0-9-]+)"/g)].map((m) => m[1]))

  for (const entry of INTENT_MAPPINGS) {
    assert(
      anchors.has(entry.glossaryAnchor),
      `Glossary anchor missing for ${entry.slug}: #${entry.glossaryAnchor}`,
    )
  }
}

test('job: Rockefeller descendants → dynasty', () => {
  const job = JOBS.find((entry) => entry.id === 'rockefeller')
  assert(job?.vessel === 'dynasty', `expected dynasty, got ${job?.vessel}`)
  const rule = vesselRule('dynasty')
  assert(catalogIdsInRules(rule.required).includes('C12'), 'dynasty must require GST allocation')
  assert(catalogIdsInRules(rule.required).includes('C15'), 'dynasty must require duration language')
  assert(catalogIdsInRules(rule.forbidden).includes('C13'), 'dynasty must forbid QTIP as the whole vessel')
})

test('job: special-needs child → SNT', () => {
  const job = JOBS.find((entry) => entry.id === 'special-needs')
  assert(job?.vessel === 'snt', `expected snt, got ${job?.vessel}`)
  const rule = vesselRule('snt')
  assert(catalogIdsInRules(rule.required).includes('C18'), 'SNT must require supplemental-needs language')
  assert(catalogIdsInRules(rule.required).includes('C06'), 'SNT must require pure discretion')
  assert(catalogIdsInRules(rule.forbidden).includes('C05'), 'SNT must forbid HEMS/support')
  assert(catalogIdsInRules(rule.forbidden).includes('C01'), 'SNT must forbid Crummey withdrawal')
})

test('job: spouse exemption → bypass, not QTIP', () => {
  const job = JOBS.find((entry) => entry.id === 'spouse-exemption')
  assert(job?.vessel === 'b-trust', `expected b-trust, got ${job?.vessel}`)
  const rule = vesselRule('b-trust')
  assert(catalogIdsInRules(rule.required).includes('C20'), 'bypass must require funding formula')
  assert(catalogIdsInRules(rule.forbidden).includes('C13'), 'bypass must forbid QTIP on the same vessel')
  assert(rule.companions?.includes('qtip'), 'bypass should point at QTIP as a companion vessel')
})

test('job: annual gifts → Crummey', () => {
  assert(JOBS.find((entry) => entry.id === 'annual-gifts')?.vessel === 'crummey-trust', 'annual-gifts → crummey')
  const rule = vesselRule('crummey-trust')
  assert(catalogIdsInRules(rule.required).includes('C01'), 'Crummey vessel requires Crummey powers')
  assert(catalogIdsInRules(rule.forbidden).includes('C02'), 'Crummey vessel forbids pot as the gift vehicle')
})

test('legacy ?i= annual gift tokens map to annual-gifts', () => {
  const job = jobFromLegacyTokens(['annual_gift', 'fixed_slice', 'during_life'])
  assert(job?.id === 'annual-gifts', `expected annual-gifts, got ${job?.id}`)
})

test('legacy ?i= shared pot tokens map to shared-pot', () => {
  const job = jobFromLegacyTokens(['shared_pool', 'class_grows', 'hems'])
  assert(job?.id === 'shared-pot', `expected shared-pot, got ${job?.id}`)
})

test('addons: forbidden ids cannot be enabled', () => {
  const next = allowedAddons('snt', ['C05', 'C10', 'C01'])
  assert(next.includes('C10'), 'C10 is optional on SNT')
  assert(!next.includes('C05'), 'C05 is forbidden on SNT')
  assert(!next.includes('C01'), 'C01 is forbidden on SNT')
})

test('RLT is not a GST/dynasty vehicle', () => {
  const rule = vesselRule('rlt')
  assert(catalogIdsInRules(rule.forbidden).includes('C12'), 'RLT must forbid GST as the RLT itself')
  assert(catalogIdsInRules(rule.forbidden).includes('C01'), 'RLT must forbid Crummey gifts into itself')
})

async function main() {
  validateVesselCoverage()
  validateClauseIds()
  validateJobs()
  await validateGlossaryAnchors()

  if (failures.length > 0) {
    console.error('check-intent-mappings failed:\n')
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    process.exit(1)
  }

  console.log('check-intent-mappings: vessel rules, jobs, glossary anchors passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
