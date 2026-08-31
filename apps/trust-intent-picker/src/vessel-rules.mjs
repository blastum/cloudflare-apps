/**
 * Required / optional / forbidden clause bundles per named vessel.
 * A vessel is a nickname for a locked core; add-ons never redefine the job.
 *
 * @typedef {Object} ClauseRule
 * @property {string} [id] Catalog id (C01–C20, A01–A04)
 * @property {string} [label] Override or fact label when there is no catalog id
 * @property {string} why
 *
 * @typedef {Object} VesselRule
 * @property {string} slug
 * @property {'vessel' | 'structure' | 'specialty'} kind
 * @property {string} nutshell
 * @property {string} job
 * @property {ClauseRule[]} required
 * @property {ClauseRule[]} optional
 * @property {ClauseRule[]} forbidden
 * @property {string[]} [companions]
 * @property {string} [splitHint]
 */

/**
 * @param {string} [id]
 * @param {string} why
 * @param {string} [label]
 * @returns {ClauseRule}
 */
function r(id, why, label) {
  /** @type {ClauseRule} */
  const rule = { why }
  if (id) rule.id = id
  if (label) rule.label = label
  return rule
}

/** Optional clauses that cannot both be on at once.
 * @type {readonly [string, string][]}
 */
export const EXCLUSIVE_ADDON_PAIRS = [
  ['C02', 'C03'],
  ['C05', 'C06'],
]

