/**
 * Curated intent → trust-type mappings. Human-reviewed; not generated at runtime.
 *
 * @typedef {Object} IntentMapping
 * @property {string} slug - Short app slug (used in tests and URLs)
 * @property {string} glossaryAnchor - Anchor in glossary-and-trust-types.md
 * @property {string} name - Display name
 * @property {string[]} strong - Selected intents that match strongly
 * @property {string[]} [weak] - Partial match
 * @property {string[]} [incompatible] - Disqualifies when selected
 * @property {string[]} [caveats] - Plain-language tradeoffs
 * @property {string} [why] - One-paragraph result blurb
 */

/** @type {IntentMapping[]} */
export const INTENT_MAPPINGS = [
  {
    slug: 'crummey-trust',
    glossaryAnchor: 'crummey-trust-irrevocable-gift-trust',
    name: 'Crummey trust',
    strong: [
      'start_during_life',
      'fund_annual_gift_exclusion',
      'structure_fixed_slice',
      'beneficiary_children',
      'beneficiary_grandchildren',
    ],
    weak: ['tax_gst_multigen', 'access_staged_ages', 'structure_class_grows'],
    incompatible: [
      'start_at_my_death',
      'fund_at_death',
      'beneficiary_spouse',
      'structure_shared_pool',
      'access_grantor_control',
    ],
    caveats: [
      'Annual Crummey notices and per-beneficiary admin',
      '5-and-5 lapse rules apply to withdrawal powers',
    ],
    why:
      'Lifetime irrevocable gift trust with Crummey withdrawal powers and a separate sub-trust or account per beneficiary — qualifies annual exclusion gifts while keeping each heir\'s share segregated.',
  },
  {
    slug: 'separate-share',
    glossaryAnchor: 'separate-share-trust',
    name: 'Separate share trust',
    strong: ['start_at_my_death', 'structure_fixed_slice', 'fund_at_death'],
    weak: ['beneficiary_grandchildren', 'access_staged_ages', 'beneficiary_children'],
    incompatible: ['fund_annual_gift_exclusion', 'start_during_life'],
    caveats: ['Testamentary — funded at death, not during life with annual gifts'],
    why:
      'Testamentary separate share trust — each beneficiary gets a fixed slice from your estate at death, with no cross-share reallocation.',
  },
  {
    slug: 'pot',
    glossaryAnchor: 'pot-trust',
    name: 'Pot trust',
    strong: [
      'structure_shared_pool',
      'structure_class_grows',
      'access_discretionary_needs',
    ],
    weak: ['fund_annual_gift_exclusion', 'beneficiary_grandchildren', 'beneficiary_descendants'],
    incompatible: ['structure_fixed_slice'],
    caveats: [
      'Trustee balances distributions by need — not equal fixed shares',
      'May divide into separate shares at a milestone age',
    ],
    why:
      'Pooled pot trust for a growing class of beneficiaries — trustee distributes by need until the class may divide into separate shares.',
  },
  {
    slug: 'b-trust',
    glossaryAnchor: 'b-trust-bypass-credit-shelter-family-trust',
    name: 'B trust (bypass / credit shelter)',
    strong: [
      'start_at_first_spouse_death',
      'beneficiary_spouse',
      'remainder_to_children',
      'tax_illinois_estate',
      'tax_federal_estate',
      'access_discretionary_needs',
    ],
    weak: ['access_fixed_income', 'start_at_my_death'],
    incompatible: ['fund_annual_gift_exclusion', 'start_during_life'],
    caveats: [
      'Irrevocable at first death; uses deceased spouse\'s exemption',
      'No second basis step-up at survivor\'s death',
    ],
    why:
      'Credit-shelter (bypass) trust funded at first death — removes assets from the taxable estate up to the available exemption, supports spouse during life, remainder to children.',
  },
  {
    slug: 'qtip',
    glossaryAnchor: 'qtip-trust',
    name: 'QTIP trust',
    strong: [
      'beneficiary_spouse',
      'start_at_first_spouse_death',
      'access_discretionary_needs',
      'remainder_to_children',
    ],
    weak: ['tax_illinois_estate', 'tax_federal_estate', 'access_fixed_income'],
    incompatible: ['fund_annual_gift_exclusion', 'start_during_life'],
    caveats: [
      'Marital deduction defers tax rather than sheltering assets',
      'QTIP assets included in survivor\'s estate at second death',
    ],
    why:
      'QTIP marital trust — spouse receives income for life with remainder to children; marital deduction at first death but less estate-tax shield than a bypass trust.',
  },
  {
    slug: 'marital',
    glossaryAnchor: 'marital-trust',
    name: 'Marital trust',
    strong: [
      'beneficiary_spouse',
      'start_at_first_spouse_death',
      'start_at_my_death',
      'access_discretionary_needs',
    ],
    weak: ['remainder_to_children', 'tax_illinois_estate', 'tax_federal_estate'],
    incompatible: ['fund_annual_gift_exclusion', 'start_during_life'],
    caveats: ['Umbrella term — often implemented as QTIP or outright marital bequest'],
    why:
      'Marital deduction trust — defers estate tax at first death by qualifying property for the unlimited marital deduction.',
  },
  {
    slug: 'clayton-qtip',
    glossaryAnchor: 'clayton-qtip',
    name: 'Clayton QTIP',
    strong: [
      'beneficiary_spouse',
      'start_at_first_spouse_death',
      'remainder_to_children',
    ],
    weak: [
      'access_discretionary_needs',
      'tax_illinois_estate',
      'tax_federal_estate',
      'access_fixed_income',
    ],
    incompatible: ['fund_annual_gift_exclusion', 'start_during_life'],
    caveats: ['Hybrid formula — bypass first, then QTIP; more complex administration'],
    why:
      'Clayton QTIP formula — funds bypass trust up to the exemption, then pours remainder to QTIP for spouse; hybrid shelter and marital planning.',
  },
  {
    slug: 'dynasty',
    glossaryAnchor: 'dynasty-gst-exempt-trust',
    name: 'Dynasty / GST-exempt trust',
    strong: [
      'tax_gst_multigen',
      'beneficiary_descendants',
      'remainder_per_stirpes',
      'tax_federal_estate',
    ],
    weak: [
      'fund_annual_gift_exclusion',
      'beneficiary_grandchildren',
      'beneficiary_children',
      'start_during_life',
    ],
    incompatible: ['tax_not_primary', 'structure_one_beneficiary'],
    caveats: ['Often seeded via Crummey gifts; Illinois limits trust duration'],
    why:
      'Multi-generation GST-exempt trust — one GST tax hit at funding, benefits descendants for generations within state duration limits.',
  },
  {
    slug: 'ilit',
    glossaryAnchor: 'ilit',
    name: 'ILIT',
    strong: ['fund_life_insurance', 'fund_annual_gift_exclusion', 'start_during_life'],
    weak: ['tax_federal_estate', 'tax_illinois_estate', 'beneficiary_children'],
    incompatible: ['structure_fixed_slice', 'fund_at_death', 'start_at_my_death'],
    caveats: ['Three-year transfer rule if existing policy moved to trust'],
    why:
      'Irrevocable life insurance trust — owns policy and receives Crummey-funded premium gifts; proceeds excluded from taxable estate if structured correctly.',
  },
  {
    slug: 'rlt',
    glossaryAnchor: 'revocable-living-trust-rlt',
    name: 'Revocable living trust',
    strong: [
      'start_during_life',
      'access_grantor_control',
      'tax_not_primary',
      'fund_at_death',
    ],
    weak: ['start_at_my_death', 'remainder_to_children'],
    incompatible: ['tax_illinois_estate', 'tax_federal_estate', 'fund_annual_gift_exclusion'],
    caveats: ['Container for sub-trusts at death — does not itself reduce estate tax'],
    why:
      'Revocable living trust — probate avoidance and incapacity planning; may split into tax sub-trusts at death per your formula.',
  },
  {
    slug: 'testamentary',
    glossaryAnchor: 'testamentary-trust',
    name: 'Testamentary trust',
    strong: ['start_at_my_death', 'fund_at_death'],
    weak: ['access_staged_ages', 'remainder_to_children', 'beneficiary_children'],
    incompatible: ['start_during_life', 'fund_annual_gift_exclusion', 'access_grantor_control'],
    caveats: ['Created under will or RLT formula at death'],
    why:
      'Testamentary trust — springs from your will or living trust at death for staged inheritances and spendthrift protection.',
  },
  {
    slug: 'a-trust',
    glossaryAnchor: 'a-trust-survivors-trust',
    name: "A trust (survivor's trust)",
    strong: ['beneficiary_spouse', 'start_during_life', 'access_grantor_control'],
    weak: ['start_at_first_spouse_death', 'remainder_to_children'],
    incompatible: ['fund_annual_gift_exclusion'],
    caveats: ['Survivor\'s own revocable trust in A-B-C planning — not the bypass trust'],
    why:
      "Survivor's revocable trust — holds the surviving spouse's property in an A-B-C plan.",
  },
  {
    slug: 'c-trust',
    glossaryAnchor: 'c-trust-marital-qtip',
    name: 'C trust (marital QTIP)',
    strong: [
      'beneficiary_spouse',
      'start_at_first_spouse_death',
      'remainder_to_children',
      'access_fixed_income',
    ],
    weak: ['tax_illinois_estate', 'tax_federal_estate'],
    incompatible: ['fund_annual_gift_exclusion', 'start_during_life'],
    caveats: ['Marital share above bypass in A-B-C plan; requires QTIP election'],
    why:
      'C trust marital QTIP — holds marital share after bypass is funded in an A-B-C plan.',
  },
  {
    slug: 'disclaimer',
    glossaryAnchor: 'disclaimer-trust-plan',
    name: 'Disclaimer trust plan',
    strong: ['start_at_first_spouse_death', 'tax_federal_estate', 'remainder_to_children'],
    weak: ['tax_illinois_estate', 'beneficiary_spouse'],
    incompatible: ['start_during_life', 'fund_annual_gift_exclusion'],
    caveats: ['Survivor must disclaim within nine months — post-death flexibility'],
    why:
      'Disclaimer trust plan — surviving spouse disclaims assets into a bypass trust after first death.',
  },
  {
    slug: 'child-age-stage',
    glossaryAnchor: 'testamentary-child-age-stage-trust',
    name: 'Child / age-stage trust',
    strong: ['access_staged_ages', 'start_at_my_death', 'fund_at_death', 'beneficiary_children'],
    weak: ['remainder_to_grandchildren', 'structure_fixed_slice'],
    incompatible: ['start_during_life', 'fund_annual_gift_exclusion'],
    caveats: ['Staged principal distributions at specified ages'],
    why:
      'Testamentary age-stage trust — releases principal to children at milestones such as 25, 30, and 35.',
  },
  {
    slug: 'bloodline',
    glossaryAnchor: 'bloodline-descendants-trust',
    name: 'Bloodline / descendants trust',
    strong: ['beneficiary_descendants', 'remainder_per_stirpes', 'constraint_creditor_protection'],
    weak: ['beneficiary_children', 'beneficiary_grandchildren'],
    incompatible: ['beneficiary_spouse', 'beneficiary_charity'],
    caveats: ['Excludes spouses of descendants as remainder beneficiaries'],
    why:
      'Bloodline trust — remainder stays in the family bloodline, often with per stirpes distribution.',
  },
  {
    slug: 'conduit',
    glossaryAnchor: 'conduit-trust',
    name: 'Conduit trust',
    strong: ['constraint_ira_assets', 'constraint_creditor_protection'],
    weak: ['beneficiary_children', 'start_at_my_death'],
    incompatible: ['fund_annual_gift_exclusion', 'fund_life_insurance'],
    caveats: ['SECURE Act 10-year payout rules for most non-spouse beneficiaries'],
    why:
      'IRA see-through conduit trust — passes retirement distributions to beneficiaries within IRS windows.',
  },
  {
    slug: 'accumulation',
    glossaryAnchor: 'accumulation-trust',
    name: 'Accumulation trust',
    strong: ['constraint_ira_assets', 'constraint_creditor_protection', 'access_discretionary_needs'],
    weak: ['beneficiary_children'],
    incompatible: ['fund_annual_gift_exclusion', 'access_fixed_income'],
    caveats: ['Trust-level tax at compressed brackets on retained IRA income'],
    why:
      'IRA see-through accumulation trust — may retain distributions inside the trust for trustee control.',
  },
  {
    slug: 'snt',
    glossaryAnchor: 'special-needs-trust-snt',
    name: 'Special needs trust',
    strong: ['constraint_special_needs', 'beneficiary_one_person'],
    weak: ['beneficiary_children', 'start_at_my_death', 'fund_at_death'],
    incompatible: ['access_fixed_income', 'structure_shared_pool'],
    caveats: ['Strict distribution rules to preserve Medicaid/SSI eligibility'],
    why:
      'Special needs trust — supplements a disabled beneficiary without disqualifying means-tested public benefits.',
  },
  {
    slug: 'slat',
    glossaryAnchor: 'slat',
    name: 'SLAT',
    strong: [
      'beneficiary_spouse',
      'start_during_life',
      'fund_lifetime_exemption',
      'access_discretionary_needs',
    ],
    weak: ['tax_federal_estate', 'remainder_to_children'],
    incompatible: ['access_grantor_control', 'fund_annual_gift_exclusion'],
    caveats: ['Reciprocal trust doctrine risk if both spouses create mirror SLATs'],
    why:
      'Spousal lifetime access trust — irrevocable gift for spouse with indirect access; uses lifetime exemption.',
  },
  {
    slug: 'grat',
    glossaryAnchor: 'grat',
    name: 'GRAT',
    strong: ['start_during_life', 'fund_lifetime_exemption', 'tax_federal_estate'],
    weak: ['beneficiary_children', 'remainder_to_children'],
    incompatible: ['fund_annual_gift_exclusion', 'access_grantor_control', 'tax_not_primary'],
    caveats: ['Mortality risk — if grantor dies during term, assets return to estate'],
    why:
      'Grantor retained annuity trust — freezes gift value of appreciating assets transferred during life.',
  },
  {
    slug: 'idgt',
    glossaryAnchor: 'idgt',
    name: 'IDGT',
    strong: ['start_during_life', 'fund_lifetime_exemption', 'tax_federal_estate', 'tax_gst_multigen'],
    weak: ['beneficiary_descendants', 'remainder_to_grandchildren'],
    incompatible: ['access_grantor_control', 'fund_annual_gift_exclusion', 'tax_not_primary'],
    caveats: ['Grantor pays income tax — intentional defect for estate planning'],
    why:
      'Intentionally defective grantor trust — sale or gift of assets with grantor paying trust income tax.',
  },
  {
    slug: 'qprt',
    glossaryAnchor: 'qprt',
    name: 'QPRT',
    strong: ['start_during_life', 'fund_lifetime_exemption', 'tax_federal_estate'],
    weak: ['beneficiary_children', 'remainder_to_children'],
    incompatible: ['fund_annual_gift_exclusion', 'access_grantor_control', 'structure_shared_pool'],
    caveats: ['Grantor must survive the retained term or home returns to estate'],
    why:
      'Qualified personal residence trust — transfers home at discounted gift value while retaining use for a term.',
  },
  {
    slug: 'crt',
    glossaryAnchor: 'crt',
    name: 'CRT',
    strong: ['beneficiary_charity', 'tax_federal_estate', 'access_fixed_income'],
    weak: ['remainder_to_children', 'fund_lifetime_exemption'],
    incompatible: ['structure_fixed_slice', 'fund_annual_gift_exclusion', 'tax_not_primary'],
    caveats: ['Charitable remainder — income to grantor or others, remainder to charity'],
    why:
      'Charitable remainder trust — income stream for life or term with remainder to charity; estate and income tax benefits.',
  },
  {
    slug: 'clt',
    glossaryAnchor: 'clt',
    name: 'CLT',
    strong: ['beneficiary_charity', 'tax_federal_estate', 'tax_gst_multigen'],
    weak: ['remainder_to_children', 'beneficiary_descendants'],
    incompatible: ['fund_annual_gift_exclusion', 'tax_not_primary'],
    caveats: ['Charitable lead — charity receives payments first, remainder to heirs'],
    why:
      'Charitable lead trust — charity receives lead interest; remainder passes to family at reduced gift/estate tax cost.',
  },
]

/** @type {Map<string, IntentMapping>} */
export const INTENT_MAPPINGS_BY_SLUG = new Map(
  INTENT_MAPPINGS.map((entry) => [entry.slug, entry]),
)
