import { BASE, navForSection } from './routes.mjs'

const SECTIONS = [
  { id: 'trusts', label: 'Trusts', href: `${BASE}/trusts/` },
  { id: 'guides', label: 'Guides', href: `${BASE}/guides/trusts-overview/` },
  { id: 'illinois', label: 'Illinois', href: `${BASE}/illinois/bypass/` },
  { id: 'documents', label: 'Documents', href: `${BASE}/documents/` },
  { id: 'glossary', label: 'Glossary', href: `${BASE}/glossary/` },
]

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.bodyHtml
 * @param {string} [opts.activeSection]
 * @param {string} [opts.pagerHtml]
 * @param {string} [opts.relatedHtml]
 * @param {string} [opts.breadcrumbsHtml]
 */
export function renderPage({
  title,
  bodyHtml,
  activeSection = '',
  pagerHtml = '',
  relatedHtml = '',
  breadcrumbsHtml = '',
}) {
  const nav = SECTIONS.map((s) => {
    const items = navForSection(s.id)
    const open = activeSection === s.id ? ' open' : ''
    const current = activeSection === s.id ? ' aria-current="page"' : ''
    const links = items
      .slice(0, s.id === 'trusts' ? 0 : 99)
      .map(
        (item) =>
          `<li><a href="${item.path}">${escapeHtml(item.title)}</a></li>`,
      )
      .join('')

    if (s.id === 'trusts') {
      return `<div class="nav-item"><a class="nav-link${activeSection === 'trusts' ? ' is-active' : ''}" href="${s.href}"${current}>${s.label}</a></div>`
    }

    if (s.id === 'glossary') {
      return `<div class="nav-item"><a class="nav-link${activeSection === s.id ? ' is-active' : ''}" href="${s.href}"${current}>${s.label}</a></div>`
    }

    if (s.id === 'documents') {
      const docLinks = navForSection('documents')
        .map((item) => `<li><a href="${item.path}">${escapeHtml(item.title)}</a></li>`)
        .join('')
      return `<details class="nav-details"${open}>
      <summary class="nav-link${activeSection === s.id ? ' is-active' : ''}">${s.label}</summary>
      <ul class="nav-dropdown"><li><a href="${s.href}">All documents</a></li>${docLinks}</ul>
    </details>`
    }

    return `<details class="nav-details"${open}>
      <summary class="nav-link${activeSection === s.id ? ' is-active' : ''}">${s.label}</summary>
      <ul class="nav-dropdown">${links}</ul>
    </details>`
  }).join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} · Estate Trusts</title>
    <link rel="icon" href="/public/images/smirk-cat.png" type="image/png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/public/css/theme.css" />
    <link rel="stylesheet" href="${BASE}/styles/site.css" />
  </head>
  <body id="top">
    <div class="page hub-page">
      <header class="site-header hub-header">
        <div class="brand">
          <a class="brand-link" href="${BASE}/">
            <div class="brand-mark" aria-hidden="true">
              <img src="/public/images/smirk-cat.png" alt="" width="48" height="48" />
            </div>
            <div class="brand-text">
              <p class="brand-title">Estate Trusts</p>
              <p class="brand-subtitle">Educational primer hub</p>
            </div>
          </a>
        </div>
        <nav class="hub-nav" aria-label="Primary">
          ${nav}
          <a class="nav-link nav-home" href="${BASE}/">Home</a>
        </nav>
      </header>

      <main class="hub-main">
        ${breadcrumbsHtml}
        ${pagerHtml}
        <article class="prose">
          ${bodyHtml}
        </article>
        ${relatedHtml}
      </main>

      <footer class="site-footer hub-footer">
        <p>Educational overview only — not legal or tax advice.</p>
        <p>
          <a href="#top">Back to top</a>
          ·
          <a href="/">Smirking Cat Software</a>
        </p>
      </footer>
    </div>
  </body>
</html>
`
}

export function breadcrumbs(items) {
  const parts = items
    .map((item, i) => {
      if (i === items.length - 1 || !item.href) {
        return `<span>${escapeHtml(item.label)}</span>`
      }
      return `<a href="${item.href}">${escapeHtml(item.label)}</a>`
    })
    .join(' <span class="crumb-sep">/</span> ')
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${parts}</nav>`
}

export function pager({ prev, next, indexHref, indexLabel = 'Index' }) {
  return `<nav class="pager" aria-label="Trust type pager">
    <div>${prev ? `<a href="${prev.href}">← ${escapeHtml(prev.title)}</a>` : '<span></span>'}</div>
    <div><a href="${indexHref}">${escapeHtml(indexLabel)}</a></div>
    <div>${next ? `<a href="${next.href}">${escapeHtml(next.title)} →</a>` : '<span></span>'}</div>
  </nav>`
}

export function relatedRail(links) {
  if (!links.length) return ''
  const items = links
    .map((l) => `<li><a href="${l.href}">${escapeHtml(l.title)}</a></li>`)
    .join('')
  return `<aside class="related" aria-label="Related pages">
    <h2>Related</h2>
    <ul>${items}</ul>
  </aside>`
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
