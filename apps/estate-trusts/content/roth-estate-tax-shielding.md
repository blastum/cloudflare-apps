# Roth IRAs, trusts, and estate-tax shielding

Educational overview; not legal or tax advice. Illinois situs assumed.

Companion to [roth-iras-and-trusts.md](roth-iras-and-trusts.md) (SECURE Act payouts, see-through rules). This note focuses on what is actually includible in the estate and how to minimize transfer tax on Roth-heavy estates.

## Core fact: Roth is in the estate

A Roth IRA balance is included in the gross estate at fair market value on the date of death (Form 706 / Illinois Form 700). Beneficiaries generally receive distributions income-tax-free, but estate tax applies to the account value unless an exclusion, marital deduction, or charitable deduction applies.

You cannot move a Roth out of the estate while keeping it inside an IRA. There is no "Roth to irrevocable trust" during life without a taxable distribution first.

## What actually shields Roth from estate tax

<table>
<tr><th>Strategy</th><th>How it works</th><th>Limits</th></tr>
<tr><td>Pay conversion tax from non-IRA assets</td><td>Lifetime traditional→Roth conversions shrink the trad IRA in the estate; income tax paid from brokerage/cash reduces estate dollar-for-dollar</td><td>Roth balance still includible; you trade estate for income tax</td></tr>
<tr><td>Spouse as primary beneficiary + rollover</td><td>At first death, surviving spouse rolls Roth into own Roth — marital deduction on Form 706/700; no tax at first death</td><td>Full balance in survivor's estate at second death unless other planning used</td></tr>
<tr><td>Bypass / credit-shelter at first death (non-Roth assets)</td><td>Fund bypass trust up to Illinois $4M exclusion with house, brokerage, etc.; Roth passes to spouse by beneficiary designation</td><td>Illinois exclusion not portable — must use first spouse's $4M on non-Roth assets; Roth itself does not fund bypass</td></tr>
<tr><td>Charitable beneficiary on Roth</td><td>Church (or other 501(c)(3)) named on custodian form — estate charitable deduction; no income tax to charity</td><td>Reduces heirs' share; partial designation possible (split beneficiaries)</td></tr>
<tr><td>Lifetime gifts after Roth withdrawal</td><td>Withdraw Roth (tax-free if qualified), gift cash or securities to heirs or trust</td><td>Uses annual exclusion / lifetime credit; loses tax-free growth inside Roth; step-up lost on gifted assets</td></tr>
<tr><td>QCD from traditional IRA</td><td>Reduces trad IRA at death; cannot use Roth for QCD</td><td>Does not shield Roth; complements Roth-heavy plan by shrinking trad IRA</td></tr>
</table>

Federal estate tax: likely $0 at ~$9M gross with 2026-era exclusions. Illinois estate tax: the main driver — ~$800k if both exclusions wasted vs ~$286k if first spouse's $4M bypass is used. See [illinois-estate-planner-prep.md](../projects/inheritance-research/documents/illinois-estate-planner-prep.md).

## The real decision: leave Illinois or pay

For a Roth-heavy ~$9M estate, federal planning is largely solved. Illinois is not portable and taxes gross estate over $4M. Most of your wealth is Roth — it must stay in IRAs until death, so it always counts in the gross estate. Bypass/QTIP, conduit trusts, and beneficiary forms reduce the bill (on the order of hundreds of thousands) but do not eliminate it while you remain Illinois residents at death.

<table>
<tr><th>Path</th><th>Outcome</th><th>Catch</th></tr>
<tr><td>Stay in Illinois</td><td>Pay Illinois estate tax — roughly $300k–$800k depending on bypass use and growth</td><td>Trust drafting still worth it to use both $4M exclusions and avoid the high end</td></tr>
<tr><td>Change domicile before death</td><td>No Illinois estate tax on non-Illinois situs assets (IRAs, most brokerage)</td><td>Must actually establish new domicile; Illinois real estate and tangible property in IL still taxed (apportioned on Form 700-Addendum); audit risk if ties to IL remain</td></tr>
</table>

Trust and Roth beneficiary planning is how you optimize within "stay and pay." It is not a substitute for residency choice. If you will not move, the honest plan is: Clayton QTIP + bypass, correct beneficiary forms, then budget for Illinois tax.

States with no estate/inheritance tax on your profile (e.g. Tennessee — no inheritance tax for 2016+ decedents, no trust income tax for 2021+): [tn-inheritance-tax-summary](../documents/tn-inheritance-tax-summary.md), [tn-hall-income-tax-repeal-summary](../documents/tn-hall-income-tax-repeal-summary.md). Domicile change requires counsel; do not rely on a vacation home or short stay.

## What does not shield Roth (common mistakes)

