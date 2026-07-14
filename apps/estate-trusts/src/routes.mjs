/** @typedef {{ title: string, path: string, section: string }} NavItem */

export const BASE = '/estate-trusts'

/** Whole-note articles (not split from glossary-and-trust-types). */
export const ARTICLES = [
  {
    slug: 'guides/trusts-overview',
    title: 'Trusts overview',
    section: 'guides',
    source: 'trusts-overview-for-estates.md',
  },
  {
    slug: 'guides/ab-abc',
    title: 'A-B and A-B-C plans',
    section: 'guides',
    source: 'ab-abc-trust-plan.md',
  },
  {
    slug: 'guides/strategies',
    title: 'Strategies overview',
    section: 'guides',
    source: 'strategies-overview.md',
  },
  {
    slug: 'guides/inheritance-flow',
    title: 'Inheritance flow',
    section: 'guides',
    source: 'inheritance-flow.md',
  },
  {
    slug: 'guides/tax-treatment',
    title: 'Tax treatment',
    section: 'guides',
    source: 'tax-treatment.md',
  },
  {
    slug: 'guides/trust-taxation-gst',
    title: 'Trust taxation and GST',
    section: 'guides',
    source: 'trust-taxation-and-gst.md',
  },
  {
    slug: 'guides/roth-iras',
    title: 'Roth IRAs and trusts',
    section: 'guides',
    source: 'roth-iras-and-trusts.md',
  },
  {
    slug: 'guides/roth-estate-shield',
    title: 'Roth estate tax shielding',
    section: 'guides',
    source: 'roth-estate-tax-shielding.md',
  },
  {
    slug: 'guides/weaknesses',
    title: 'Weaknesses and limitations',
    section: 'guides',
    source: 'weaknesses-and-limitations.md',
  },
  {
    slug: 'guides/costs',
    title: 'Costs',
    section: 'guides',
    source: 'costs.md',
  },
  {
    slug: 'illinois/bypass',
    title: 'Bypass trusts and first-death tax',
    section: 'illinois',
    source: 'bypass-trust-and-first-death-tax.md',
  },
  {
    slug: 'illinois/computation',
    title: 'Illinois estate tax computation',
    section: 'illinois',
    source: 'illinois-estate-tax-computation.md',
  },
  {
    slug: 'illinois/chart',
    title: 'Illinois estate tax chart',
    section: 'illinois',
    source: 'illinois-estate-tax-chart-3.9m-6m.md',
  },
  {
    slug: 'illinois/hb2368',
    title: 'HB2368 (proposed reform)',
    section: 'illinois',
    source: 'hb2368.md',
  },
  {
    slug: 'documents/checklist',
    title: 'Document checklist',
    section: 'documents',
    source: 'estate-planning-document-checklist.md',
  },
  {
    slug: 'documents/wills',
    title: 'Wills and pour-over',
    section: 'documents',
    source: 'wills-and-pour-over.md',
  },
  {
    slug: 'documents/financial-poa',
    title: 'Financial power of attorney',
    section: 'documents',
    source: 'financial-power-of-attorney.md',
  },
  {
    slug: 'documents/healthcare',
    title: 'Incapacity and healthcare directives',
    section: 'documents',
    source: 'incapacity-and-healthcare-directives.md',
  },
  {
    slug: 'glossary',
    title: 'Glossary A–Z',
    section: 'glossary',
    source: 'estate-planning-glossary.md',
  },
]

/**
 * Trust-type pages split from glossary-and-trust-types.md.
 * `heading` matches the ### line text (without ###).
 */
