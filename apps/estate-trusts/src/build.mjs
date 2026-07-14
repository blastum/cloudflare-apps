import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARTICLES,
  TRUST_TYPES,
  BASE,
  urlForSlug,
} from './routes.mjs'
import { renderMarkdown, splitTrustTypesDoc, mapHref } from './markdown.mjs'
import { renderPage, breadcrumbs, pager, relatedRail, escapeHtml } from './chrome.mjs'
import { relatedFor } from './related.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'content')
const dist = join(root, 'dist')
const stylesSrc = join(root, 'styles')

async function writeHtml(relPath, html) {
  const out = join(dist, relPath)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, html, 'utf8')
}

async function readContent(name) {
  return readFile(join(contentDir, name), 'utf8')
}

function stripLeadingH1(md) {
  return md.replace(/^#\s+[^\n]+\n+/, '')
}

function homeBody() {
  return `
    <h1>Estate Trusts</h1>
    <p class="lede">
      Hyperlinked educational hub for trust types, marital A-B / A-B-C planning,
      Illinois estate tax notes, and related primers. Not legal or tax advice.
    </p>
    <div class="entry-grid">
      <a class="entry-card" href="${BASE}/trusts/">
        <h2>Trust types</h2>
        <p>Facet tables for RLT, bypass, QTIP, pot, ILIT, and more.</p>
      </a>
      <a class="entry-card" href="${BASE}/guides/ab-abc/">
        <h2>A-B planning</h2>
        <p>How marital splits work at first death, with Illinois context.</p>
      </a>
      <a class="entry-card" href="${BASE}/illinois/bypass/">
        <h2>Illinois</h2>
        <p>Bypass trusts, Form 700 computation, tax chart, proposed reform.</p>
      </a>
      <a class="entry-card" href="${BASE}/glossary/">
        <h2>Glossary</h2>
        <p>Alphabetical lookup — Crummey, pecuniary, Clayton, DSUE, and more.</p>
      </a>
    </div>
    <h2>Also browse</h2>
    <ul>
      <li><a href="${BASE}/guides/trusts-overview/">Trusts overview</a></li>
      <li><a href="${BASE}/guides/strategies/">Strategies overview</a></li>
      <li><a href="${BASE}/documents/checklist/">Document checklist</a></li>
    </ul>
  `
}

function trustsIndexBody(prefaceHtml, incomeTaxHtml, groups) {
  const groupBlocks = groups
    .map(([group, items]) => {
      const lis = items
        .map(
          (t) =>
            `<li><a href="${BASE}/trusts/${t.slug}/">${escapeHtml(t.title)}</a></li>`,
        )
        .join('')
      return `<h3>${escapeHtml(group)}</h3><ul class="type-list">${lis}</ul>`
    })
    .join('\n')

  return `
    <h1>Trust types</h1>
    ${prefaceHtml}
    <h2>Browse by group</h2>
    ${groupBlocks}
    ${incomeTaxHtml ? `<section class="income-tax">${incomeTaxHtml}</section>` : ''}
  `
}

async function buildTrustPages() {
  const full = await readContent('glossary-and-trust-types.md')
  const { preface, sections, incomeTax } = splitTrustTypesDoc(full)

  /** @type {Map<string, string>} */
  const byHeading = new Map(sections.map((s) => [s.heading, s.body]))

  const missing = TRUST_TYPES.filter((t) => !byHeading.has(t.heading))
  if (missing.length) {
    console.warn(
      'Missing trust-type headings in source:',
      missing.map((m) => m.heading),
    )
    console.warn('Found headings:', [...byHeading.keys()])
  }

  // Remap quick-index anchors in preface to trust pages before render
  let prefaceMd = preface
  for (const t of TRUST_TYPES) {
    const anchor = mapHref(
      `#${t.heading
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`,
    )
    // Also fix HTML <a href="#..."> in preface via renderMarkdown remapHtmlHrefs
    void anchor
  }

  const prefaceHtml = renderMarkdown(prefaceMd)
  const incomeTaxHtml = incomeTax ? renderMarkdown(incomeTax) : ''

  /** @type {Map<string, typeof TRUST_TYPES>} */
  const groupMap = new Map()
  for (const t of TRUST_TYPES) {
    if (!groupMap.has(t.group)) groupMap.set(t.group, [])
    groupMap.get(t.group).push(t)
  }

  const indexHtml = renderPage({
    title: 'Trust types',
    activeSection: 'trusts',
    breadcrumbsHtml: breadcrumbs([
      { label: 'Home', href: `${BASE}/` },
      { label: 'Trust types' },
    ]),
    bodyHtml: trustsIndexBody(prefaceHtml, incomeTaxHtml, [...groupMap.entries()]),
    relatedHtml: relatedRail([
      { title: 'Glossary A–Z', href: `${BASE}/glossary/` },
      { title: 'A-B and A-B-C plans', href: `${BASE}/guides/ab-abc/` },
      { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
    ]),
  })
  await writeHtml('trusts/index.html', indexHtml)

  for (let i = 0; i < TRUST_TYPES.length; i++) {
    const t = TRUST_TYPES[i]
    const bodyMd = byHeading.get(t.heading)
    if (!bodyMd) continue

    const prev = i > 0 ? TRUST_TYPES[i - 1] : null
    const next = i < TRUST_TYPES.length - 1 ? TRUST_TYPES[i + 1] : null

    const bodyHtml = `<h1>${escapeHtml(t.title)}</h1>\n${renderMarkdown(bodyMd)}`
    const page = renderPage({
      title: t.title,
      activeSection: 'trusts',
      breadcrumbsHtml: breadcrumbs([
        { label: 'Home', href: `${BASE}/` },
        { label: 'Trust types', href: `${BASE}/trusts/` },
        { label: t.title },
      ]),
      pagerHtml: pager({
        indexHref: `${BASE}/trusts/`,
        indexLabel: 'All types',
        prev: prev
          ? { title: prev.title, href: `${BASE}/trusts/${prev.slug}/` }
          : null,
        next: next
          ? { title: next.title, href: `${BASE}/trusts/${next.slug}/` }
          : null,
      }),
      bodyHtml,
      relatedHtml: relatedRail([
        ...relatedFor(`trusts/${t.slug}`),
        { title: 'Trust taxation and GST', href: `${BASE}/guides/trust-taxation-gst/` },
      ]),
    })
    await writeHtml(`trusts/${t.slug}/index.html`, page)
  }
}

async function buildArticles() {
  for (const article of ARTICLES) {
    const md = stripLeadingH1(await readContent(article.source))
    const bodyHtml = `<h1>${escapeHtml(article.title)}</h1>\n${renderMarkdown(md)}`
    const crumbs = [
      { label: 'Home', href: `${BASE}/` },
    ]
    if (article.section === 'guides') {
      crumbs.push({ label: 'Guides', href: `${BASE}/guides/trusts-overview/` })
    } else if (article.section === 'illinois') {
      crumbs.push({ label: 'Illinois', href: `${BASE}/illinois/bypass/` })
    } else if (article.section === 'documents') {
      crumbs.push({ label: 'Documents', href: `${BASE}/documents/checklist/` })
    }
    crumbs.push({ label: article.title })

    const page = renderPage({
      title: article.title,
      activeSection: article.section,
      breadcrumbsHtml: breadcrumbs(crumbs),
      bodyHtml,
      relatedHtml: relatedRail(relatedFor(article.slug)),
    })
    await writeHtml(`${article.slug}/index.html`, page)
  }
}

async function buildGuidesIndex() {
  const guides = ARTICLES.filter((a) => a.section === 'guides')
  const lis = guides
    .map(
      (g) =>
        `<li><a href="${BASE}/${g.slug}/">${escapeHtml(g.title)}</a></li>`,
    )
    .join('')
  // Guides has no dedicated index in plan; first guide is nav target.
  // Still useful: redirect-style mini index unused. Skip.
  void lis
}

async function main() {
  await rm(dist, { recursive: true, force: true })
  await mkdir(dist, { recursive: true })
  await mkdir(join(dist, 'styles'), { recursive: true })
  await cp(join(stylesSrc, 'site.css'), join(dist, 'styles', 'site.css'))

  const home = renderPage({
    title: 'Home',
    activeSection: '',
    bodyHtml: homeBody(),
  })
  await writeHtml('index.html', home)

  await buildTrustPages()
  await buildArticles()
  await buildGuidesIndex()

  // Documents section index
  const docs = ARTICLES.filter((a) => a.section === 'documents')
  const docsList = docs
    .map((d) => `<li><a href="${BASE}/${d.slug}/">${escapeHtml(d.title)}</a></li>`)
    .join('')
  await writeHtml(
    'documents/index.html',
    renderPage({
      title: 'Documents',
      activeSection: 'documents',
      breadcrumbsHtml: breadcrumbs([
        { label: 'Home', href: `${BASE}/` },
        { label: 'Documents' },
      ]),
      bodyHtml: `<h1>Documents</h1><ul>${docsList}</ul>`,
      relatedHtml: relatedRail([
        { title: 'Trust types', href: `${BASE}/trusts/` },
        { title: 'Trusts overview', href: `${BASE}/guides/trusts-overview/` },
      ]),
    }),
  )

  console.log(`Built Estate Trusts Hub → ${dist}`)
  console.log(`  Home: ${urlForSlug('')}`)
  console.log(`  Trust types: ${TRUST_TYPES.length}`)
  console.log(`  Articles: ${ARTICLES.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
