import './styles/picker.css'
import { EXCLUSIVE_ADDON_PAIRS, allowedAddons } from './vessel-rules.mjs'
import { JOBS_BY_ID } from './jobs.mjs'
import { readExplorerState, toggleExclusive, writeExplorerState } from './explorer-url.mjs'
import { renderBrowse, renderJobs, renderWorkspace } from './render.ts'

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing element: ${selector}`)
  return element
}

const jobsRoot = requireElement<HTMLDivElement>('#jobs')
const browseRoot = requireElement<HTMLDivElement>('#browse')
const workspaceRoot = requireElement<HTMLDivElement>('#workspace')

let state = readExplorerState()

function paint(): void {
  jobsRoot.innerHTML = renderJobs(state)
  browseRoot.innerHTML = renderBrowse(state)
  workspaceRoot.innerHTML = renderWorkspace(state)
}

function commit(): void {
  if (state.vessel) state.addons = allowedAddons(state.vessel, state.addons)
  else state.addons = []
  writeExplorerState(state)
  paint()
}

jobsRoot.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-job]')
  if (!button?.dataset.job) return
  const job = JOBS_BY_ID.get(button.dataset.job)
  if (!job) return
  state = { jobId: job.id, vessel: job.vessel, addons: [] }
  commit()
})

function openVessel(slug: string): void {
  state = {
    jobId: state.jobId && JOBS_BY_ID.get(state.jobId)?.vessel === slug ? state.jobId : undefined,
    vessel: slug,
    addons: [],
  }
  commit()
}

browseRoot.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-vessel]')
  if (!button?.dataset.vessel) return
  openVessel(button.dataset.vessel)
})

workspaceRoot.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-vessel]')
  if (button?.dataset.vessel) {
    openVessel(button.dataset.vessel)
  }
})

workspaceRoot.addEventListener('change', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || target.name !== 'addon') return
  state.addons = toggleExclusive(state.addons, target.value, EXCLUSIVE_ADDON_PAIRS)
  commit()
})

paint()
