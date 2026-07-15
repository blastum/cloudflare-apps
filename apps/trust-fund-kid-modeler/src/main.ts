import { calculate, type CalculatorInputs } from './calculator'
import { TRUST_SYNOPSIS, TRUST_WEB_ATTRIBUTES } from './brand'
import { mountCalculator } from './render'

const formEl = document.querySelector<HTMLFormElement>('#calculator-form')
const resultsEl = document.querySelector<HTMLDivElement>('#results')
const heroAttributesEl = document.querySelector<HTMLUListElement>('#hero-attributes')
const heroSynopsisEl = document.querySelector<HTMLParagraphElement>('#hero-synopsis')
if (!formEl || !resultsEl) throw new Error('Missing calculator form or results')

if (heroSynopsisEl) {
  heroSynopsisEl.textContent = TRUST_SYNOPSIS
}

if (heroAttributesEl) {
  heroAttributesEl.innerHTML = TRUST_WEB_ATTRIBUTES.map((item) => `<li>${item}</li>`).join('')
}

const form = formEl

function readInputs(): CalculatorInputs {
  const data = new FormData(form)
  const num = (name: string) => Number(data.get(name) ?? 0)
  const pct = (name: string) => num(name) / 100
  return {
    startingAge: Math.max(0, Math.min(17, Math.round(num('startingAge')))),
    cpiRate: pct('cpiRate'),
    marketRate: pct('marketRate'),
    brokerageRealTarget: Math.max(0, num('brokerageRealTarget')),
    trumpRealAnnual: Math.max(0, num('trumpRealAnnual')),
    giftRealAnnual: Math.max(0, num('giftRealAnnual')),
    trumpSeed: Math.max(0, num('trumpSeed')),
  }
}

mountCalculator(form, resultsEl, calculate, readInputs)