export const TRUST_TYPES = [
  {
    slug: 'rlt',
    title: 'Revocable living trust (RLT)',
    heading: 'Revocable living trust (RLT)',
    group: 'Probate and everyday trusts',
  },
  {
    slug: 'testamentary',
    title: 'Testamentary trust',
    heading: 'Testamentary trust',
    group: 'Probate and everyday trusts',
  },
  {
    slug: 'a-trust',
    title: 'A trust (survivor’s trust)',
    heading: "A trust (survivor's trust)",
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'b-trust',
    title: 'B trust (bypass / credit shelter)',
    heading: 'B trust (bypass / credit shelter / family trust)',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'c-trust',
    title: 'C trust (marital QTIP)',
    heading: 'C trust (marital QTIP)',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'marital',
    title: 'Marital trust',
    heading: 'Marital trust',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'qtip',
    title: 'QTIP trust',
    heading: 'QTIP trust',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'clayton-qtip',
    title: 'Clayton QTIP',
    heading: 'Clayton QTIP',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer trust plan',
    heading: 'Disclaimer trust plan',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'portability',
    title: 'Portability-only plan',
    heading: 'Portability-only plan (not a trust)',
    group: 'Married-couple estate-tax trusts',
  },
  {
    slug: 'child-age-stage',
    title: 'Child / age-stage trust',
    heading: 'Testamentary child / age-stage trust',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'bloodline',
    title: 'Bloodline / descendants trust',
    heading: 'Bloodline / descendants trust',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'pot',
    title: 'Pot trust',
    heading: 'Pot trust',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'conduit',
    title: 'Conduit trust',
    heading: 'Conduit trust',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'accumulation',
    title: 'Accumulation trust',
    heading: 'Accumulation trust',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'dynasty',
    title: 'Dynasty / GST-exempt trust',
    heading: 'Dynasty / GST-exempt trust',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'snt',
    title: 'Special needs trust (SNT)',
    heading: 'Special needs trust (SNT)',
    group: 'Descendant and inheritance-control trusts',
  },
  {
    slug: 'ilit',
    title: 'ILIT',
    heading: 'ILIT',
    group: 'Lifetime irrevocable trusts',
  },
  {
    slug: 'slat',
    title: 'SLAT',
    heading: 'SLAT',
    group: 'Lifetime irrevocable trusts',
  },
  {
    slug: 'grat',
    title: 'GRAT',
    heading: 'GRAT',
    group: 'Lifetime irrevocable trusts',
  },
  {
    slug: 'idgt',
    title: 'IDGT',
    heading: 'IDGT',
    group: 'Lifetime irrevocable trusts',
  },
  {
    slug: 'qprt',
    title: 'QPRT',
    heading: 'QPRT',
    group: 'Lifetime irrevocable trusts',
  },
  {
    slug: 'crt',
    title: 'CRT',
    heading: 'CRT',
    group: 'Charitable trusts',
  },
  {
    slug: 'clt',
    title: 'CLT',
    heading: 'CLT',
    group: 'Charitable trusts',
  },
]

/** Map basename or relative .md path → site path (no trailing slash). */
export function buildLinkMap() {
  /** @type {Record<string, string>} */
  const map = {
    'glossary-and-trust-types.md': `${BASE}/trusts`,
    'estate-planning-glossary.md': `${BASE}/glossary`,
  }

  for (const article of ARTICLES) {
    map[article.source] = `${BASE}/${article.slug}`
  }

  // Aliases used in notebook links
  map['bypass-trust-and-first-death-tax.md'] = `${BASE}/illinois/bypass`
  map['./bypass-trust-and-first-death-tax.md'] = `${BASE}/illinois/bypass`
  map['./illinois-estate-tax-computation.md'] = `${BASE}/illinois/computation`
  map['./illinois-estate-tax-chart-3.9m-6m.md'] = `${BASE}/illinois/chart`
  map['./hb2368.md'] = `${BASE}/illinois/hb2368`
  map['illinois-estate-tax-computation.md'] = `${BASE}/illinois/computation`
  map['illinois-estate-tax-chart-3.9m-6m.md'] = `${BASE}/illinois/chart`
  map['hb2368.md'] = `${BASE}/illinois/hb2368`

  // Trust-type anchor remaps from quick index style
  for (const t of TRUST_TYPES) {
    map[`#${slugifyAnchor(t.heading)}`] = `${BASE}/trusts/${t.slug}`
  }

  return map
}

export function urlForSlug(slug) {
  return slug === '' ? `${BASE}/` : `${BASE}/${slug}/`
}

export function slugifyAnchor(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** @returns {NavItem[]} */
export function navForSection(section) {
  if (section === 'trusts') {
    return TRUST_TYPES.map((t) => ({
      title: t.title,
      path: `${BASE}/trusts/${t.slug}/`,
      section: 'trusts',
    }))
  }
  if (section === 'glossary') {
    return [{ title: 'Glossary A–Z', path: `${BASE}/glossary/`, section: 'glossary' }]
  }
  return ARTICLES.filter((a) => a.section === section).map((a) => ({
    title: a.title,
    path: `${BASE}/${a.slug}/`,
    section: a.section,
  }))
}
