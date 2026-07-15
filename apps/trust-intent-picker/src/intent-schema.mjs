/**
 * Intent facet schema — plain-language goals, not legal/tax implementation labels.
 * @typedef {Object} IntentFacet
 * @property {string} id
 * @property {string} label
 * @property {string} group
 * @property {string} [description]
 */

/** @type {readonly { id: string, label: string }[]} */
export const INTENT_GROUPS = [
  { id: 'who', label: 'Who benefits' },
  { id: 'when', label: 'When it starts' },
  { id: 'fund', label: 'How I fund it' },
  { id: 'structure', label: 'Structure among beneficiaries' },
  { id: 'tax', label: 'Tax goals' },
  { id: 'access', label: 'Access and distributions' },
  { id: 'remainder', label: 'Remainder / what happens next' },
  { id: 'constraints', label: 'Optional constraints' },
]

/** @type {IntentFacet[]} */
export const INTENT_FACETS = [
  // Who benefits
  { id: 'beneficiary_spouse', label: 'My spouse', group: 'who' },
  { id: 'beneficiary_children', label: 'My children', group: 'who' },
  { id: 'beneficiary_grandchildren', label: 'My grandchildren', group: 'who' },
  {
    id: 'beneficiary_descendants',
    label: 'Descendants generally (bloodline)',
    group: 'who',
  },
  { id: 'beneficiary_charity', label: 'Charity', group: 'who' },
  { id: 'beneficiary_one_person', label: 'One named person only', group: 'who' },

  // When it starts
  { id: 'start_during_life', label: "While I'm alive", group: 'when' },
  { id: 'start_at_my_death', label: 'When I die', group: 'when' },
  {
    id: 'start_at_first_spouse_death',
    label: 'When the first spouse dies',
    group: 'when',
  },

  // How I fund it
  {
    id: 'fund_annual_gift_exclusion',
    label: 'Annual gift tax exemption ($19k/donee; gift-splitting OK)',
    group: 'fund',
  },
  {
    id: 'fund_lifetime_exemption',
    label: 'Lifetime gift/estate exemption',
    group: 'fund',
  },
  { id: 'fund_at_death', label: 'Assets from my estate at death', group: 'fund' },
  { id: 'fund_life_insurance', label: 'Life insurance premiums', group: 'fund' },

  // Structure among beneficiaries
  {
    id: 'structure_shared_pool',
    label: 'Shared pool — trustee balances by need (pot)',
    group: 'structure',
  },
  {
    id: 'structure_fixed_slice',
    label: 'Fixed slice per person — own account/share',
    group: 'structure',
  },
  { id: 'structure_one_beneficiary', label: 'Single beneficiary only', group: 'structure' },
  {
    id: 'structure_class_grows',
    label: 'Class can grow (e.g. future grandchildren)',
    group: 'structure',
  },

  // Tax goals
  { id: 'tax_illinois_estate', label: 'Reduce Illinois estate tax', group: 'tax' },
  { id: 'tax_federal_estate', label: 'Reduce federal estate tax', group: 'tax' },
  { id: 'tax_gst_multigen', label: 'Multi-generation / GST planning', group: 'tax' },
  { id: 'tax_not_primary', label: 'Tax planning is not the main goal', group: 'tax' },

  // Access and distributions
  {
    id: 'access_discretionary_needs',
    label: "Beneficiary/trustee takes what's needed (HEMS-style)",
    group: 'access',
  },
  { id: 'access_fixed_income', label: 'Fixed or mandated income', group: 'access' },
  {
    id: 'access_staged_ages',
    label: 'Staged principal at ages (e.g. 25/30/35)',
    group: 'access',
  },
  {
    id: 'access_grantor_control',
    label: 'I want to change my mind later / retain control',
    group: 'access',
    description: 'Implies revocable; disqualifies most irrevocable gifts',
  },

  // Remainder / what happens next
  { id: 'remainder_to_spouse', label: 'Then to spouse', group: 'remainder' },
  { id: 'remainder_to_children', label: 'Then to my children', group: 'remainder' },
  { id: 'remainder_to_grandchildren', label: 'Then to grandchildren', group: 'remainder' },
  {
    id: 'remainder_per_stirpes',
    label: "Deceased child's share to their descendants",
    group: 'remainder',
  },

  // Optional constraints
  {
    id: 'constraint_ira_assets',
    label: 'Must work with inherited IRA / see-through rules',
    group: 'constraints',
  },
  {
    id: 'constraint_special_needs',
    label: 'Beneficiary has special needs / government benefits',
    group: 'constraints',
  },
  {
    id: 'constraint_creditor_protection',
    label: 'Strong creditor/spendthrift protection',
    group: 'constraints',
  },
]

/** @type {Set<string>} */
export const INTENT_FACET_IDS = new Set(INTENT_FACETS.map((facet) => facet.id))

/**
 * @param {string} id
 * @returns {IntentFacet | undefined}
 */
export function getIntentFacet(id) {
  return INTENT_FACETS.find((facet) => facet.id === id)
}
