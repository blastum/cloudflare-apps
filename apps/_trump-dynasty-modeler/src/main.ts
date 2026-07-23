import { calculate, type CalculatorInputs } from './calculator'
import { SLIDER_LIMITS } from './constants'
import { mountCalculator } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
if (!formEl || !resultsEl) throw new Error('Missing calculator form or results')

const form = formEl

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function readInputs(): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100
  const lim = SLIDER_LIMITS

  return {
    initialDeposit: Math.max(0, num('initialDeposit')),
    yearsBeforeFirstBirth: Math.round(
      clamp(
        num('yearsBeforeFirstBirth'),
        lim.yearsBeforeFirstBirth.min,
        lim.yearsBeforeFirstBirth.max,
      ),
    ),
    marketRate: pct('marketRate'),
    cpiRate: pct('cpiRate'),
    generationalGap: Math.round(
      clamp(num('generationalGap'), lim.generationalGap.min, lim.generationalGap.max),
    ),
    childrenPerGeneration: Math.round(
      clamp(
        num('childrenPerGeneration'),
        lim.childrenPerGeneration.min,
        lim.childrenPerGeneration.max,
      ),
    ),
    childSpacing: Math.round(
      clamp(num('childSpacing'), lim.childSpacing.min, lim.childSpacing.max),
    ),
    maxGenerations: Math.round(
      clamp(num('maxGenerations'), lim.maxGenerations.min, lim.maxGenerations.max),
    ),
  }
}

mountCalculator(form, resultsEl, calculate, readInputs)
