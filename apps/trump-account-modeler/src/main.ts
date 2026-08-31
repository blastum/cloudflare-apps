import '../../../shared/styles/controls.css'
import '../../../shared/styles/print.css'
import { mountChildList } from '../../../shared/child-list'
import { DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT } from '../../../shared/growth'
import { deriveChildren } from './children'
import { calculate, defaultInputs, type CalculatorInputs, type ChildInput } from './calculator'
import { DEFAULT_CHILD_SPACING_MONTHS, DEFAULTS } from './constants'
import {
  applyFormAssumptions,
  clearAssumptions,
  defaultAssumptions,
  loadAssumptions,
  saveAssumptions,
  STORAGE_KEY,
  type SavedAssumptions,
} from './persistence'
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

const childList = mountChildList(childrenContainer, {
  mode: 'birth-date',
  state: { firstChild, childSpacings },
  defaultSpacing: DEFAULT_CHILD_SPACING_MONTHS,
  onChange: (state) => {
    firstChild = state.firstChild
    childSpacings = state.childSpacings
  },
  onPaint: () => {
    form.dispatchEvent(new Event('change', { bubbles: true }))
  },
})

function syncChildren(): void {
  if (childList.mode !== 'birth-date') return
  const live = childList.getState()
  firstChild = live.firstChild
  childSpacings = live.childSpacings
}

function assumptionsFromState(): SavedAssumptions {
  syncChildren()
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
  syncChildren()
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

applyFormAssumptions(form, initialAssumptions)

mountCalculator(form, resultsEl, calculate, readInputs, {
  onPersist: () => saveAssumptions(assumptionsFromState()),
  storageKeys: [STORAGE_KEY, 'trump-account-modeler:inputs'],
  fieldDefaults: {
    fundingYear: String(DEFAULTS.fundingYear),
    cpiRate: String(DEFAULT_CPI_PCT),
    marketRate: String(DEFAULT_MARKET_PCT),
  },
  onReset: () => {
    clearAssumptions()
    const defaults = defaultAssumptions()
    firstChild = defaults.firstChild
    childSpacings = defaults.childSpacings
    if (childList.mode === 'birth-date') {
      childList.setState({ firstChild, childSpacings })
    }
  },
})
