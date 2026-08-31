import { currencyFromForm } from '../../../shared/currency-input'
import '../../../public/css/theme.css'
import '../../../shared/styles/controls.css'
import '../../../shared/styles/print.css'
import { setCurrencyInputValue } from '../../../shared/currency-input'
import { mountChildList } from '../../../shared/child-list'
import { DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT } from '../../../shared/growth'
import {
  calculate,
  type CalculatorInputs,
  type SolveMode,
} from './calculator'
import { DEFAULTS } from './constants'
import { mountCalculator } from './render'
import './styles/calculator.css'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
const worksheetEl = document.querySelector<HTMLDivElement>('#trustee-worksheet')
const childrenEl = document.querySelector<HTMLDivElement>('#children-list')
if (!formEl || !resultsEl || !worksheetEl || !childrenEl) {
  throw new Error('Missing calculator shell elements')
}

const form = formEl
const results = resultsEl
const childrenContainer = childrenEl

function parseMode(value: unknown): SolveMode {
  return value === 'maturity' ? 'maturity' : 'initial'
}

function modeFromUrl(): SolveMode | null {
  const raw = new URL(window.location.href).searchParams.get('mode')
  if (raw === 'initial' || raw === 'maturity') return raw
  return null
}

function writeModeToUrl(mode: SolveMode): void {
  const url = new URL(window.location.href)
  if (mode === 'initial') url.searchParams.delete('mode')
  else url.searchParams.set('mode', mode)
  window.history.replaceState({}, '', url)
}

const AMOUNT_COPY = {
  initial: {
    label: 'Initial pot ($)',
    hint: 'One deposit into the communal pot',
  },
  maturity: {
    label: 'Maturity value ($)',
    hint: 'Real dollars at each child’s payout; nominal on that date will be higher',
  },
} as const

function applyModeToDom(mode: SolveMode): void {
  for (const button of form.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    const selected = button.dataset.mode === mode
    button.setAttribute('aria-selected', selected ? 'true' : 'false')
  }
  const copy = AMOUNT_COPY[mode]
  const label = form.querySelector('#amount-label')
  const hint = form.querySelector('#amount-hint')
  if (label) label.textContent = copy.label
  if (hint) hint.textContent = copy.hint
}

function readSpacingMonths(): number[] {
  if (childList.mode !== 'month-zero') return [...DEFAULTS.spacingMonths]
  const { spacingMonths } = childList.getState()
  return spacingMonths.length > 0 ? spacingMonths : [0]
}

function readInputs(mode: SolveMode): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100
  const amount = Math.max(0, currencyFromForm(data, 'amount'))
  return {
    spacingMonths: readSpacingMonths(),
    solveMode: mode,
    lumpSum: mode === 'initial' ? amount : 0,
    targetMaturityValue: mode === 'maturity' ? amount : 0,
    fundingMonth: Math.round(num('fundingMonth')),
    payoutAge: Math.max(1, Math.min(65, Math.round(num('payoutAge')))),
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
  }
}

type SavedInputs = {
  spacingMonths?: number[]
  solveMode?: string
  amount?: string
  lumpSum?: string
  targetMaturityValue?: string
  fundingMonth?: string
  contributions?: { month: number; amount: number }[]
  fundingMonthsFromFirstBirth?: string
  payoutAge?: string
  cpiRate?: string
  marketRate?: string
}

function restoreSavedInputs(): SavedInputs | null {
  try {
    const saved =
      localStorage.getItem('pot-trust-modeler:inputs') ??
      localStorage.getItem('lump-sum-trust-group-modeler:inputs')
    if (!saved) return null
    return JSON.parse(saved) as SavedInputs
  } catch {
    return null
  }
}

function amountFromSaved(saved: SavedInputs, mode: SolveMode): string {
  if (saved.amount != null) return saved.amount
  if (mode === 'maturity' && saved.targetMaturityValue != null) {
    return saved.targetMaturityValue
  }
  if (saved.lumpSum != null) return saved.lumpSum
  if (saved.contributions?.length) {
    const total = saved.contributions.reduce((sum, c) => sum + c.amount, 0)
    return String(total)
  }
  return String(DEFAULTS.lumpSum)
}

function fundingMonthFromSaved(saved: SavedInputs): string {
  if (saved.fundingMonth != null) return saved.fundingMonth
  if (saved.fundingMonthsFromFirstBirth != null) {
    return saved.fundingMonthsFromFirstBirth
  }
  if (saved.contributions?.length === 1) {
    return String(saved.contributions[0]!.month)
  }
  return String(DEFAULTS.fundingMonth)
}

function applyDefaultFormFields(): void {
  const setField = (name: string, value: string) => {
    const el = form.elements.namedItem(name)
    if (!(el instanceof HTMLInputElement)) return
    if (name === 'amount') setCurrencyInputValue(el, value)
    else el.value = value
  }
  setField('amount', String(DEFAULTS.lumpSum))
  setField('fundingMonth', String(DEFAULTS.fundingMonth))
  setField('payoutAge', String(DEFAULTS.payoutAge))
  setField('cpiRate', String(DEFAULT_CPI_PCT))
  setField('marketRate', String(DEFAULT_MARKET_PCT))
}

const saved = restoreSavedInputs()

const childList = mountChildList(childrenContainer, {
  mode: 'month-zero',
  state: { spacingMonths: saved?.spacingMonths ?? [...DEFAULTS.spacingMonths] },
  defaultSpacing: 24,
  onChange: () => {},
  onPaint: () => {
    form.dispatchEvent(new Event('change', { bubbles: true }))
  },
})

let mode = modeFromUrl() ?? parseMode(saved?.solveMode) ?? DEFAULTS.solveMode
applyModeToDom(mode)
writeModeToUrl(mode)

mountCalculator(
  form,
  results,
  worksheetEl,
  () => mode,
  (next) => {
    mode = next
    applyModeToDom(mode)
    writeModeToUrl(mode)
  },
  calculate,
  readInputs,
  saved
    ? {
        ...saved,
        amount: amountFromSaved(saved, mode),
        fundingMonth: fundingMonthFromSaved(saved),
      }
    : null,
  () => {
    mode = DEFAULTS.solveMode
    applyModeToDom(mode)
    writeModeToUrl(mode)
    applyDefaultFormFields()
    if (childList.mode === 'month-zero') {
      childList.setState({ spacingMonths: [...DEFAULTS.spacingMonths] })
    }
  },
)
