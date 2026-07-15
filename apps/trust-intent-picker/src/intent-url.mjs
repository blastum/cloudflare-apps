/** @type {Record<string, string>} */
export const INTENT_TO_URL = {
  beneficiary_spouse: 'spouse',
  beneficiary_children: 'children',
  beneficiary_grandchildren: 'grandchildren',
  beneficiary_descendants: 'descendants',
  beneficiary_charity: 'charity',
  beneficiary_one_person: 'one_person',
  start_during_life: 'during_life',
  start_at_my_death: 'at_death',
  start_at_first_spouse_death: 'first_spouse_death',
  fund_annual_gift_exclusion: 'annual_gift',
  fund_lifetime_exemption: 'lifetime_exemption',
  fund_at_death: 'death_funded',
  fund_life_insurance: 'life_insurance',
  structure_shared_pool: 'shared_pool',
  structure_fixed_slice: 'fixed_slice',
  structure_one_beneficiary: 'one_beneficiary',
  structure_class_grows: 'class_grows',
  tax_illinois_estate: 'illinois_tax',
  tax_federal_estate: 'federal_tax',
  tax_gst_multigen: 'gst',
  tax_not_primary: 'tax_not_primary',
  access_discretionary_needs: 'discretionary',
  access_fixed_income: 'fixed_income',
  access_staged_ages: 'staged_ages',
  access_grantor_control: 'grantor_control',
  remainder_to_spouse: 'then_spouse',
  remainder_to_children: 'then_children',
  remainder_to_grandchildren: 'then_grandchildren',
  remainder_per_stirpes: 'per_stirpes',
  constraint_ira_assets: 'ira',
  constraint_special_needs: 'special_needs',
  constraint_creditor_protection: 'creditor',
}

/** @type {Map<string, string>} */
const URL_TO_INTENT = new Map(
  Object.entries(INTENT_TO_URL).map(([intentId, token]) => [token, intentId]),
)

/**
 * @param {Record<string, boolean>} selection
 * @returns {string}
 */
export function serializeIntentSelection(selection) {
  const tokens = Object.entries(selection)
    .filter(([, value]) => value === true)
    .map(([id]) => INTENT_TO_URL[id])
    .filter(Boolean)
    .sort()

  return tokens.join(',')
}

/**
 * @param {string} param
 * @returns {Record<string, boolean>}
 */
export function parseIntentParam(param) {
  /** @type {Record<string, boolean>} */
  const selection = {}

  for (const token of param.split(',').map((part) => part.trim()).filter(Boolean)) {
    const intentId = URL_TO_INTENT.get(token)
    if (intentId) selection[intentId] = true
  }

  return selection
}

/**
 * @returns {Record<string, boolean>}
 */
export function readSelectionFromUrl() {
  const param = new URLSearchParams(window.location.search).get('i') ?? ''
  return parseIntentParam(param)
}

/**
 * @param {Record<string, boolean>} selection
 */
export function writeSelectionToUrl(selection) {
  const serialized = serializeIntentSelection(selection)
  const url = new URL(window.location.href)

  if (serialized) url.searchParams.set('i', serialized)
  else url.searchParams.delete('i')

  window.history.replaceState(null, '', url)
}
