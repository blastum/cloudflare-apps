import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { clauseRowsForSlug } from '../src/clause-coverage.mjs'
import { CLAUSE_BY_ID } from '../src/clause-schema.mjs'
import { INTENT_MAPPINGS } from '../src/intent-mappings.mjs'
import { vesselRule } from '../src/vessel-rules.mjs'
import { resolveNotebookFile } from './glossary-path.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicTrustsDir = join(root, 'public/trusts')
const generatedDir = join(root, 'src/generated')

/** @type {Map<string, string>} */
const anchorToSlug = new Map(
  INTENT_MAPPINGS.map((entry) => [entry.glossaryAnchor, entry.slug]),
)

/**
 * @param {string} title
 */
function slugifyHeading(title) {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {string} text
 */
function inlineMd(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(#([^)]+)\)/g, (_, label, anchor) => {
      const slug = anchorToSlug.get(anchor)
      return slug ? `<a href="../${slug}/">${label}</a>` : label
    })
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

/**
 * @param {string} body
 */
function bodyToHtml(body) {
  const trimmed = body.trim()
  if (!trimmed) return ''

  return trimmed
    .split(/\n\n+/)
    .map((block) => {
      const chunk = block.trim()
      if (!chunk) return ''
      if (chunk.startsWith('<table')) return chunk
      return `<p>${inlineMd(chunk)}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * @param {string} body
 * @returns {{ facet: string, detail: string }[]}
 */
function extractGlossaryRows(body) {
  const rows = []
  const matches = body.matchAll(/<tr><td>([^<]+)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)
  for (const match of matches) {
    rows.push({
      facet: match[1].trim(),
      detail: match[2].replace(/<[^>]+>/g, '').trim(),
    })
  }
  return rows
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * @param {{ id?: string, label?: string, why: string }} row
 */
function ruleLabel(row) {
  if (row.label) return row.label
  if (row.id) return CLAUSE_BY_ID.get(row.id)?.label ?? row.id
  return row.why
}

/**
 * @param {string} title
 * @param {{ id?: string, label?: string, why: string }[]} rows
 * @param {string} layer
 */
function renderRuleTable(title, rows, layer) {
  if (!rows || rows.length === 0) return ''
  const body = rows
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(ruleLabel(row))}</th><td>${escapeHtml(row.why)}</td></tr>`,
    )
    .join('\n')
  return `<h2 class="technical-heading">${escapeHtml(title)}</h2>
<table class="technical-table clause-table--${layer}">
  <thead><tr><th scope="col">Clause</th><th scope="col">Why</th></tr></thead>
  <tbody>${body}</tbody>
</table>`
}

/**
 * @param {string} slug
 */
function renderVesselHtml(slug) {
  const rule = vesselRule(slug)
  if (!rule) return ''

  return `<p><a href="/trust-intent-picker/?v=${encodeURIComponent(slug)}">Configure this vessel in the explorer</a></p>
<p class="result-summary">${escapeHtml(rule.nutshell)}</p>
<p class="workspace-job">${escapeHtml(rule.job)}</p>
${renderRuleTable('Locked core', rule.required, 'required')}
${renderRuleTable('What you can add', rule.optional, 'optional')}
${renderRuleTable('Do not mix', rule.forbidden, 'forbidden')}`
}

/**
 * @param {{ id: string, label: string, value: string, group: string }[]} clauseRows
 */
function renderClauseTable(clauseRows, group) {
  const rows = clauseRows.filter((row) => row.group === group)
  if (rows.length === 0) return ''

  const body = rows
    .map(
      (row) =>
        `<tr><th scope="row">${row.label}</th><td><span class="coverage coverage--${row.value}">${row.value}</span></td></tr>`,
    )
    .join('\n')

  const heading = group === 'attribute' ? 'Type attributes' : 'Clauses and provisions'
  return `<h2 class="technical-heading">${heading}</h2>
<table class="technical-table">
  <thead><tr><th scope="col">Item</th><th scope="col">Typical for this trust</th></tr></thead>
  <tbody>${body}</tbody>
</table>`
}

/**
 * @param {string} glossary
 */
function parseSections(glossary) {
  /** @type {Map<string, { title: string, body: string }>} */
  const sections = new Map()

  for (const part of glossary.split(/^### /m).slice(1)) {
    const newline = part.indexOf('\n')
    const title = part.slice(0, newline).trim()
    let body = part.slice(newline + 1)
    const sectionBreak = body.search(/\n## /)
    if (sectionBreak !== -1) body = body.slice(0, sectionBreak)
    sections.set(slugifyHeading(title), { title, body: body.trim() })
  }

  return sections
}

/**
 * @param {string} title
 * @param {string} contentHtml
 * @param {string} clauseHtml
 */
function trustPageHtml(title, contentHtml, clauseHtml) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} · Trust Intent Picker</title>
    <link rel="icon" href="/public/images/smirk-cat.png" type="image/png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/public/css/theme.css" />
    <link rel="stylesheet" href="/trust-intent-picker/picker.css" />
  </head>
  <body>
    <div class="page page--wide">
      <header class="site-header">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <img src="/public/images/smirk-cat.png" alt="" width="60" height="60" />
          </div>
          <div class="brand-text">
            <p class="brand-title">Smirking Cat Software</p>
            <p class="brand-subtitle">Trust intent picker</p>
          </div>
        </div>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">All apps</a>
          <span aria-hidden="true"> / </span>
          <a href="/trust-intent-picker/">Trust picker</a>
        </nav>
      </header>
      <main class="trust-page">
        <section class="hero">
          <h1>${title}</h1>
        </section>
        <section class="card trust-content">
          ${contentHtml}
        </section>
        <section class="card trust-clauses">
          ${clauseHtml}
        </section>
      </main>
      <footer class="site-footer">
        <p>Educational reference synced from estate-planning glossary — not legal or tax advice.</p>
      </footer>
    </div>
  </body>
</html>
`
}

async function committedTrustPagesExist() {
  try {
    await access(join(publicTrustsDir, 'rlt', 'index.html'))
    await access(join(generatedDir, 'trust-pages.json'))
    return true
  } catch {
    return false
  }
}

async function main() {
  let glossaryPath
  try {
    glossaryPath = resolveNotebookFile('glossary-and-trust-types.md')
  } catch (error) {
    if (await committedTrustPagesExist()) {
      console.log('sync-glossary: skipped (no notebook; using committed public/trusts/)')
      return
    }
    throw error
  }
  const glossary = await readFile(glossaryPath, 'utf8')
  const sections = parseSections(glossary)

  /** @type {Record<string, object>} */
  const trustPages = {}

  await mkdir(publicTrustsDir, { recursive: true })
  await mkdir(generatedDir, { recursive: true })

  for (const entry of INTENT_MAPPINGS) {
    const section = sections.get(entry.glossaryAnchor)
    if (!section) {
      throw new Error(`Glossary section not found for ${entry.slug}: ${entry.glossaryAnchor}`)
    }

    const contentHtml = bodyToHtml(section.body)
    const glossaryRows = extractGlossaryRows(section.body)
    const clauseRows = clauseRowsForSlug(entry.slug)
    const clauseHtml = [
      renderVesselHtml(entry.slug),
      renderClauseTable(clauseRows, 'attribute'),
      renderClauseTable(clauseRows, 'clause'),
    ]
      .filter(Boolean)
      .join('\n')

    const pageDir = join(publicTrustsDir, entry.slug)
    await mkdir(pageDir, { recursive: true })
    await writeFile(
      join(pageDir, 'index.html'),
      trustPageHtml(entry.name, contentHtml, clauseHtml),
      'utf8',
    )

    trustPages[entry.slug] = {
      name: entry.name,
      glossaryAnchor: entry.glossaryAnchor,
      glossary: glossaryRows,
      clauses: clauseRows.map((row) => ({
        id: row.id,
        label: row.label,
        value: row.value,
        group: row.group,
        description: CLAUSE_BY_ID.get(row.id)?.description ?? '',
      })),
    }
  }

  await writeFile(
    join(generatedDir, 'trust-pages.json'),
    `${JSON.stringify(trustPages, null, 2)}\n`,
    'utf8',
  )

  console.log(`sync-glossary: ${INTENT_MAPPINGS.length} trust pages → public/trusts/`)
  console.log(`  source: ${glossaryPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
