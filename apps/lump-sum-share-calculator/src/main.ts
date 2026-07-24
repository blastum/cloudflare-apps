import '../../../public/css/theme.css'
import { calculate, type CalculatorInputs } from './calculator'
import { DEFAULTS } from './constants'
import { mountCalculator } from './render'
import './styles/calculator.css'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
const childrenEl = document.querySelector<HTMLDivElement>('#children-list')
const addChildBtn = document.querySelector<HTMLButtonElement>('[data-add-child]')
if (!formEl || !resultsEl || !childrenEl || !addChildBtn) {
  throw new Error('Missing calculator shell elements')
}

const form = formEl
const results = resultsEl
const childrenContainer = childrenEl

function readSpacingMonths(): number[] {
  const rows = childrenContainer.querySelectorAll<HTMLElement>('[data-child-row]')
  const spacing: number[] = []
  rows.forEach((row, index) => {
    if (index === 0) {
      spacing.push(0)
      return
    }
    const input = row.querySelector<HTMLInputElement>('input[name="spacingMonths"]')
    spacing.push(Math.max(0, Number(input?.value ?? 0)))
  })
  return spacing.length > 0 ? spacing : [0]
}

function readInputs(): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100
  return {
    spacingMonths: readSpacingMonths(),
    targetRealAtAge21: Math.max(0, num('targetRealAtAge21')),
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
  }
}

function childRowHtml(childNumber: number, monthsAfterPrevious: number): string {
  if (childNumber === 1) {
    return `
      <div class="child-row" data-child-row>
        <span class="child-row__label">Child 1</span>
        <span class="child-row__birth">Born at year 0</span>
      </div>
    `
  }
  return `
    <div class="child-row" data-child-row>
      <span class="child-row__label">Child ${childNumber}</span>
      <label class="child-row__spacing">
        Months after previous
        <input
          type="number"
          name="spacingMonths"
          min="0"
          max="240"
          step="1"
          value="${monthsAfterPrevious}"
        />
      </label>
      <button type="button" class="btn-remove-child" data-remove-child aria-label="Remove child ${childNumber}">Remove</button>
    </div>
  `
}

function renderChildren(spacingMonths: number[] = [...DEFAULTS.spacingMonths]): void {
  childrenContainer.innerHTML = spacingMonths
    .map((months, index) => childRowHtml(index + 1, index === 0 ? 0 : months))
    .join('')
}

function restoreSavedSpacing(): number[] | null {
  try {
    const saved = localStorage.getItem('lump-sum-share-calculator:inputs')
    if (!saved) return null
    const vals = JSON.parse(saved) as { spacingMonths?: number[] }
    return vals.spacingMonths?.length ? vals.spacingMonths : null
  } catch {
    return null
  }
}

renderChildren(restoreSavedSpacing() ?? [...DEFAULTS.spacingMonths])

const recalculate = mountCalculator(
  form,
  results,
  childrenContainer,
  calculate,
  readInputs,
)

addChildBtn.addEventListener('click', () => {
  const spacing = readSpacingMonths()
  spacing.push(24)
  renderChildren(spacing)
  recalculate()
})

childrenContainer.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (!target.closest('[data-remove-child]')) return
  const spacing = readSpacingMonths()
  if (spacing.length <= 1) return
  spacing.pop()
  renderChildren(spacing)
  recalculate()
})
