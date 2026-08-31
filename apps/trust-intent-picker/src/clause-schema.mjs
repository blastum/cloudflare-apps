/**
 * Canonical trust clause catalog (C01–C20) and type attributes (A01–A04).
 * Single source for UI labels and sync output.
 *
 * @typedef {'typical' | 'optional' | 'unusual' | 'no' | 'n/a'} CoverageValue
 * @typedef {Object} ClauseDef
 * @property {string} id
 * @property {string} label
 * @property {'clause' | 'attribute'} group
 * @property {string} description
 */

/** @type {ClauseDef[]} */
export const CLAUSE_CATALOG = [
  {
    id: 'C01',
    label: 'Crummey withdrawal rights',
    group: 'clause',
    description: 'Notice plus temporary withdrawal right so gifts qualify for the annual exclusion.',
  },
  {
    id: 'C02',
    label: 'Pot / spray / sprinkle',
    group: 'clause',
    description: 'Shared pool; trustee allocates among class members by need.',
  },
  {
    id: 'C03',
    label: 'Separate share',
    group: 'clause',
    description: 'Fixed slice or sub-trust per beneficiary; no cross-share reallocation.',
  },
  {
    id: 'C04',
    label: 'Spendthrift clause',
    group: 'clause',
    description: 'Anti-alienation language limiting creditors, divorcing spouses, and voluntary assignments.',
  },
  {
    id: 'C05',
    label: 'HEMS / ascertainable standard',
    group: 'clause',
    description: 'Health, education, maintenance, and support — classic ascertainable standard.',
  },
  {
    id: 'C06',
    label: 'Pure discretionary distributions',
    group: 'clause',
    description: 'Trustee discretion without an ascertainable standard.',
  },
  {
    id: 'C07',
    label: 'Power of appointment',
    group: 'clause',
    description: 'Lets a holder redirect remainder interests (general, limited, testamentary, or inter vivos).',
  },
  {
    id: 'C08',
    label: 'Decanting provision',
    group: 'clause',
    description: 'Authorizes moving trust assets to a new trust with different terms.',
  },
  {
    id: 'C09',
    label: 'Incentive clauses',
    group: 'clause',
    description: 'Ties distributions to milestones such as education, employment, or sobriety.',
  },
  {
    id: 'C10',
    label: 'Trustee removal / replacement',
    group: 'clause',
    description: 'Beneficiary, trust protector, or court power to replace trustees.',
  },
  {
    id: 'C11',
    label: 'In terrorem / no-contest',
    group: 'clause',
    description: 'Penalizes beneficiaries who challenge the trust or will.',
  },
  {
    id: 'C12',
    label: 'GST exemption allocation',
    group: 'clause',
    description: 'Locks generation-skipping transfer tax status at funding.',
  },
  {
    id: 'C13',
    label: 'QTIP / marital deduction',
    group: 'clause',
    description: 'Spouse income for life with Form 706 marital deduction election.',
  },
  {
    id: 'C14',
    label: 'Tax apportionment',
    group: 'clause',
    description: 'Allocates estate, GST, or generation tax among beneficiaries and trusts.',
  },
  {
    id: 'C15',
    label: 'Dynasty / perpetual',
    group: 'clause',
    description: 'Duration language to keep trust going within state rule-against-perpetuities limits.',
  },
  {
    id: 'C16',
    label: 'Grantor-trust income tax status',
    group: 'attribute',
    description: 'Whether grantor pays income tax on trust earnings (IRC §§ 671–679), separate from revocability.',
  },
  {
    id: 'C17',
    label: 'See-through / conduit / accumulation',
    group: 'clause',
    description: 'IRA beneficiary trust rules — conduit payout vs accumulation inside trust.',
  },
  {
    id: 'C18',
    label: 'Special / supplemental needs',
    group: 'clause',
    description: 'SNT language preserving public benefits while supplementing care.',
  },
  {
    id: 'C19',
    label: 'Distribution standard taxonomy',
    group: 'clause',
    description: 'Whether distributions follow an ascertainable standard (HEMS) or fully discretionary language.',
  },
  {
    id: 'C20',
    label: 'Bypass / exemption funding formula',
    group: 'clause',
    description:
      'Pours the unused federal and state estate-tax exemption into a bypass trust at first death — the identity clause of a B trust.',
  },
  {
    id: 'A01',
    label: 'Revocable vs irrevocable',
    group: 'attribute',
    description: 'Whether the grantor can revoke or amend the trust.',
  },
  {
    id: 'A02',
    label: 'Inter vivos vs testamentary',
    group: 'attribute',
    description: 'Living trust vs trust created at death under will or RLT formula.',
  },
  {
    id: 'A03',
    label: 'When created',
    group: 'attribute',
    description: 'During life, at grantor death, or at first spouse death.',
  },
  {
    id: 'A04',
    label: 'Beneficiary pool structure',
    group: 'attribute',
    description: 'Pooled pot vs separate share per beneficiary.',
  },
]

/** @type {Map<string, ClauseDef>} */
export const CLAUSE_BY_ID = new Map(CLAUSE_CATALOG.map((entry) => [entry.id, entry]))

/** @type {string[]} */
export const CLAUSE_IDS = CLAUSE_CATALOG.filter((entry) => entry.group === 'clause').map(
  (entry) => entry.id,
)

/** @type {string[]} */
export const ATTRIBUTE_IDS = CLAUSE_CATALOG.filter((entry) => entry.group === 'attribute').map(
  (entry) => entry.id,
)
