import { calculate, type CalculatorInputs } from './calculator'
import { DEFAULTS, MAX_TRIALS, MIN_TRIALS } from './constants'
import { mountCalculator } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
if (!formEl || !resultsEl) throw new Error('Missing calculator form or results')

const form = formEl

function readInputs(): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const trials = Math.round(
    Math.min(MAX_TRIALS, Math.max(MIN_TRIALS, num('trials') || DEFAULTS.trials)),
  )
  return {
    totalDebt: Math.max(0, num('totalDebt')),
    monthlyBudget: Math.max(0, num('monthlyBudget')),
    minPaymentPercent: Math.max(0, num('minPaymentPercent')),
    minApr: num('minApr'),
    maxApr: num('maxApr'),
    trials,
  }
}

mountCalculator(form, resultsEl, calculate, readInputs)