/** @type {Record<string, Omit<VesselRule, 'slug'>>} */
const RULES = {
  'crummey-trust': {
    kind: 'vessel',
    nutshell:
      'Irrevocable gift trust with notice and a temporary withdrawal right so each year’s transfer qualifies for the annual exclusion.',
    job: 'Move wealth during life using the annual exclusion, usually into separate shares.',
    required: [
      r('A01', 'Completed gift — you cannot take the money back.', 'Irrevocable once funded'),
      r('C01', 'Without the right and notice, the gift is a future interest.'),
      r('C03', 'Annual exclusion is per donee; a shared pool fights that math.'),
    ],
    optional: [
      r('C04', 'Once the withdrawal window lapses, lock the share against creditors.'),
      r('C05', 'How tightly the trustee must justify later distributions.'),
      r('C09', 'Tie later payouts to school, work, or similar milestones.'),
      r('C10', 'Someone can replace a bad trustee without giving the child the fund.'),
      r('C11', 'Discourages a beneficiary from suing to break the gift.'),
      r('C12', 'If grandchildren are donees, GST exemption is a separate knob from the annual exclusion.'),
      r('C08', 'Lets later trustees adapt terms without a court rewrite.'),
    ],
    forbidden: [
      r('C02', 'A spray pot is a hard fit with per-donee annual exclusion.'),
      r('C13', 'Marital deduction is a death-time estate job, not an annual-gift vehicle.'),
      r('C18', 'A right to withdraw is a countable resource for a disabled donee — use an SNT share instead.'),
    ],
  },

  'separate-share': {
    kind: 'structure',
    nutshell:
      'At death, each beneficiary gets a fixed slice with no reallocation between shares. Usually a remainder pattern inside an RLT or dynasty, not a tax vehicle by itself.',
    job: 'Keep each heir’s inheritance in their own pocket.',
    required: [
      r('C03', 'Fixed slice or sub-trust per person — that is the identity of this pattern.'),
    ],
    optional: [
      r('C04', 'Blocks creditors and assignments on each share.'),
      r('C05', 'Classic ascertainable standard for each share.'),
      r('C09', 'Milestones on a given child’s share.'),
      r('C10', 'Removal power per share or for the whole instrument.'),
      r('C15', 'If a share should last for descendants of that child.'),
    ],
    forbidden: [
      r('C02', 'A pot reallocates by need — the opposite of a fixed slice.'),
      r('C01', 'Crummey powers belong on a lifetime gift trust, not this death-time split.'),
    ],
    splitHint: 'This is a remainder structure. Tax jobs (bypass, GST, Crummey) live on other vessels.',
  },

  pot: {
    kind: 'structure',
    nutshell:
      'One pooled fund for a class; the trustee pays by need until the class may split into separate shares. Often a remainder of an RLT, not a standalone tax vehicle.',
    job: 'One pool the trustee can spray among children or grandchildren by need.',
    required: [
      r('C02', 'Shared pool with trustee allocation — that is the identity of a pot.'),
    ],
    optional: [
      r('C04', 'Protects the pool from a beneficiary’s creditors.'),
      r('C05', 'HEMS is the usual standard while the pot is open.'),
      r('C10', 'Someone can replace a trustee who plays favorites.'),
      r('C12', 'If grandchildren are in the class, consider GST status.'),
      r('C15', 'Keep the pot open across generations, or split at a milestone.'),
      r('C08', 'Decant later if the class or law changes.'),
    ],
    forbidden: [
      r('C03', 'Fixed slices cannot be a pot — pick one structure.'),
      r('C01', 'Annual-exclusion gifts want per-donee shares, not a spray pool as the gift vehicle.'),
    ],
    companions: ['rlt', 'dynasty'],
    splitHint: 'A pot is usually how an RLT or dynasty remainder is shared — not a substitute for bypass or Crummey.',
  },

  'b-trust': {
    kind: 'vessel',
    nutshell:
      'Uses the deceased spouse’s federal and Illinois exemption at first death, supports the survivor under tight terms, and passes remainder to the children — this fund does not qualify for the marital deduction.',
    job: 'Shelter exemption at first death while the survivor is still provided for.',
    required: [
      r('A01', 'Exemption is used when the first spouse dies.', 'Irrevocable at first death'),
      r('C20', 'Pours in the unused exemption amount, not the whole estate.'),
      r('C05', 'Support without giving the spouse a general power of appointment.'),
      r(undefined, 'Remainder to children or descendants — that is the bypass.', 'Remainder defined'),
    ],
    optional: [
      r('C04', 'Protects the spouse’s interest from creditors and a later divorce.'),
      r('C07', 'Limited power among descendants — not to creditors or the spouse’s estate.'),
      r('C08', 'Administration flexibility; does not change the tax job.'),
      r('C10', 'Removal/replacement without giving the spouse estate-tax control.'),
      r('C11', 'Contest control.'),
      r('C12', 'If grandchildren are in the remainder, lock GST status at first death.'),
      r('C14', 'Who pays estate or GST tax among the bypass and the marital share.'),
      r('C15', 'If remainder should last for more than one generation.'),
    ],
    forbidden: [
      r('C13', 'If it QTIPs, it is in the survivor’s estate — that is a different vessel sitting next to this one.'),
      r('C01', 'Bypass is funded at death from the estate, not by annual-exclusion gifts.'),
      r('C06', 'Wide-open principal for the spouse can look like a general power and pull the fund back into their estate.'),
      r('C18', 'A disabled remainder beneficiary needs an SNT share, not SNT rules for the spouse’s lifetime interest.'),
    ],
    companions: ['qtip'],
    splitHint: 'The marital share is a second vessel (QTIP). Bypass plus QTIP is an A/B or Clayton plan, not one contradictory trust.',
  },

  qtip: {
    kind: 'vessel',
    nutshell:
      'Defers estate tax via the marital deduction — spouse supported for life, remainder to children; assets stay in the survivor’s estate unless a later bypass or portability applies.',
    job: 'Qualify the rest of the estate for the marital deduction so tax is deferred, not eliminated.',
    required: [
      r('C13', 'Spouse income for life plus the Form 706 QTIP election — that is the identity.'),
      r(undefined, 'No general power in the spouse that would blow the QTIP rules.', 'Spouse has no general power of appointment'),
    ],
    optional: [
      r('C04', 'Spendthrift on the spouse’s income interest.'),
      r('C05', 'Principal invasions, if any, usually on an ascertainable standard.'),
      r('C06', 'Some marital drafts give the trustee liberal principal for the spouse — still not a general power.'),
      r('C07', 'Limited testamentary power among descendants is common.'),
      r('C10', 'Trustee succession.'),
      r('C14', 'Tax apportionment between marital and bypass.'),
    ],
    forbidden: [
      r('C20', 'A QTIP is the marital share. The exemption formula belongs on the bypass sitting next to it.'),
      r('C15', 'A perpetual dynasty is the opposite of “this is in the survivor’s estate.”'),
      r('C01', 'Not an annual-gift vehicle.'),
      r('C18', 'Special-needs drafting for the spouse fights marital-deduction income mandates.'),
    ],
    companions: ['b-trust'],
    splitHint: 'QTIP defers tax. Bypass uses exemption. Most plans want both, as two vessels.',
  },

  marital: {
    kind: 'vessel',
    nutshell:
      'Qualifies property for the unlimited marital deduction at death so tax is deferred. QTIP is the usual modern form; this is the family of marital vessels.',
    job: 'Get the marital deduction on the share that is not going into the bypass.',
    required: [
      r('C13', 'Marital-deduction provisions — income to spouse, remainder controlled.'),
    ],
    optional: [
      r('C04', 'Spendthrift on the spouse’s interest.'),
      r('C05', 'Principal standard, if invasions are allowed.'),
      r('C07', 'Limited power of appointment.'),
      r('C10', 'Trustee succession.'),
      r('C14', 'Tax apportionment.'),
    ],
    forbidden: [
      r('C20', 'Exemption funding is the bypass, not this share.'),
      r('C01', 'Not an annual-gift vehicle.'),
    ],
    companions: ['b-trust'],
  },

  'clayton-qtip': {
    kind: 'vessel',
    nutshell:
      'Funds bypass up to the exemption first, then pours the rest to a marital QTIP. One formula, two vessels.',
    job: 'At first death, fill the exemption trust, then marital-deduct the rest — with a post-death election.',
    required: [
      r('C20', 'Exemption amount goes to the bypass first.'),
      r('C13', 'Residue can be QTIPed so the marital deduction is available on the rest.'),
    ],
    optional: [
      r('C04', 'Spendthrift on both resulting shares.'),
      r('C07', 'Limited powers on the QTIP remainder.'),
      r('C10', 'Trustee succession.'),
      r('C14', 'Who pays tax after the split.'),
    ],
    forbidden: [
      r('C01', 'This is a death-time formula, not Crummey gifting.'),
    ],
    companions: ['b-trust', 'qtip'],
    splitHint: 'Clayton is a funding switch between bypass and QTIP — inspect those two vessels for the actual clauses.',
  },

  dynasty: {
    kind: 'vessel',
    nutshell:
      'Locks GST exemption into an irrevocable, long-duration trust so descendants can benefit for as many generations as Illinois (or the chosen situs) allows.',
    job: 'Multi-generation family wealth, not a one-time inheritance.',
    required: [
      r('A01', 'Exemption is used at funding; you cannot unwind it.', 'Irrevocable once funded'),
      r('C12', 'Marks the trust GST-exempt so later skips are not taxed again.'),
      r('C15', 'Keeps the trust alive for descendants within RAP / Illinois limits.'),
      r(undefined, 'Future grandchildren and great-grandchildren are included.', 'Descendants as a growing class'),
    ],
    optional: [
      r('C04', 'Blocks creditors, divorcing spouses, and assignments.'),
      r('C02', 'One pool by need among the class.'),
      r('C03', 'A slice per bloodline instead of a pot.'),
      r('C05', 'Tighter ascertainable standard.'),
      r('C06', 'Wider trustee latitude — common on long-duration trusts.'),
      r('C07', 'Limited power so a child can redirect among descendants, not out of the bloodline.'),
      r('C08', 'Lets later trustees adapt terms.'),
      r('C09', 'Incentive language on a given descendant’s access.'),
      r('C10', 'Trust protector / removal so the trust can outlive the original trustee.'),
      r('C11', 'No-contest, if you expect a fight.'),
    ],
    forbidden: [
      r('C13', 'Marital deduction puts assets in the survivor’s estate; dynasty wants them out.'),
      r('C18', 'One disabled descendant needs an SNT share — not SNT rules for the whole class.'),
      r('C20', 'Bypass is a first-death exemption shelter for the spouse. Dynasty is a multi-gen skip vehicle. They can be sequential, not the same clause set.'),
    ],
    splitHint: 'A disabled grandchild should get a supplemental-needs subtrust, not dynasty HEMS for everyone.',
  },

  ilit: {
    kind: 'vessel',
    nutshell:
      'Owns life insurance outside your taxable estate; premiums are often funded with Crummey annual-exclusion gifts.',
    job: 'Keep insurance proceeds out of the estate and available for liquidity or heirs.',
    required: [
      r('A01', 'If you own the policy, it is in your estate.', 'Irrevocable; you do not own the policy'),
      r('C01', 'Premium gifts usually need Crummey rights to use the annual exclusion.'),
    ],
    optional: [
      r('C04', 'Protect proceeds after they land in the trust.'),
      r('C05', 'How insured’s family later takes distributions.'),
      r('C10', 'Independent trustee is typical so incidents of ownership stay away from you.'),
      r('C12', 'GST if proceeds will benefit grandchildren.'),
    ],
    forbidden: [
      r('C13', 'An ILIT is not a marital deduction vehicle.'),
      r('C20', 'Not a bypass funding formula — different job.'),
    ],
  },

  rlt: {
    kind: 'vessel',
    nutshell:
      'A will substitute you control during life. At death it is a funnel: it can pour into bypass, QTIP, pot, SNT, or dynasty shares. The RLT itself is not those trusts.',
    job: 'Probate avoidance and lifetime control; tax and protective jobs happen in the subtrusts it creates.',
    required: [
      r('A01', 'That is the point of an RLT.', 'Revocable and amendable by you'),
      r(undefined, 'You keep using the assets as owner in substance.', 'You as initial trustee'),
      r('A02', 'Unfunded RLT does not avoid probate.', 'Funded during life'),
    ],
    optional: [
      r(undefined, 'This is where bypass, QTIP, pot, or SNT vessels are born.', 'At-death formula / pour-over instructions',),
      r('C10', 'Successor trustees for disability and death.'),
      r('C11', 'No-contest on the remainder pattern.'),
      r('C14', 'Tax apportionment among the subtrusts.'),
    ],
    forbidden: [
      r('C04', 'Your creditors can generally reach a revocable trust — spendthrift-for-yourself is theater.'),
      r('C12', 'A revocable trust uses no GST exemption and builds no skip shield.'),
      r('C15', 'Dynasty duration on a revocable trust is empty — the core is still yours.'),
      r('C01', 'Gifts to yourself are not completed gifts.'),
    ],
    splitHint: 'Protective and tax jobs live in the irrevocable subtrusts the RLT funds at death — open those vessels next.',
  },

  testamentary: {
    kind: 'vessel',
    nutshell:
      'Springs from your will or living trust at death — staged inheritances, spendthrift, pot or shares. A container, not a tax election.',
    job: 'Hold an inheritance in trust after you die instead of handing it over outright.',
    required: [
      r('A02', 'Created at death under will or RLT formula.', 'Testamentary — funded at death'),
    ],
    optional: [
      r('C02', 'Spray by need among a class.'),
      r('C03', 'Fixed slice per heir.'),
      r('C04', 'Creditor protection after death.'),
      r('C05', 'HEMS while the trust is open.'),
      r('C09', 'Age or milestone releases.'),
      r('C10', 'Successor trustees.'),
      r('C17', 'If an IRA is payable to this trust, see-through drafting is required.'),
      r('C18', 'One share can be an SNT.'),
    ],
    forbidden: [
      r('C01', 'Crummey is a lifetime gift tool, not a will-trust.'),
    ],
    companions: ['rlt'],
  },

  'a-trust': {
    kind: 'vessel',
    nutshell: "Survivor's own revocable share in an A-B-C plan — not the bypass trust.",
    job: 'The survivor keeps control of their half / marital share, amendable.',
    required: [
      r('A01', 'The survivor can rewrite their own share.', 'Revocable by the surviving spouse'),
    ],
    optional: [
      r('C10', 'Successor trustees.'),
    ],
    forbidden: [
      r('C20', 'Bypass is the B share. This is the A share.'),
      r('C12', 'GST planning does not live on a revocable survivor’s share.'),
    ],
    companions: ['b-trust', 'c-trust'],
  },

  'c-trust': {
    kind: 'vessel',
    nutshell: 'Marital QTIP share in an A-B-C plan after the bypass is funded.',
    job: 'The marital-deduction residue once exemption has gone to B.',
    required: [
      r('C13', 'QTIP / marital deduction on this share.'),
    ],
    optional: [
      r('C04', 'Spendthrift on the spouse’s income.'),
      r('C07', 'Limited power of appointment.'),
      r('C10', 'Trustee succession.'),
    ],
    forbidden: [
      r('C20', 'Exemption already went to B.'),
    ],
    companions: ['b-trust', 'a-trust'],
  },

  disclaimer: {
    kind: 'specialty',
    nutshell:
      'Survivor disclaims into a bypass trust after first death — post-death flexibility instead of a mandatory formula.',
    job: 'Decide after death whether unused exemption should be used, by disclaimer.',
    required: [
      r('C20', 'What is disclaimed needs a bypass waiting to receive it.'),
    ],
    optional: [
      r('C04', 'On the resulting bypass.'),
      r('C05', 'On the resulting bypass.'),
    ],
    forbidden: [
      r('C01', 'Not a lifetime gift tool.'),
    ],
    companions: ['b-trust', 'qtip'],
  },

  'child-age-stage': {
    kind: 'structure',
    nutshell: 'Releases principal to children at set ages (e.g. 25, 30, 35). A distribution schedule, not a tax vessel.',
    job: 'Staged outright inheritance instead of a lifetime trust.',
    required: [
      r(undefined, 'Principal at stated ages — that is the identity.', 'Staged ages'),
    ],
    optional: [
      r('C04', 'Spendthrift until an age hits.'),
      r('C05', 'HEMS before the age gates.'),
      r('C09', 'Extra gates (graduate, stay sober) on top of ages.'),
    ],
    forbidden: [
      r('C18', 'An age-dump defeats supplemental-needs planning.'),
      r('C15', 'Ages that empty the trust are the opposite of dynasty duration.'),
    ],
  },

  bloodline: {
    kind: 'structure',
    nutshell: 'Keeps remainder in the family bloodline, excluding in-laws as beneficiaries. A remainder restriction, not a tax vessel.',
    job: 'Children’s spouses do not take as remainder beneficiaries.',
    required: [
      r(undefined, 'Remainder limited to descendants — in-laws are out.', 'Bloodline remainder'),
    ],
    optional: [
      r('C07', 'Limited power among descendants only.'),
      r('C04', 'Spendthrift on each bloodline share.'),
      r('C15', 'Often paired with dynasty duration.'),
    ],
    forbidden: [
      r('C13', 'A marital QTIP remainder can still be bloodline, but QTIP itself is a different vessel.'),
    ],
  },

  conduit: {
    kind: 'specialty',
    nutshell:
      'See-through IRA trust that passes retirement distributions out to beneficiaries as received — simpler RMD rules, less trustee control.',
    job: 'Name a trust as IRA beneficiary without blowing stretch / see-through status, by paying RMDs out.',
    required: [
      r('C17', 'Conduit payout of retirement distributions — required for this pattern.'),
    ],
    optional: [
      r('C04', 'Spendthrift on what has been paid out and is still in trust, if anything remains.'),
      r('C10', 'Trustee succession.'),
    ],
    forbidden: [
      r('C18', 'Forcing RMDs out to a disabled beneficiary can wreck SSI/Medicaid — accumulation + SNT is the other path.'),
      r('C01', 'IRA see-through is not Crummey gifting.'),
    ],
    companions: ['accumulation', 'snt'],
    splitHint: 'If a beneficiary is on public benefits, do not use conduit for that share — use an accumulation SNT.',
  },

  accumulation: {
    kind: 'specialty',
    nutshell:
      'See-through IRA trust that may retain distributions inside for trustee control — tighter drafting, more protection.',
    job: 'IRA payable to a trust that can hold RMDs instead of spraying them out.',
    required: [
      r('C17', 'Accumulation see-through rules — identifiable beneficiaries, no non-individuals.'),
    ],
    optional: [
      r('C04', 'Stronger creditor protection because funds can stay in trust.'),
      r('C05', 'HEMS on accumulated amounts.'),
      r('C06', 'Discretion to retain.'),
      r('C10', 'Trustee succession.'),
      r('C18', 'One share can be supplemental-needs if that beneficiary is disabled.'),
    ],
    forbidden: [
      r('C01', 'Not a Crummey gift trust.'),
    ],
    companions: ['conduit', 'snt'],
  },

  snt: {
    kind: 'vessel',
    nutshell:
      'Pay for extras that Medicaid and SSI will not cover, without making the trust a countable resource for the child.',
    job: 'Protect public benefits while funding a better life for one disabled beneficiary.',
    required: [
      r('C18', 'Distributions supplement benefits; they do not replace them.'),
      r('C06', 'An ascertainable support standard can look like a countable right.'),
      r('C04', 'The child cannot assign or demand the fund.'),
      r(undefined, 'Usually siblings or a dynasty remainder, not the child’s estate.', 'Remainder after the child’s death'),
    ],
    optional: [
      r('C10', 'Someone can replace a bad trustee without giving the child control.'),
      r('C08', 'Decant if benefits law changes.'),
      r('C11', 'If relatives may contest.'),
      r('C12', 'If this share sits inside a GST-exempt remainder.'),
    ],
    forbidden: [
      r('C05', 'Support / HEMS language can disqualify SSI/Medicaid.'),
      r('C01', 'A right to withdraw is a countable resource.'),
      r(undefined, 'An outright dump at an age defeats benefits planning.', 'Staged ages (25/30/35)'),
      r('C13', 'Marital-deduction income mandates fight supplemental-needs discretion.'),
    ],
  },

  slat: {
    kind: 'vessel',
    nutshell:
      'Irrevocable lifetime gift for the spouse’s benefit — uses exemption while preserving indirect access through the spouse.',
    job: 'Use lifetime exemption now, keep a back-door via the spouse, remainder to descendants.',
    required: [
      r('A01', 'Completed gift using lifetime exemption.', 'Irrevocable lifetime gift'),
      r('C16', 'Typically a grantor trust so you pay income tax — a further gift to the remainder.'),
    ],
    optional: [
      r('C04', 'Spendthrift on the spouse’s interest.'),
      r('C06', 'Liberal distributions to the spouse are common.'),
      r('C05', 'Tighter HEMS is also used.'),
      r('C07', 'Limited power in the spouse.'),
      r('C10', 'Independent trustee is safer for completed-gift treatment.'),
      r('C12', 'GST if remainder skips.'),
    ],
    forbidden: [
      r('C13', 'A SLAT is a lifetime completed gift, not a death-time QTIP election.'),
      r('C01', 'Lifetime exemption, not annual-exclusion Crummey (unless you also layer Crummey — unusual).'),
    ],
  },

  grat: {
    kind: 'specialty',
    nutshell:
      'Freezes the gift value of appreciating assets you transfer during a retained annuity term. Remainder (hopefully) to heirs tax-free.',
    job: 'Shift future appreciation out of the estate using a retained annuity.',
    required: [
      r('A01', 'Completed transfer of the remainder interest.', 'Irrevocable for the term'),
      r(undefined, 'You keep a qualified annuity for a stated term.', 'Retained annuity'),
    ],
    optional: [
      r('C10', 'Independent trustee.'),
      r('C12', 'GST on remainder is constrained — GRATs are awkward skip vehicles.'),
    ],
    forbidden: [
      r('C13', 'Not a marital deduction trust.'),
      r('C18', 'Not an SNT.'),
      r('C01', 'The gift is the remainder, valued under 2702 — not Crummey annual exclusion as the core.'),
    ],
  },

  idgt: {
    kind: 'specialty',
    nutshell:
      'Irrevocable trust where you intentionally pay the income tax so more wealth stays in the trust for heirs. Often funded by a sale, not a gift.',
    job: 'Shift assets to heirs while you pick up the income-tax tab.',
    required: [
      r('A01', 'Completed transfer for estate-tax purposes.', 'Irrevocable'),
      r('C16', 'Grantor-trust status is the point — you pay the tax.'),
    ],
    optional: [
      r('C04', 'Spendthrift for remainder beneficiaries.'),
      r('C10', 'Independent trustee.'),
      r('C12', 'GST if it is also a skip trust.'),
      r('C15', 'May be dynastic.'),
    ],
    forbidden: [
      r('C13', 'Not a QTIP.'),
    ],
  },

  qprt: {
    kind: 'specialty',
    nutshell:
      'Transfers a home at a discounted gift value while you keep the right to live there for a term. You must outlive the term.',
    job: 'Move a residence to heirs at a frozen gift value.',
    required: [
      r('A01', 'Remainder is a completed gift.', 'Irrevocable for the term'),
      r(undefined, 'You occupy the house for a stated term.', 'Retained residence term'),
    ],
    optional: [
      r('C10', 'Trustee if someone other than you holds title mechanics.'),
    ],
    forbidden: [
      r('C13', 'Not marital deduction.'),
      r('C18', 'Not an SNT.'),
    ],
  },

  crt: {
    kind: 'specialty',
    nutshell:
      'Income for life or a term, then remainder to charity — estate and income tax benefits.',
    job: 'Keep an income stream, leave the rest to charity, take the deduction.',
    required: [
      r(undefined, 'Remainder is a qualifying charity.', 'Charitable remainder'),
    ],
    optional: [
      r('C10', 'Trustee.'),
    ],
    forbidden: [
      r('C15', 'Remainder is charity, not dynasty descendants.'),
      r('C18', 'Not an SNT.'),
      r('C01', 'Not Crummey gifting to descendants as the core.'),
    ],
  },

  clt: {
    kind: 'specialty',
    nutshell:
      'Charity receives lead payments; family receives remainder at reduced transfer-tax cost.',
    job: 'Give charity the front end so family remainder is a cheaper gift.',
    required: [
      r(undefined, 'Lead interest to a qualifying charity.', 'Charitable lead'),
    ],
    optional: [
      r('C12', 'GST math on the remainder is a known planning use.'),
      r('C15', 'Remainder can be dynastic.'),
      r('C10', 'Trustee.'),
    ],
    forbidden: [
      r('C13', 'Not a marital QTIP.'),
      r('C01', 'Not an annual-exclusion Crummey core.'),
    ],
  },
}

/** @type {Map<string, VesselRule>} */
export const VESSEL_RULES = new Map(
  Object.entries(RULES).map(([slug, rule]) => [slug, { slug, ...rule }]),
)

/**
 * @param {string} slug
 * @returns {VesselRule | undefined}
 */
export function vesselRule(slug) {
  return VESSEL_RULES.get(slug)
}

/** @type {string[]} */
export const VESSEL_SLUGS = [...VESSEL_RULES.keys()]

/**
 * Optional catalog ids that may be toggled on this vessel.
 * @param {string} slug
 * @returns {string[]}
 */
export function optionalClauseIds(slug) {
  return (VESSEL_RULES.get(slug)?.optional ?? []).map((row) => row.id).filter(Boolean)
}

/**
 * @param {string} slug
 * @param {Iterable<string>} addons
 * @returns {string[]}
 */
export function allowedAddons(slug, addons) {
  const allowed = new Set(optionalClauseIds(slug))
  const forbidden = new Set(
    (VESSEL_RULES.get(slug)?.forbidden ?? []).map((row) => row.id).filter(Boolean),
  )
  return [...addons].filter((id) => allowed.has(id) && !forbidden.has(id))
}
