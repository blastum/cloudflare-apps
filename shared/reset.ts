import { isCurrencyInput, setCurrencyInputValue } from './currency-input'

export function bindCalculatorReset(options: {
  form: HTMLFormElement
  storageKeys: string[]
  fieldDefaults: Record<string, string>
  onReset?: () => void
  paint: () => void
}): void {
  const { form, storageKeys, fieldDefaults, onReset, paint } = options
  const button = form
    .closest('.card--inputs, .card')
    ?.querySelector<HTMLButtonElement>('[data-reset-assumptions]')
  if (!button) return

  button.addEventListener('click', () => {
    for (const key of storageKeys) {
      try {
        localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }

    for (const [name, value] of Object.entries(fieldDefaults)) {
      const el = form.elements.namedItem(name)
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
          el.checked = value === '1' || value === 'true'
        } else if (isCurrencyInput(el)) {
          setCurrencyInputValue(el, value)
        } else {
          el.value = value
        }
      } else if (el instanceof HTMLSelectElement) {
        el.value = value
      }
    }

    onReset?.()
    paint()
  })
}
