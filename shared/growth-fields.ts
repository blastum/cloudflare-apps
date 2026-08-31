import { DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT } from './growth'
import { bindRateField } from './stepper'

export const CPI_HINT = 'Default ~US CPI 1975–2025 (BLS)'
export const MARKET_HINT = 'Default ~S&amp;P 500 total return 1975–2025'

export function growthFieldsHtml(options?: {
  cpiId?: string
  marketId?: string
  cpiHint?: string
  marketHint?: string
}): string {
  const cpiId = options?.cpiId ?? 'cpi-rate'
  const marketId = options?.marketId ?? 'market-rate'
  const cpiHint = options?.cpiHint ?? CPI_HINT
  const marketHint = options?.marketHint ?? MARKET_HINT
  return `
    <div class="form-field">
      <label for="${cpiId}">Average CPI (%)</label>
      <input id="${cpiId}" type="number" name="cpiRate" min="0" max="20" step="0.1" value="${DEFAULT_CPI_PCT}" autocomplete="off" />
      <span class="field-hint">${cpiHint}</span>
    </div>
    <div class="form-field">
      <label for="${marketId}">Average market growth (%)</label>
      <input id="${marketId}" type="number" name="marketRate" min="0" max="30" step="0.1" value="${DEFAULT_MARKET_PCT}" autocomplete="off" />
      <span class="field-hint">${marketHint}</span>
    </div>
  `
}

const RATE_NAMES = new Set(['cpiRate', 'marketRate', 'expectedReturn', 'expectedInflation'])

export function bindGrowthFields(form: HTMLFormElement, onPaint?: () => void): void {
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="number"]')) {
    if (!RATE_NAMES.has(input.name)) continue
    bindRateField(input, onPaint)
  }
}
