/**
 * Maps selected intents to clause IDs typically involved (display-only).
 * @type {Record<string, string[]>}
 */
export const INTENT_CLAUSE_HINTS = {
  fund_annual_gift_exclusion: ['C01'],
  structure_shared_pool: ['C02'],
  structure_fixed_slice: ['C03'],
  constraint_creditor_protection: ['C04'],
  access_hems_ascertainable: ['C05', 'C19'],
  access_liberal_discretionary: ['C06', 'C04', 'C19'],
  access_pure_discretion: ['C06'],
  tax_gst_multigen: ['C12', 'C15'],
  constraint_ira_assets: ['C17'],
  constraint_special_needs: ['C18'],
  beneficiary_spouse: ['C13'],
  access_staged_ages: ['C09'],
}

/**
 * @param {Record<string, boolean>} selection
 * @returns {string[]}
 */
export function clauseHighlightsForSelection(selection) {
  const ids = new Set()
  for (const [intentId, selected] of Object.entries(selection)) {
    if (!selected) continue
    for (const clauseId of INTENT_CLAUSE_HINTS[intentId] ?? []) ids.add(clauseId)
  }
  return [...ids].sort()
}
