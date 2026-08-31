import { currencyFromForm } from '../../../shared/currency-input'
import '../../../shared/styles/controls.css'
import '../../../shared/styles/print.css'
import { calculate, type CalculatorInputs } from './calculator'
import { type ProjectionMode } from './constants'
import { mountCalculator, readContributions } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
if (!formEl || !resultsEl) throw new Error('Missing calculator form or results')

const form = formEl

function readInputs(mode: ProjectionMode): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100

  if (mode === 'annual') {
    return {
      mode: 'annual',
      initialInvestment: Math.max(0, currencyFromForm(data, 'initialInvestment')),
      annualAddition: Math.max(0, currencyFromForm(data, 'annualAddition')),
      years: Math.max(0, Math.round(num('years'))),
      expectedReturn: pct('expectedReturn'),
      expectedInflation: pct('expectedInflation'),
    }
  }

  return {
    mode: 'child',
    startingAge: Math.max(0, Math.round(num('startingAge'))),
    startingBalance: Math.max(0, currencyFromForm(data, 'startingBalance')),
    contributions: readContributions(form),
    contributionsInReal: data.get('contributionsInReal') === '1',
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
  }
}

mountCalculator(form, resultsEl, calculate, readInputs)
