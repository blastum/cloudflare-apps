import { BASE } from './routes.mjs'

/**
 * Related links keyed by page slug (trusts/x or guides/x etc.).
 * @type {Record<string, { title: string, href: string }[]>}
 */
export const RELATED = {
  'trusts/rlt': [
    { title: 'Wills and pour-over', href: `${BASE}/documents/wills/` },
    { title: 'Inheritance flow', href: `${BASE}/guides/inheritance-flow/` },
    { title: 'Document checklist', href: `${BASE}/documents/checklist/` },
    { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
  ],
  'trusts/testamentary': [
    { title: 'Wills and pour-over', href: `${BASE}/documents/wills/` },
    { title: 'Child / age-stage trust', href: `${BASE}/trusts/child-age-stage/` },
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
  ],
  'trusts/a-trust': [
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
    { title: 'C trust', href: `${BASE}/trusts/c-trust/` },
  ],
  'trusts/b-trust': [
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'Illinois computation', href: `${BASE}/illinois/computation/` },
    { title: 'Illinois tax chart', href: `${BASE}/illinois/chart/` },
    { title: 'Glossary A–Z', href: `${BASE}/glossary/` },
  ],
  'trusts/c-trust': [
    { title: 'QTIP trust', href: `${BASE}/trusts/qtip/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'Illinois computation', href: `${BASE}/illinois/computation/` },
  ],
  'trusts/marital': [
    { title: 'QTIP trust', href: `${BASE}/trusts/qtip/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'C trust', href: `${BASE}/trusts/c-trust/` },
  ],
  'trusts/qtip': [
    { title: 'C trust', href: `${BASE}/trusts/c-trust/` },
    { title: 'Clayton QTIP', href: `${BASE}/trusts/clayton-qtip/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'Illinois computation', href: `${BASE}/illinois/computation/` },
  ],
  'trusts/clayton-qtip': [
    { title: 'QTIP trust', href: `${BASE}/trusts/qtip/` },
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
  ],
  'trusts/disclaimer': [
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
    { title: 'Portability-only plan', href: `${BASE}/trusts/portability/` },
  ],
  'trusts/portability': [
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
  ],
  'trusts/child-age-stage': [
    { title: 'Pot trust', href: `${BASE}/trusts/pot/` },
    { title: 'Bloodline trust', href: `${BASE}/trusts/bloodline/` },
    { title: 'Testamentary trust', href: `${BASE}/trusts/testamentary/` },
  ],
  'trusts/bloodline': [
    { title: 'Pot trust', href: `${BASE}/trusts/pot/` },
    { title: 'Dynasty / GST-exempt', href: `${BASE}/trusts/dynasty/` },
    { title: 'Child / age-stage', href: `${BASE}/trusts/child-age-stage/` },
  ],
  'trusts/pot': [
    { title: 'Child / age-stage', href: `${BASE}/trusts/child-age-stage/` },
    { title: 'Bloodline trust', href: `${BASE}/trusts/bloodline/` },
    { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
  ],
  'trusts/conduit': [
    { title: 'Roth IRAs and trusts', href: `${BASE}/guides/roth-iras/` },
    { title: 'Accumulation trust', href: `${BASE}/trusts/accumulation/` },
    { title: 'Glossary A–Z', href: `${BASE}/glossary/` },
  ],
  'trusts/accumulation': [
    { title: 'Roth IRAs and trusts', href: `${BASE}/guides/roth-iras/` },
    { title: 'Conduit trust', href: `${BASE}/trusts/conduit/` },
    { title: 'Trust taxation and GST', href: `${BASE}/guides/trust-taxation-gst/` },
  ],
  'trusts/dynasty': [
    { title: 'Trust taxation and GST', href: `${BASE}/guides/trust-taxation-gst/` },
    { title: 'Bloodline trust', href: `${BASE}/trusts/bloodline/` },
  ],
  'trusts/snt': [
    { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
    { title: 'Document checklist', href: `${BASE}/documents/checklist/` },
  ],
  'trusts/ilit': [
    { title: 'Glossary A–Z (Crummey)', href: `${BASE}/glossary/` },
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
    { title: 'SLAT', href: `${BASE}/trusts/slat/` },
  ],
  'trusts/slat': [
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
    { title: 'IDGT', href: `${BASE}/trusts/idgt/` },
    { title: 'ILIT', href: `${BASE}/trusts/ilit/` },
  ],
  'trusts/grat': [
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
    { title: 'IDGT', href: `${BASE}/trusts/idgt/` },
  ],
  'trusts/idgt': [
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
    { title: 'SLAT', href: `${BASE}/trusts/slat/` },
    { title: 'Trust taxation and GST', href: `${BASE}/guides/trust-taxation-gst/` },
  ],
  'trusts/qprt': [
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
    { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
  ],
  'trusts/crt': [
    { title: 'CLT', href: `${BASE}/trusts/clt/` },
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
  ],
  'trusts/clt': [
    { title: 'CRT', href: `${BASE}/trusts/crt/` },
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
  ],
  'guides/ab-abc': [
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
    { title: 'C trust / QTIP', href: `${BASE}/trusts/qtip/` },
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'Strategies overview', href: `${BASE}/guides/strategies/` },
  ],
  'guides/trusts-overview': [
    { title: 'Trust types index', href: `${BASE}/trusts/` },
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
  ],
  'guides/strategies': [
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'Trust types index', href: `${BASE}/trusts/` },
    { title: 'Tax treatment', href: `${BASE}/guides/tax-treatment/` },
  ],
  'illinois/bypass': [
    { title: 'B trust', href: `${BASE}/trusts/b-trust/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'Illinois computation', href: `${BASE}/illinois/computation/` },
    { title: 'Illinois tax chart', href: `${BASE}/illinois/chart/` },
  ],
  'illinois/computation': [
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'Illinois tax chart', href: `${BASE}/illinois/chart/` },
    { title: 'HB2368', href: `${BASE}/illinois/hb2368/` },
  ],
  'illinois/chart': [
    { title: 'Illinois computation', href: `${BASE}/illinois/computation/` },
    { title: 'Bypass and first-death tax', href: `${BASE}/illinois/bypass/` },
    { title: 'HB2368', href: `${BASE}/illinois/hb2368/` },
  ],
  'illinois/hb2368': [
    { title: 'Illinois computation', href: `${BASE}/illinois/computation/` },
    { title: 'Illinois tax chart', href: `${BASE}/illinois/chart/` },
  ],
  'guides/roth-iras': [
    { title: 'Conduit trust', href: `${BASE}/trusts/conduit/` },
    { title: 'Accumulation trust', href: `${BASE}/trusts/accumulation/` },
    { title: 'Roth estate tax shielding', href: `${BASE}/guides/roth-estate-shield/` },
  ],
  'guides/trust-taxation-gst': [
    { title: 'Dynasty / GST-exempt', href: `${BASE}/trusts/dynasty/` },
    { title: 'Tax treatment', href: `${BASE}/guides/tax-treatment/` },
  ],
  'documents/wills': [
    { title: 'Revocable living trust', href: `${BASE}/trusts/rlt/` },
    { title: 'Document checklist', href: `${BASE}/documents/checklist/` },
    { title: 'Inheritance flow', href: `${BASE}/guides/inheritance-flow/` },
  ],
  'documents/checklist': [
    { title: 'Financial POA', href: `${BASE}/documents/financial-poa/` },
    { title: 'Healthcare directives', href: `${BASE}/documents/healthcare/` },
    { title: 'Wills and pour-over', href: `${BASE}/documents/wills/` },
  ],
  'documents/financial-poa': [
    { title: 'Healthcare directives', href: `${BASE}/documents/healthcare/` },
    { title: 'Document checklist', href: `${BASE}/documents/checklist/` },
    { title: 'Revocable living trust', href: `${BASE}/trusts/rlt/` },
  ],
  'documents/healthcare': [
    { title: 'Financial POA', href: `${BASE}/documents/financial-poa/` },
    { title: 'Document checklist', href: `${BASE}/documents/checklist/` },
  ],
  glossary: [
    { title: 'Trust types index', href: `${BASE}/trusts/` },
    { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
    { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
  ],
}

export function relatedFor(slug) {
  return RELATED[slug] ?? []
}
