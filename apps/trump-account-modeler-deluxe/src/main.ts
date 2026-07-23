import { calculate, type CalculatorInputs } from './calculator'
import { MAX_ANNUAL_CONTRIBUTION } from './constants'
import { mountCalculator } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
if (!formEl || !resultsEl) throw new Error('Missing calculator form or results')

const form = formEl

function readInputs(): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100
  return {
    startingAge: Math.max(0, Math.round(num('startingAge'))),
    startingBalance: Math.max(0, num('startingBalance')),
    annualContribution: Math.min(
      MAX_ANNUAL_CONTRIBUTION,
      Math.max(0, num('annualContribution')),
    ),
    contributionInflationIndexed: data.get('contributionInflationIndexed') === 'on',
    enablePrefund: data.get('enablePrefund') === 'on',
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
  }
}

mountCalculator(form, resultsEl, calculate, readInputs)
