import { JOBS_BY_ID, jobFromLegacyTokens } from './jobs.mjs'
import { allowedAddons, VESSEL_RULES } from './vessel-rules.mjs'

/**
 * @typedef {Object} ExplorerState
 * @property {string} [jobId]
 * @property {string} [vessel]
 * @property {string[]} addons
 */

/**
 * @param {string} [search]
 * @returns {ExplorerState}
 */
export function readExplorerState(search = window.location.search) {
  const params = new URLSearchParams(search)
  const vesselParam = params.get('v') ?? ''
  const jobParam = params.get('job') ?? ''
  const addParam = params.get('add') ?? ''
  const legacy = params.get('i') ?? ''

  /** @type {ExplorerState} */
  const state = { addons: [] }

  if (VESSEL_RULES.has(vesselParam)) state.vessel = vesselParam

  if (jobParam && JOBS_BY_ID.has(jobParam)) {
    state.jobId = jobParam
    if (!state.vessel) state.vessel = JOBS_BY_ID.get(jobParam)?.vessel
  } else if (legacy) {
    const tokens = legacy.split(',').map((part) => part.trim()).filter(Boolean)
    const job = jobFromLegacyTokens(tokens)
    if (job) {
      state.jobId = job.id
      if (!state.vessel) state.vessel = job.vessel
    }
  }

  if (state.vessel) {
    const requested = addParam.split(',').map((part) => part.trim()).filter(Boolean)
    state.addons = allowedAddons(state.vessel, requested)
  }

  return state
}

/**
 * @param {ExplorerState} state
 */
export function writeExplorerState(state) {
  const url = new URL(window.location.href)
  const params = url.searchParams

  params.delete('i')

  if (state.jobId) params.set('job', state.jobId)
  else params.delete('job')

  if (state.vessel) params.set('v', state.vessel)
  else params.delete('v')

  if (state.addons.length > 0) params.set('add', [...state.addons].sort().join(','))
  else params.delete('add')

  window.history.replaceState(null, '', url)
}

/**
 * @param {Iterable<string>} current
 * @param {string} toggling
 * @param {readonly [string, string][]} pairs
 * @returns {string[]}
 */
export function toggleExclusive(current, toggling, pairs) {
  const next = new Set(current)
  if (next.has(toggling)) {
    next.delete(toggling)
    return [...next]
  }

  next.add(toggling)
  for (const [a, b] of pairs) {
    if (toggling === a) next.delete(b)
    if (toggling === b) next.delete(a)
  }
  return [...next]
}
