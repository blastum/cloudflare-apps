/** @typedef {import('./intent-mappings.mjs').IntentMapping} IntentMapping */

export const STRONG_WEIGHT = 2
export const WEAK_WEIGHT = 1

/**
 * @param {Record<string, boolean>} selection
 * @returns {string[]}
 */
export function selectedIntentIds(selection) {
  return Object.entries(selection)
    .filter(([, value]) => value === true)
    .map(([id]) => id)
}

/**
 * @param {string[]} selected
 * @param {IntentMapping} entry
 * @returns {{ score: number, matched: string[], missing: string[], partial: string[], disqualified: boolean }}
 */
export function scoreMapping(selected, entry) {
  const strong = new Set(entry.strong ?? [])
  const weak = new Set(entry.weak ?? [])
  const incompatible = new Set(entry.incompatible ?? [])

  const conflicting = selected.filter((id) => incompatible.has(id))
  if (conflicting.length > 0) {
    return {
      score: 0,
      matched: [],
      missing: selected,
      partial: [],
      disqualified: true,
      conflicting,
    }
  }

  /** @type {string[]} */
  const matched = []
  /** @type {string[]} */
  const partial = []
  /** @type {string[]} */
  const missing = []
  let score = 0

  for (const id of selected) {
    if (strong.has(id)) {
      score += STRONG_WEIGHT
      matched.push(id)
    } else if (weak.has(id)) {
      score += WEAK_WEIGHT
      partial.push(id)
      matched.push(id)
    } else {
      missing.push(id)
    }
  }

  return { score, matched, missing, partial, disqualified: false, conflicting: [] }
}

/**
 * @param {Record<string, boolean>} selection
 * @param {IntentMapping[]} catalog
 * @returns {Array<{
 *   slug: string,
 *   glossaryAnchor: string,
 *   name: string,
 *   score: number,
 *   maxScore: number,
 *   coverage: number,
 *   matched: string[],
 *   missing: string[],
 *   partial: string[],
 *   caveats: string[],
 *   why: string,
 *   disqualified: boolean,
 * }>}
 */
export function matchIntents(selection, catalog) {
  const selected = selectedIntentIds(selection)
  const maxScore = selected.length * STRONG_WEIGHT

  const results = catalog
    .map((entry) => {
      const scored = scoreMapping(selected, entry)
      const coverage = maxScore === 0 ? 0 : scored.score / maxScore

      return {
        slug: entry.slug,
        glossaryAnchor: entry.glossaryAnchor,
        name: entry.name,
        score: scored.score,
        maxScore,
        coverage,
        matched: scored.matched,
        missing: scored.missing,
        partial: scored.partial,
        caveats: entry.caveats ?? [],
        why: entry.why ?? '',
        disqualified: scored.disqualified,
        conflicting: scored.conflicting,
      }
    })
    .filter((result) => !result.disqualified && result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.coverage !== a.coverage) return b.coverage - a.coverage
      return a.slug.localeCompare(b.slug)
    })

  return results
}

/**
 * Full score means every selected intent matched strongly (no weak-only or missing).
 * @param {{ score: number, maxScore: number, missing: string[], partial: string[] }} result
 * @returns {boolean}
 */
export function isFullScore(result) {
  return (
    result.maxScore > 0 &&
    result.score === result.maxScore &&
    result.missing.length === 0 &&
    result.partial.length === 0
  )
}
