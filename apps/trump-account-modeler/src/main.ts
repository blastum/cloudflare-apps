import { deriveChildren } from './children'
import { calculate, defaultInputs, type CalculatorInputs, type ChildInput } from './calculator'
import { DEFAULT_CHILD_SPACING_MONTHS, DEFAULTS, MONTH_NAMES } from './constants'
import {
  applyFormAssumptions,
  clearAssumptions,
  defaultAssumptions,
  loadAssumptions,
  saveAssumptions,
  type SavedAssumptions,
} from './persistence'
import { formatMonthYear } from './shared/money'
import { mountCalculator } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
const childrenEl = document.querySelector<HTMLDivElement>('#children-list')

if (!formEl || !resultsEl || !childrenEl) {
  throw new Error('Missing calculator shell elements')
}

const form = formEl
const childrenContainer = childrenEl

const saved = loadAssumptions()
const initialAssumptions = saved ?? defaultAssumptions()

let firstChild = initialAssumptions.firstChild
let childSpacings = [...initialAssumptions.childSpacings]

function derivedChildren(): ChildInput[] {
  return deriveChildren(firstChild, childSpacings)
}

function syncChildrenFromDom(): void {
  const anchorRow = childrenContainer.querySelector<HTMLElement>('[data-anchor-row]')
  if (anchorRow) {
    firstChild = {
      birthYear: Number(
        anchorRow.querySelector<HTMLInputElement>('[data-birth-year]')?.value ??
          DEFAULTS.birthYear,
      ),
      birthMonth: Number(
        anchorRow.querySelector<HTMLSelectElement>('[data-birth-month]')?.value ??
          DEFAULTS.birthMonth,
      ),
    }
  }

  childSpacings = [...childrenContainer.querySelectorAll<HTMLElement>('[data-spacing-row]')].map(
    (row) =>
      Math.max(
        1,
        Math.round(
          Number(row.querySelector<HTMLInputElement>('[data-spacing-months]')?.value) ||
            DEFAULT_CHILD_SPACING_MONTHS,
        ),
      ),
  )
}

function renderMonthOptions(selected: number): string {
  return MONTH_NAMES.map(
    (name, i) =>
      `<option value="${i + 1}"${i + 1 === selected ? ' selected' : ''}>${name}</option>`,
  ).join('')
}

function renderChildRows(): void {
  const children = derivedChildren()

  const anchorRow = `
    <fieldset class="child-row child-row--anchor" data-child-row data-anchor-row>
      <legend class="child-row-legend">First child</legend>
      <div class="form-field">
        <label for="first-child-year">Year</label>
        <input
          id="first-child-year"
          type="number"
          data-birth-year
          min="1990"
          max="2040"
          step="1"
          value="${firstChild.birthYear}"
          autocomplete="off"
        />
      </div>
      <div class="form-field">
        <label for="first-child-month">Month</label>
        <select id="first-child-month" data-birth-month autocomplete="off">${renderMonthOptions(firstChild.birthMonth)}</select>
      </div>
    </fieldset>
  `

  const spacingRows = childSpacings
    .map((spacing, index) => {
      const born = children[index + 1]!
      return `
    <div class="child-row child-row--spacing" data-child-row data-spacing-row>
      <div class="form-field">
        <label for="spacing-months-${index}">Spacing after previous child</label>
        <input
          id="spacing-months-${index}"
          type="number"
          data-spacing-months
          min="1"
          max="240"
          step="1"
          value="${spacing}"
          autocomplete="off"
        />
        <span class="field-hint">${spacing} months · born ${formatMonthYear(born.birthYear, born.birthMonth)}</span>
      </div>
      <button type="button" class="btn-remove-child" data-remove-child="${index + 1}">Remove</button>
    </div>
  `
    })
    .join('')

  childrenContainer.innerHTML = anchorRow + spacingRows

  childrenContainer.querySelectorAll('[data-remove-child]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number((btn as HTMLElement).dataset.removeChild)
      childSpacings.splice(idx - 1, 1)
      renderChildRows()
      form.dispatchEvent(new Event('input', { bubbles: true }))
    })
  })

  childrenContainer
    .querySelectorAll('[data-birth-year], [data-birth-month], [data-spacing-months]')
    .forEach((el) => {
      el.addEventListener('input', () => {
        syncChildrenFromDom()
        updateSpacingHints()
      })
      el.addEventListener('change', () => {
        syncChildrenFromDom()
        updateSpacingHints()
      })
    })
}

function updateSpacingHints(): void {
  const children = derivedChildren()
  childrenContainer.querySelectorAll<HTMLElement>('[data-spacing-row]').forEach((row, index) => {
    const spacing = childSpacings[index] ?? DEFAULT_CHILD_SPACING_MONTHS
    const born = children[index + 1]
    const hint = row.querySelector('.field-hint')
    if (hint && born) {
      hint.textContent = `${spacing} months · born ${formatMonthYear(born.birthYear, born.birthMonth)}`
    }
  })
}

function assumptionsFromState(): SavedAssumptions {
  syncChildrenFromDom()
  const data = new FormData(form)
  return {
    fundingYear: String(data.get('fundingYear') ?? DEFAULTS.fundingYear),
    cpiRate: String(data.get('cpiRate') ?? ''),
    marketRate: String(data.get('marketRate') ?? ''),
    firstChild,
    childSpacings,
  }
}

function readInputs(): CalculatorInputs {
  syncChildrenFromDom()
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100
  const children = derivedChildren()

  return {
    children: children.length > 0 ? children : defaultInputs().children,
    fundingYear: Math.round(num('fundingYear')),
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
  }
}

function persistAssumptions(): void {
  saveAssumptions(assumptionsFromState())
}

function resetAssumptions(render: () => void): void {
  clearAssumptions()
  const defaults = defaultAssumptions()
  firstChild = defaults.firstChild
  childSpacings = defaults.childSpacings
  const funding = form.elements.namedItem('fundingYear')
  if (funding instanceof HTMLInputElement) funding.value = defaults.fundingYear
  const cpi = form.elements.namedItem('cpiRate')
  if (cpi instanceof HTMLInputElement) cpi.value = defaults.cpiRate
  const market = form.elements.namedItem('marketRate')
  if (market instanceof HTMLInputElement) market.value = defaults.marketRate
  renderChildRows()
  render()
}

document.querySelector<HTMLButtonElement>('#add-child')?.addEventListener('click', () => {
  childSpacings.push(DEFAULT_CHILD_SPACING_MONTHS)
  renderChildRows()
  form.dispatchEvent(new Event('input', { bubbles: true }))
})

applyFormAssumptions(form, initialAssumptions)
renderChildRows()

mountCalculator(form, resultsEl, calculate, readInputs, {
  onPersist: persistAssumptions,
  onReset: resetAssumptions,
})
