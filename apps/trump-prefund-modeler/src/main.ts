import { calculate, type CalculatorInputs } from './calculator'
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
    childCount: Math.max(1, Math.round(num('childCount'))),
    childSpacingYears: Math.max(0, Math.round(num('childSpacingYears'))),
    yearsBeforeFirstBirth: Math.max(0, Math.round(num('yearsBeforeFirstBirth'))),
    contributionInflationIndexed: data.get('contributionInflationIndexed') === 'on',
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
  }
}

mountCalculator(form, resultsEl, calculate, readInputs)
