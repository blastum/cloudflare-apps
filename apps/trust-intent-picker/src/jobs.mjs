/**
 * Plain-language jobs. Each job opens one primary vessel (and optional companions).
 *
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} story
 * @property {string} vessel
 * @property {string} [shortLabel]
 * @property {string[]} [legacyIntentTokens] Old ?i= tokens that should open this job
 */

/** @type {Job[]} */
export const JOBS = [
  {
    id: 'rockefeller',
    shortLabel: 'Descendants for generations',
    story:
      'I want a trust that can benefit my grandchildren and their progeny, like the Rockefellers',
    vessel: 'dynasty',
    legacyIntentTokens: ['gst', 'grandchildren', 'descendants', 'class_grows'],
  },
  {
    id: 'special-needs',
    shortLabel: 'Special-needs child',
    story: 'I want something to take care of my special-needs child',
    vessel: 'snt',
    legacyIntentTokens: ['special_needs'],
  },
  {
    id: 'spouse-exemption',
    shortLabel: 'Spouse, then kids — use exemption',
    story:
      'When I die, use my estate-tax exemption and still take care of my spouse, then the kids',
    vessel: 'b-trust',
    legacyIntentTokens: ['spouse', 'first_spouse_death', 'illinois_tax', 'federal_tax', 'then_children'],
  },
  {
    id: 'probate-control',
    shortLabel: 'Avoid probate, keep control',
    story: 'I want to avoid probate and still change my mind while I am alive',
    vessel: 'rlt',
    legacyIntentTokens: ['grantor_control', 'during_life'],
  },
  {
    id: 'annual-gifts',
    shortLabel: 'Annual gifts to kids',
    story:
      'I want to give kids (or grandkids) $19k a year without chewing lifetime exemption',
    vessel: 'crummey-trust',
    legacyIntentTokens: ['annual_gift', 'fixed_slice', 'during_life'],
  },
  {
    id: 'shared-pot',
    shortLabel: 'One pool by need',
    story: 'I want one pool the trustee can spray among the kids or grandkids by who needs it most',
    vessel: 'pot',
    legacyIntentTokens: ['shared_pool', 'class_grows', 'hems'],
  },
  {
    id: 'ira-to-trust',
    shortLabel: 'IRA payable to a trust',
    story: 'I want my IRA to go to a trust for the kids, not outright',
    vessel: 'accumulation',
    legacyIntentTokens: ['ira'],
  },
  {
    id: 'insurance-outside',
    shortLabel: 'Life insurance outside the estate',
    story: 'I want life insurance proceeds kept out of my taxable estate',
    vessel: 'ilit',
    legacyIntentTokens: ['life_insurance'],
  },
  {
    id: 'spouse-defer-tax',
    shortLabel: 'Spouse support, defer tax',
    story: 'I want my spouse supported for life and estate tax deferred until they die',
    vessel: 'qtip',
    legacyIntentTokens: ['spouse', 'fixed_income', 'then_children'],
  },
]

/** @type {Map<string, Job>} */
export const JOBS_BY_ID = new Map(JOBS.map((job) => [job.id, job]))

/**
 * Map an old intent-token bag onto a job. Longest token-overlap wins; ties prefer earlier JOBS order.
 * @param {string[]} tokens
 * @returns {Job | undefined}
 */
export function jobFromLegacyTokens(tokens) {
  const have = new Set(tokens)
  let best
  let bestScore = 0

  for (const job of JOBS) {
    const needed = job.legacyIntentTokens ?? []
    if (needed.length === 0) continue
    const overlap = needed.filter((token) => have.has(token)).length
    if (overlap === needed.length && overlap > bestScore) {
      best = job
      bestScore = overlap
    }
  }

  if (best) return best

  for (const job of JOBS) {
    const needed = job.legacyIntentTokens ?? []
    const overlap = needed.filter((token) => have.has(token)).length
    if (overlap > bestScore) {
      best = job
      bestScore = overlap
    }
  }

  return bestScore > 0 ? best : undefined
}
