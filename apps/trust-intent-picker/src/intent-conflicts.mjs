/**
 * Detect intent combinations that cannot describe a single trust instrument.
 * Real estate plans often combine several trusts; we flag when one checkbox set is internally inconsistent.
 *
 * @typedef {{ id: string, message: string, intents: string[] }} IntentConflict
 */

/**
 * @param {Record<string, boolean>} selection
 * @returns {boolean}
 */
function on(selection, id) {
  return selection[id] === true
}

/**
 * @param {Record<string, boolean>} selection
 * @returns {IntentConflict[]}
 */
export function detectIntentConflicts(selection) {
  /** @type {IntentConflict[]} */
  const conflicts = []

  if (on(selection, 'start_during_life') && on(selection, 'start_at_my_death')) {
    conflicts.push({
      id: 'timing_life_vs_death',
      message:
        'A single trust cannot both be established during your life and created only at your death.',
      intents: ['start_during_life', 'start_at_my_death'],
    })
  }

  if (on(selection, 'start_during_life') && on(selection, 'start_at_first_spouse_death')) {
    conflicts.push({
      id: 'timing_life_vs_first_death',
      message:
        'Lifetime funding and “at first spouse’s death” describe different starting points — usually separate trusts (e.g. Crummey gifts now vs bypass at first death).',
      intents: ['start_during_life', 'start_at_first_spouse_death'],
    })
  }

  if (on(selection, 'structure_shared_pool') && on(selection, 'structure_fixed_slice')) {
    conflicts.push({
      id: 'structure_pool_vs_slice',
      message:
        'A pooled pot and fixed separate shares are different beneficiary structures for the same trust.',
      intents: ['structure_shared_pool', 'structure_fixed_slice'],
    })
  }

  if (on(selection, 'fund_annual_gift_exclusion') && on(selection, 'fund_at_death')) {
    conflicts.push({
      id: 'fund_gift_vs_estate',
      message:
        'Annual-exclusion gifts during life and estate-only funding at death are different funding paths for one trust.',
      intents: ['fund_annual_gift_exclusion', 'fund_at_death'],
    })
  }

  if (on(selection, 'access_grantor_control') && on(selection, 'fund_annual_gift_exclusion')) {
    conflicts.push({
      id: 'revocable_vs_crummey',
      message:
        '“Change my mind later” (revocable) conflicts with typical irrevocable Crummey gift trusts funded with annual exclusions.',
      intents: ['access_grantor_control', 'fund_annual_gift_exclusion'],
    })
  }

  if (on(selection, 'tax_not_primary') && (on(selection, 'tax_illinois_estate') || on(selection, 'tax_federal_estate'))) {
    conflicts.push({
      id: 'tax_primary_vs_shield',
      message: 'Tax reduction goals conflict with “tax planning is not the main goal” for a single trust.',
      intents: [
        'tax_not_primary',
        ...(on(selection, 'tax_illinois_estate') ? ['tax_illinois_estate'] : []),
        ...(on(selection, 'tax_federal_estate') ? ['tax_federal_estate'] : []),
      ],
    })
  }

  if (
    on(selection, 'access_hems_ascertainable') &&
    on(selection, 'access_pure_discretion') &&
    !on(selection, 'access_liberal_discretionary')
  ) {
    conflicts.push({
      id: 'distribution_hems_vs_pure',
      message:
        'HEMS (ascertainable standard) and pure trustee discretion are opposite distribution standards for one trust.',
      intents: ['access_hems_ascertainable', 'access_pure_discretion'],
    })
  }

  if (on(selection, 'beneficiary_spouse') && on(selection, 'beneficiary_one_person') && on(selection, 'constraint_special_needs')) {
    // spouse + one person + SNT could be same person - skip
  }

  if (on(selection, 'structure_one_beneficiary') && on(selection, 'structure_shared_pool')) {
    conflicts.push({
      id: 'structure_one_vs_pool',
      message: 'Single-beneficiary and shared-pool structures do not describe the same trust.',
      intents: ['structure_one_beneficiary', 'structure_shared_pool'],
    })
  }

  return conflicts
}

/**
 * @param {Record<string, boolean>} selection
 * @param {IntentConflict[]} conflicts
 * @returns {string | null}
 */
export function multipleTrustsHint(selection, conflicts) {
  if (conflicts.length > 0) {
    return 'These goals likely need more than one trust — for example a revocable living trust as container, a bypass or QTIP at first death, and separate irrevocable gift trusts during life.'
  }

  const spansLifecycle =
    on(selection, 'start_during_life') &&
    (on(selection, 'start_at_first_spouse_death') || on(selection, 'start_at_my_death'))

  const spansTaxAndGifts =
    on(selection, 'fund_annual_gift_exclusion') &&
    (on(selection, 'tax_federal_estate') || on(selection, 'tax_illinois_estate'))

  if (spansLifecycle || spansTaxAndGifts) {
    return 'Your selections span different life stages or tax strategies. That is normal — most plans use several trusts with non-contradictory clauses in each.'
  }

  return null
}
