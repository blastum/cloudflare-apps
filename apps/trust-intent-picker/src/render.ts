import { CLAUSE_BY_ID } from './clause-schema.mjs'
import { JOBS, JOBS_BY_ID } from './jobs.mjs'
import { INTENT_MAPPINGS, INTENT_MAPPINGS_BY_SLUG } from './intent-mappings.mjs'
import { EXCLUSIVE_ADDON_PAIRS, VESSEL_RULES, vesselRule } from './vessel-rules.mjs'

type ExplorerState = {
  jobId?: string
  vessel?: string
  addons: string[]
}

type ClauseRule = {
  id?: string
  label?: string
  why: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function vesselName(slug: string): string {
  return INTENT_MAPPINGS_BY_SLUG.get(slug)?.name ?? slug
}

function ruleLabel(rule: ClauseRule): string {
  if (rule.label) return rule.label
  if (rule.id) return CLAUSE_BY_ID.get(rule.id)?.label ?? rule.id
  return rule.why
}

function kindLabel(kind: string): string {
  if (kind === 'structure') return 'Structure'
  if (kind === 'specialty') return 'Specialty'
  return 'Trust'
}

export function renderJobs(state: ExplorerState): string {
  const cards = JOBS.map((job) => {
    const selected = job.id === state.jobId
    return `<button type="button" class="job-card${selected ? ' is-selected' : ''}" data-job="${escapeHtml(job.id)}">
      <span class="job-card-kicker">${escapeHtml(job.shortLabel ?? vesselName(job.vessel))}</span>
      <span class="job-card-story">“${escapeHtml(job.story)}”</span>
      <span class="job-card-vessel">Opens ${escapeHtml(vesselName(job.vessel))}</span>
    </button>`
  }).join('')

  return `<section class="card" aria-labelledby="jobs-heading">
    <h2 id="jobs-heading" class="card-heading">What do you want the trust to do?</h2>
    <p class="section-lead">Start from a sentence. You land on one vessel — a locked core plus things you can add.</p>
    <div class="job-grid">${cards}</div>
  </section>`
}

export function renderBrowse(state: ExplorerState): string {
  const groups = [
    { kind: 'vessel', label: 'Or pick a named trust' },
    { kind: 'structure', label: 'Structures (nicknames for how shares work)' },
    { kind: 'specialty', label: 'Specialty vehicles' },
  ]

  const blocks = groups
    .map((group) => {
      const slugs = INTENT_MAPPINGS.map((entry) => entry.slug).filter(
        (slug) => VESSEL_RULES.get(slug)?.kind === group.kind,
      )
      const buttons = slugs
        .map((slug) => {
          const selected = slug === state.vessel
          return `<button type="button" class="type-chip${selected ? ' is-selected' : ''}" data-vessel="${escapeHtml(slug)}">${escapeHtml(vesselName(slug))}</button>`
        })
        .join('')
      return `<div class="type-group">
        <p class="type-group-label">${escapeHtml(group.label)}</p>
        <div class="type-chip-row">${buttons}</div>
      </div>`
    })
    .join('')

  return `<section class="card" aria-labelledby="browse-heading">
    <h2 id="browse-heading" class="card-heading">Browse by type</h2>
    ${blocks}
  </section>`
}

function renderRuleList(
  rules: ClauseRule[],
  layer: 'required' | 'optional' | 'forbidden',
  addons: string[],
): string {
  if (rules.length === 0) return ''

  const items = rules
    .map((rule) => {
      const label = ruleLabel(rule)
      const why = escapeHtml(rule.why)
      const id = rule.id

      if (layer === 'optional' && id) {
        const checked = addons.includes(id) ? ' checked' : ''
        return `<li class="clause-row clause-row--optional">
          <label class="clause-toggle">
            <input type="checkbox" name="addon" value="${escapeHtml(id)}"${checked} />
            <span>
              <span class="clause-name">${escapeHtml(label)}</span>
              <span class="clause-why">${why}</span>
            </span>
          </label>
        </li>`
      }

      return `<li class="clause-row clause-row--${layer}">
        <span class="clause-name">${escapeHtml(label)}</span>
        <span class="clause-why">${why}</span>
      </li>`
    })
    .join('')

  const headings = {
    required: 'Locked core — this is what makes it this trust',
    optional: 'What you can add',
    forbidden: 'Do not put these on this vessel',
  }

  return `<div class="clause-block">
    <h3 class="clause-heading">${headings[layer]}</h3>
    <ul class="clause-list">${items}</ul>
  </div>`
}

function renderCompanions(slug: string, splitHint?: string): string {
  const rule = vesselRule(slug)
  const companions = rule?.companions ?? []
  if (companions.length === 0 && !splitHint) return ''

  const links = companions
    .map(
      (companion) =>
        `<button type="button" class="btn-link-button" data-vessel="${escapeHtml(companion)}">Open ${escapeHtml(vesselName(companion))}</button>`,
    )
    .join(' ')

  const hint = splitHint ? `<p class="split-hint">${escapeHtml(splitHint)}</p>` : ''

  return `<div class="companion-banner" role="note">
    <p class="companion-title">This job may need more than one vessel</p>
    ${hint}
    ${links ? `<p class="companion-actions">${links}</p>` : ''}
  </div>`
}

export function renderWorkspace(state: ExplorerState): string {
  if (!state.vessel) {
    return `<section class="card" aria-labelledby="workspace-heading">
      <h2 id="workspace-heading" class="card-heading">Vessel</h2>
      <p class="results-empty">Pick a job or a named trust. You will see what it is, what it must include, and what you can still add.</p>
    </section>`
  }

  const rule = vesselRule(state.vessel)
  if (!rule) {
    return `<section class="card"><p class="results-empty">Unknown vessel.</p></section>`
  }

  const job = state.jobId ? JOBS_BY_ID.get(state.jobId) : undefined
  const story = job
    ? `<blockquote class="workspace-story">“${escapeHtml(job.story)}”</blockquote>`
    : ''
  const exclusiveNote = EXCLUSIVE_ADDON_PAIRS.some(([a, b]) => {
    const ids = new Set(rule.optional.map((row) => row.id).filter(Boolean))
    return ids.has(a) && ids.has(b)
  })
    ? `<p class="exclusive-note">Pot vs separate share, and HEMS vs pure discretion, are either-or — turning one on turns the other off.</p>`
    : ''

  return `<section class="card workspace" aria-labelledby="workspace-heading">
    <header class="workspace-header">
      <p class="workspace-kicker">${escapeHtml(kindLabel(rule.kind))}</p>
      <h2 id="workspace-heading" class="workspace-title">${escapeHtml(vesselName(rule.slug))}</h2>
      ${story}
      <p class="result-summary">${escapeHtml(rule.nutshell)}</p>
      <p class="workspace-job">${escapeHtml(rule.job)}</p>
      <p class="result-actions">
        <a class="btn-link" href="./trusts/${escapeHtml(rule.slug)}/">Glossary page →</a>
      </p>
    </header>
    ${renderCompanions(rule.slug, rule.splitHint)}
    ${renderRuleList(rule.required, 'required', state.addons)}
    ${renderRuleList(rule.optional, 'optional', state.addons)}
    ${exclusiveNote}
    ${renderRuleList(rule.forbidden, 'forbidden', state.addons)}
  </section>`
}