<table>
<tr><th>Mistake</th><th>Why it fails</th></tr>
<tr><td>Name bypass trust or QTIP as Roth beneficiary</td><td>Roth lands in marital/bypass structure unnecessarily; may break spousal rollover; QTIP brings Roth back into survivor's estate without benefit</td></tr>
<tr><td>Name unfunded revocable living trust as Roth beneficiary without see-through drafting</td><td>Trust may not qualify as see-through; compressed payout; estate still includes Roth</td></tr>
<tr><td>Name estate as beneficiary</td><td>Least favorable payout; probate; no stretch</td></tr>
<tr><td>Assume Roth is "already tax-free" so beneficiary form does not matter</td><td>Estate tax and SECURE Act 10-year compliance still apply</td></tr>
<tr><td>Fund bypass with Roth at first death</td><td>Wastes income-tax-free character; poor split — bypass should hold non-retirement assets</td></tr>
</table>

## Married couple: coordinated playbook (Roth-heavy)

At first death the estate plan should split non-Roth assets (Clayton QTIP / bypass formula per [ab-abc-trust-plan.md](ab-abc-trust-plan.md)). Roth accounts pass outside the trust funding formula via beneficiary designation:

<br>1. Primary beneficiary: surviving spouse (spousal rollover).<br>
2. Contingent: child outright, or see-through conduit trust if creditor/spendthrift protection needed.<br>
3. Optional partial contingent: charity on a separate Roth account or percentage split.<br>
4. Do not route Roth through bypass or QTIP sub-trusts.

Roth-heavy implication: most survivor liquidity may be tax-free Roth distributions while Illinois tax planning operates on house, brokerage, and any trad IRA remainder.

## Trust as Roth beneficiary (when you want protection)

A trust is not a designated beneficiary, but individuals behind a qualifying see-through trust can be. Requirements (Pub. 590-B): valid trust; irrevocable at death; identifiable beneficiaries; trustee documentation to custodian.

<table>
<tr><th>Trust type</th><th>Estate tax</th><th>Payout / compliance</th><th>Use when</th></tr>
<tr><td>Conduit (see-through)</td><td>Roth still in decedent's estate; no estate shield</td><td>All IRA/Roth distributions paid out to individuals immediately; 10-year rule measured through individuals</td><td>Child needs spendthrift/creditor protection; bloodline trust</td></tr>
<tr><td>Accumulation</td><td>Same</td><td>Harder stretch; trust-level 10-year; undistributed Roth income still tax-free but trust may file 1041</td><td>Rare for Roth; usually worse</td></tr>
<tr><td>Testamentary remainder (funded at death from bypass)</td><td>Bypass assets already excluded at first death</td><td>Trust holds cash/securities from bypass, not Roth</td><td>Grandchildren / dynasty; fund with non-Roth bypass remainder</td></tr>
</table>

Estate-tax shielding for heirs at second death: fund dynasty or testamentary trusts from bypass trust remainder (non-Roth), not from Roth beneficiary designation. GST allocation on Form 709 applies to those transfers.

## If you stay in Illinois — minimize, not eliminate

<br>1. Clayton QTIP + bypass on house/brokerage at first death; Roth → spouse by beneficiary designation.<br>
2. Roth conversions; pay tax from taxable accounts (shrinks estate, not IL rate).<br>
3. Second death: Roth → Heather (outright) or conduit trust; bypass remainder to bloodline/GST trust.<br>
4. Charitable Roth beneficiary for church bequest (estate deduction, no income tax).<br>
5. Lifetime 529 / annual exclusion gifts — marginal on a Roth-heavy estate.

## Beneficiary designation template (discussion draft)

<table>
<tr><th>Account</th><th>Primary</th><th>Contingent</th></tr>
<tr><td>Each Roth IRA</td><td>Surviving spouse</td><td>Heather (outright) or Heather conduit see-through trust; optional church % on separate account</td></tr>
<tr><td>Trad IRA (QCD pool)</td><td>Surviving spouse</td><td>Church or estate residue per QCD plan — do not block QCD mechanics</td></tr>
<tr><td>Brokerage / house</td><td>RLT / will formula</td><td>Bypass + QTIP funding at first death</td></tr>
</table>

## Annual checklist

<br>- Beneficiary forms match trust instrument (no bypass/QTIP on Roth).<br>
- RLT funded for house and brokerage.<br>
- Form 700 / 706 filed at first death if bypass/QTIP funded.<br>
- See-through trust documentation delivered to custodian within deadlines after death.<br>
- Revisit after law changes, account openings, or grandchild births.

## Sources

- [roth-iras-and-trusts.md](roth-iras-and-trusts.md)
- [ab-abc-trust-plan.md](ab-abc-trust-plan.md)
- [illinois-estate-planner-prep.md](../projects/inheritance-research/documents/illinois-estate-planner-prep.md)
- [strategies-overview.md](strategies-overview.md)
- [p590b-distributions-from-individual-retirement-arrangements-iras-summary](../irs-documents/documents/p590b-distributions-from-individual-retirement-arrangements-iras-summary.md)
- [il-form-700-estate-tax-instructions-summary](../documents/il-form-700-estate-tax-instructions-summary.md)
