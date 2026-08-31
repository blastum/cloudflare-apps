/** One-line purpose for each catalog trust type (nutshell). */
export const TRUST_SUMMARIES = {
  'crummey-trust':
    'Irrevocable gift trust with Crummey withdrawal powers — annual exclusion gifts to children or grandchildren in separate shares.',
  'separate-share':
    'At death, each beneficiary gets a fixed slice with no reallocation between shares.',
  pot: 'One pooled fund for a class; the trustee pays by need until the class may split into separate shares.',
  'b-trust':
    'Uses the federal and state estate tax exemption at first death while still supporting the surviving spouse for life, with remainder to children.',
  qtip: 'Defers estate tax via the marital deduction — spouse supported for life, remainder to children; assets stay in the survivor’s estate.',
  marital:
    'Qualifies property for the unlimited marital deduction at death so tax is deferred, not eliminated.',
  'clayton-qtip':
    'Funds bypass up to the exemption first, then pours the rest to a marital QTIP for the spouse.',
  dynasty:
    'Locks in GST exemption so descendants can benefit for generations within state duration limits.',
  ilit: 'Owns life insurance outside your taxable estate; premiums often funded with Crummey annual-exclusion gifts.',
  rlt: 'Revocable container during life for probate avoidance; may divide into tax sub-trusts at death.',
  testamentary: 'Springs from your will or living trust at death — staged inheritances and spendthrift protection.',
  'a-trust': "Survivor's own revocable share in an A-B-C plan — not the bypass trust.",
  'c-trust': 'Marital QTIP share in an A-B-C plan after the bypass is funded.',
  disclaimer: 'Survivor disclaims into a bypass trust after first death — post-death flexibility.',
  'child-age-stage': 'Releases principal to children at set ages (e.g. 25, 30, 35).',
  bloodline: 'Keeps remainder in the family bloodline, excluding in-laws as beneficiaries.',
  conduit: 'See-through IRA trust that passes retirement distributions out to beneficiaries quickly.',
  accumulation: 'See-through IRA trust that may retain distributions inside for trustee control.',
  snt: 'Supplements a disabled beneficiary without disqualifying Medicaid or SSI.',
  slat: 'Irrevocable lifetime gift for spouse’s benefit — uses exemption while preserving indirect access.',
  grat: 'Freezes the gift value of appreciating assets you transfer during a retained annuity term.',
  idgt: 'Irrevocable trust where you intentionally pay the income tax to shift wealth to heirs.',
  qprt: 'Transfers a home at a discounted gift value while you keep the right to live there for a term.',
  crt: 'Income for life or a term, then remainder to charity — estate and income tax benefits.',
  clt: 'Charity receives lead payments; family receives remainder at reduced transfer tax cost.',
}

/**
 * @param {string} slug
 * @param {string} [fallbackWhy]
 */
export function trustSummary(slug, fallbackWhy = '') {
  const summary = TRUST_SUMMARIES[slug]
  if (summary) return summary
  const first = fallbackWhy.split(/[.—]/)[0]?.trim()
  return first ? `${first}.` : slug
}
