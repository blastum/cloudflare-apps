import { marked } from 'marked'
import { basename } from 'node:path'
import { buildLinkMap, BASE, TRUST_TYPES, slugifyAnchor } from './routes.mjs'

const linkMap = buildLinkMap()

marked.setOptions({
  gfm: true,
  breaks: false,
})

const UNMAPPED = '__UNMAPPED__'

/**
 * Remap markdown/HTML hrefs that point at notebook .md files or trust anchors.
 * Unmapped notebook sources become plain text (no dead links).
 * @param {string} md
 */
export function remapMarkdownLinks(md) {
  return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, text, href) => {
    const mapped = mapHref(href)
    if (mapped === null) return text
    return `[${text}](${mapped})`
  })
}

/**
 * Remap href attributes already present as HTML (tables in source).
 * @param {string} html
 */
export function remapHtmlHrefs(html) {
  let out = html.replace(/href="([^"]+)"/g, (full, href) => {
    const mapped = mapHref(href)
    if (mapped === null) return `href="${UNMAPPED}"`
    return `href="${mapped}"`
  })
  out = out.replace(
    /<a href="__UNMAPPED__">([\s\S]*?)<\/a>/g,
    '<span class="source-ref" title="Source not included in this hub">$1</span>',
  )
  return out
}

/**
 * @param {string} href
 */
export function mapHref(href) {
  if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
    return href
  }

  // Pure hash — may be trust-type anchor from quick index
  if (href.startsWith('#')) {
    const trustHit = TRUST_TYPES.find(
      (t) => `#${slugifyAnchor(t.heading)}` === href || `#${slugifyAnchor(t.title)}` === href,
    )
    if (trustHit) return `${BASE}/trusts/${trustHit.slug}/`
    // Glossary letter anchors stay on glossary page
    return href
  }

  const [pathPart, hash = ''] = href.split('#')

  const candidates = [
    pathPart,
    basename(pathPart),
    pathPart.replace(/^\.\//, ''),
    pathPart.replace(/^\.\.\//, ''),
  ]

  for (const key of candidates) {
    if (linkMap[key]) {
      const target = linkMap[key]
      if (hash) {
        const trustHit = TRUST_TYPES.find(
          (t) => slugifyAnchor(t.heading) === hash || slugifyAnchor(t.title) === hash,
        )
        if (trustHit) return `${BASE}/trusts/${trustHit.slug}/`
      }
      const withSlash = target.endsWith('/') ? target : `${target}/`
      return hash ? `${withSlash}#${hash}` : withSlash
    }
  }

  // Known fragment-only trust anchors in absolute path form
  if (pathPart.includes('glossary-and-trust-types')) {
    if (hash) {
      const trustHit = TRUST_TYPES.find((t) => slugifyAnchor(t.heading) === hash)
      if (trustHit) return `${BASE}/trusts/${trustHit.slug}/`
    }
    return `${BASE}/trusts/`
  }

  // Unmapped notebook paths (documents, projects, irs) — plain text in remap step
  if (pathPart.endsWith('.md') || pathPart.endsWith('.pdf') || pathPart.includes('/documents/') || pathPart.includes('/projects/') || pathPart.includes('irs-documents')) {
    return null
  }

  return href
}

/**
 * @param {string} markdown
 */
export function renderMarkdown(markdown) {
  const remapped = remapMarkdownLinks(markdown)
  let html = marked.parse(remapped, { async: false })
  if (typeof html !== 'string') {
    throw new Error('marked returned non-string')
  }
  html = remapHtmlHrefs(html)
  // Fix double-slash quirks from mapHref
  html = html.replaceAll(`${BASE}//`, `${BASE}/`)
  return html
}

/**
 * Split glossary-and-trust-types.md into index preface + per-type bodies.
 * @param {string} fullMd
 */
export function splitTrustTypesDoc(fullMd) {
  const lines = fullMd.split('\n')
  /** @type {{ heading: string, body: string }[]} */
  const sections = []
  let prefaceLines = []
  let currentHeading = null
  /** @type {string[]} */
  let currentBody = []
  let pastFirstType = false
  let inIncomeTax = false
  /** @type {string[]} */
  let incomeTaxLines = []

  for (const line of lines) {
    if (line.startsWith('## Income tax categories')) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() })
        currentHeading = null
        currentBody = []
      }
      inIncomeTax = true
      incomeTaxLines = [line]
      continue
    }

    if (inIncomeTax) {
      if (line.startsWith('## Sources')) break
      incomeTaxLines.push(line)
      continue
    }

    if (line.startsWith('### ')) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() })
      } else if (!pastFirstType) {
        // Drop trailing --- before first type
        while (prefaceLines.length && /^---\s*$/.test(prefaceLines[prefaceLines.length - 1])) {
          prefaceLines.pop()
        }
        pastFirstType = true
      }
      currentHeading = line.slice(4).trim()
      currentBody = []
      continue
    }

    if (!pastFirstType) {
      // Skip top H1 — page chrome supplies title
      if (line.startsWith('# ')) continue
      prefaceLines.push(line)
    } else if (currentHeading) {
      if (line.startsWith('## ') && !line.startsWith('### ')) {
        // Group headers between types — skip in type body
        continue
      }
      currentBody.push(line)
    }
  }

  if (currentHeading) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() })
  }

  return {
    preface: prefaceLines.join('\n').trim(),
    sections,
    incomeTax: incomeTaxLines.join('\n').trim(),
  }
}
