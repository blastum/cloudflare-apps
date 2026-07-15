import { INTENT_GROUPS, INTENT_FACETS, getIntentFacet } from './intent-schema.mjs'
import { matchIntents } from './match-by-intent.mjs'
import { INTENT_MAPPINGS } from './intent-mappings.mjs'
import trustPages from './generated/trust-pages.json'

type Selection = Record<string, boolean>

type MatchResult = {
  slug: string
  name: string
  why: string
  matched: string[]
  missing: string[]
  partial: string[]
  caveats: string[]
}

type TrustPage = {
  name: string
  glossaryAnchor: string
  technical: { facet: string; detail: string }[]
}

const pages = trustPages as Record<string, TrustPage>

const GROUP_LAYOUT: { id: string; label: string; groups: string[] }[] = [
  { id: 'who', label: 'Who benefits', groups: ['who'] },
  { id: 'when-fund', label: 'When & funding', groups: ['when', 'fund'] },
  { id: 'structure', label: 'Structure', groups: ['structure'] },
  { id: 'tax', label: 'Tax goals', groups: ['tax'] },
  { id: 'access', label: 'Access', groups: ['access'] },
  { id: 'remainder', label: 'Then to', groups: ['remainder'] },
  { id: 'constraints', label: 'Constraints', groups: ['constraints'] },
]

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function intentLabel(id: string): string {
  return getIntentFacet(id)?.label ?? id
}

export function renderIntentControls(selection: Selection): string {
  const groupLabelById = new Map(INTENT_GROUPS.map((group) => [group.id, group.label]))

  return GROUP_LAYOUT.map((section) => {
    const facets = INTENT_FACETS.filter((facet) => section.groups.includes(facet.group))
    const checkboxes = facets
      .map((facet) => {
        const checked = selection[facet.id] ? ' checked' : ''
        const hint = facet.description
          ? `<span class="field-hint">${escapeHtml(facet.description)}</span>`
          : ''
        return `<label class="intent-check">
          <input type="checkbox" name="intent" value="${facet.id}"${checked} />
          <span>${escapeHtml(facet.label)}</span>
          ${hint}
        </label>`
      })
      .join('')

    const subheads = section.groups
      .slice(1)
      .map(
        (groupId) =>
          `<p class="intent-subgroup">${escapeHtml(String(groupLabelById.get(groupId) ?? groupId))}</p>`,
      )
      .join('')

    return `<section class="intent-group card" aria-labelledby="group-${section.id}">
      <h2 id="group-${section.id}" class="card-heading">${escapeHtml(section.label)}</h2>
      ${subheads}
      <div class="intent-grid">${checkboxes}</div>
    </section>`
  }).join('')
}

function renderIntentChips(ids: string[], className: string): string {
  if (ids.length === 0) return ''
  return `<ul class="intent-chips ${className}">
    ${ids.map((id) => `<li>${escapeHtml(intentLabel(id))}</li>`).join('')}
  </ul>`
}

function renderTechnicalDetails(slug: string): string {
  const page = pages[slug]
  if (!page?.technical?.length) return ''

  const rows = page.technical
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.facet)}</th><td>${escapeHtml(row.detail)}</td></tr>`,
    )
    .join('')

  return `<details class="technical-details">
    <summary>Technical details</summary>
    <table class="technical-table">
      <tbody>${rows}</tbody>
    </table>
  </details>`
}

export function renderResults(selection: Selection): string {
  const selectedCount = Object.values(selection).filter(Boolean).length
  if (selectedCount === 0) {
    return `<p class="results-empty">Select one or more goals above to see trust types that may fit.</p>`
  }

  const results = matchIntents(selection, INTENT_MAPPINGS) as MatchResult[]
  if (results.length === 0) {
    return `<p class="results-empty">No trust types match these goals without conflicting requirements. Try fewer or different selections.</p>`
  }

  return `<ol class="results-list">
    ${results
      .map((result, index) => {
        const partial = result.partial ?? []
        const strongMatched = result.matched.filter((id) => !partial.includes(id))
        const trustUrl = `./trusts/${result.slug}/`

        return `<li class="result-card">
          <header class="result-header">
            <span class="result-rank">${index + 1}</span>
            <div>
              <h3 class="result-title"><a href="${trustUrl}">${escapeHtml(result.name)}</a></h3>
              <p class="result-why">${escapeHtml(result.why)}</p>
            </div>
          </header>
          ${renderIntentChips(strongMatched, 'intent-chips--matched')}
          ${partial.length > 0 ? renderIntentChips(partial, 'intent-chips--partial') : ''}
          ${result.missing.length > 0 ? renderIntentChips(result.missing, 'intent-chips--missing') : ''}
          ${
            result.caveats.length > 0
              ? `<ul class="result-caveats">
                  ${result.caveats.map((caveat) => `<li>${escapeHtml(caveat)}</li>`).join('')}
                </ul>`
              : ''
          }
          <p class="result-actions">
            <a class="btn-link" href="${trustUrl}">Read more →</a>
          </p>
          ${renderTechnicalDetails(result.slug)}
        </li>`
      })
      .join('')}
  </ol>`
}

export const EXAMPLE_SCENARIOS = [
  {
    label: 'Grandchildren — annual gifts — own slice (TC-1)',
    param: 'grandchildren,during_life,annual_gift,fixed_slice,class_grows',
  },
  {
    label: 'Spouse — IL shield — remainder to children (TC-2)',
    param: 'spouse,first_spouse_death,illinois_tax,federal_tax,discretionary,then_children',
  },
] as const

export function renderExamples(): string {
  return `<div class="examples">
    <p class="examples-label">Try an example:</p>
    <ul class="examples-list">
      ${EXAMPLE_SCENARIOS.map(
        (scenario) =>
          `<li><a href="?i=${scenario.param}" data-example="${scenario.param}">${escapeHtml(scenario.label)}</a></li>`,
      ).join('')}
    </ul>
  </div>`
}
