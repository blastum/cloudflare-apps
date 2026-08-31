import { currencyFromForm } from '../../../shared/currency-input'
import '../../../shared/styles/controls.css'
import '../../../shared/styles/print.css'
import { calculate, type CalculatorInputs } from './calculator'
import { mountCalculator } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
const scenariosEl = document.querySelector<HTMLDivElement>('#scenarios')
if (!formEl || !resultsEl || !scenariosEl) {
  throw new Error('Missing calculator form, results, or scenarios')
}

const form = formEl

function readInputs(): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const situsPct = num('illinoisSitusPercent')
  return {
    tentativeTaxableEstate: Math.max(0, currencyFromForm(data, 'tentativeTaxableEstate')),
    adjustedTaxableGifts: Math.max(0, currencyFromForm(data, 'adjustedTaxableGifts')),
    illinoisSitusFraction: Math.max(0, Math.min(100, situsPct)) / 100,
  }
}

mountCalculator(form, resultsEl, scenariosEl, calculate, readInputs)
