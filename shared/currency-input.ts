const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export const CURRENCY_INPUT_SELECTOR = 'input.input-currency, input[data-currency]'

export function isCurrencyInput(input: HTMLInputElement): boolean {
  return (
    input.classList.contains('input-currency') || input.hasAttribute('data-currency')
  )
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits)
}

export function formatCurrencyInput(amount: number): string {
  if (!Number.isFinite(amount)) return ''
  return integerFormatter.format(Math.max(0, Math.round(amount)))
}

export function currencyFromForm(data: FormData, name: string): number {
  const raw = data.get(name)
  return parseCurrencyInput(typeof raw === 'string' ? raw : '')
}

export function setCurrencyInputValue(
  input: HTMLInputElement,
  value: string | number,
): void {
  const amount =
    typeof value === 'string' ? parseCurrencyInput(value) : value
  input.value = formatCurrencyInput(amount)
}

export function bindCurrencyInput(input: HTMLInputElement): void {
  if (input.dataset.currencyBound === '1') return
  input.dataset.currencyBound = '1'

  const format = () => {
    const start = input.selectionStart ?? input.value.length
    const digitsBefore = input.value.slice(0, start).replace(/\D/g, '').length
    const parsed = parseCurrencyInput(input.value)
    input.value = formatCurrencyInput(parsed)

    let pos = 0
    let seen = 0
    while (pos < input.value.length && seen < digitsBefore) {
      if (/\d/.test(input.value.charAt(pos))) seen++
      pos++
    }
    input.setSelectionRange(pos, pos)
  }

  input.addEventListener('input', format)
  format()
}

export function bindCurrencyInputs(
  root: ParentNode,
  fieldNames?: string[],
): void {
  if (fieldNames) {
    for (const name of fieldNames) {
      const el = root instanceof HTMLFormElement
        ? root.elements.namedItem(name)
        : root.querySelector<HTMLInputElement>(`[name="${name}"]`)
      if (el instanceof HTMLInputElement) bindCurrencyInput(el)
    }
    return
  }

  for (const input of root.querySelectorAll<HTMLInputElement>(CURRENCY_INPUT_SELECTOR)) {
    bindCurrencyInput(input)
  }
}
