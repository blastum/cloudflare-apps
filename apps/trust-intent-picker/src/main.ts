import './styles/picker.css'
import { parseIntentParam, readSelectionFromUrl, writeSelectionToUrl } from './intent-url.mjs'
import { renderExamples, renderIntentControls, renderResults } from './render.ts'

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing element: ${selector}`)
  return element
}

const controlsRoot = requireElement<HTMLDivElement>('#intent-controls')
const resultsRoot = requireElement<HTMLDivElement>('#results')
const examplesRoot = requireElement<HTMLDivElement>('#examples')

let selection = readSelectionFromUrl()

function paint(): void {
  controlsRoot.innerHTML = renderIntentControls(selection)
  resultsRoot.innerHTML = renderResults(selection)
  examplesRoot.innerHTML = renderExamples()
}

function sync(): void {
  writeSelectionToUrl(selection)
  resultsRoot.innerHTML = renderResults(selection)
}

controlsRoot.addEventListener('change', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || target.name !== 'intent') return

  if (target.checked) selection[target.value] = true
  else delete selection[target.value]

  sync()
})

examplesRoot.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof HTMLAnchorElement) || !target.dataset.example) return
  event.preventDefault()
  selection = parseIntentParam(target.dataset.example)
  paint()
  writeSelectionToUrl(selection)
})

paint()
