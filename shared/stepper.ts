/**
 * Custom ▲ / ▼ steppers on the right (native placement). Safari/Chrome native
 * spinners fire `input` on pointerdown and repeat until pointerup; replacing
 * results in that window steals pointerup. These buttons use setPointerCapture
 * and paint only on pointerup/cancel (and on typed change / Enter).
 */

const HOLD_DELAY_MS = 400
const HOLD_REPEAT_MS = 50

export type StepperOptions = {
  decimals?: number
  onPaint?: () => void
}

function parseNumber(raw: string): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function decimalPlacesFromStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

function inputDecimals(input: HTMLInputElement, explicit?: number): number {
  if (explicit !== undefined) return explicit
  const step = input.step === 'any' || input.step === '' ? 1 : Number(input.step)
  return decimalPlacesFromStep(Number.isFinite(step) ? step : 1)
}

function inputStep(input: HTMLInputElement): number {
  const step = input.step === 'any' || input.step === '' ? 1 : Number(input.step)
  return Number.isFinite(step) && step > 0 ? step : 1
}

function inputMin(input: HTMLInputElement): number | undefined {
  if (input.min === '') return undefined
  const n = Number(input.min)
  return Number.isFinite(n) ? n : undefined
}

function inputMax(input: HTMLInputElement): number | undefined {
  if (input.max === '') return undefined
  const n = Number(input.max)
  return Number.isFinite(n) ? n : undefined
}

export function formatSteppedValue(value: number, decimals: number): string {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  if (decimals <= 0) return String(Math.round(rounded))
  return rounded.toFixed(decimals)
}

export function nextSteppedValue(
  current: number,
  direction: 1 | -1,
  options: {
    step: number
    decimals: number
    min?: number
    max?: number
  },
): string {
  const { step, decimals } = options
  const factor = 10 ** decimals
  const currentInt = Math.round(current * factor)
  const stepInt = Math.round(step * factor)
  let next = (currentInt + direction * stepInt) / factor
  if (options.min !== undefined) next = Math.max(options.min, next)
  if (options.max !== undefined) next = Math.min(options.max, next)
  return formatSteppedValue(next, decimals)
}

export function snapInputValue(input: HTMLInputElement, decimals?: number): void {
  const places = inputDecimals(input, decimals)
  const min = inputMin(input)
  const max = inputMax(input)
  let n = parseNumber(input.value)
  if (min !== undefined) n = Math.max(min, n)
  if (max !== undefined) n = Math.min(max, n)
  input.value = formatSteppedValue(n, places)
}

export function stepValue(input: HTMLInputElement, direction: 1 | -1): void {
  const decimals = inputDecimals(input)
  input.value = nextSteppedValue(parseNumber(input.value), direction, {
    step: inputStep(input),
    decimals,
    min: inputMin(input),
    max: inputMax(input),
  })
}

function bindStepperButtons(
  input: HTMLInputElement,
  minus: HTMLButtonElement,
  plus: HTMLButtonElement,
  options: StepperOptions,
): void {
  let holdTimer = 0
  let repeatTimer = 0
  let activePointer: number | null = null

  const stopRepeat = () => {
    if (holdTimer) {
      window.clearTimeout(holdTimer)
      holdTimer = 0
    }
    if (repeatTimer) {
      window.clearInterval(repeatTimer)
      repeatTimer = 0
    }
  }

  const paint = () => {
    snapInputValue(input, options.decimals)
    options.onPaint?.()
  }

  const apply = (direction: 1 | -1) => {
    const decimals = inputDecimals(input, options.decimals)
    input.value = nextSteppedValue(parseNumber(input.value), direction, {
      step: inputStep(input),
      decimals,
      min: inputMin(input),
      max: inputMax(input),
    })
  }

  const onPointerDown = (direction: 1 | -1) => (event: PointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    const button = event.currentTarget as HTMLButtonElement
    button.setPointerCapture(event.pointerId)
    activePointer = event.pointerId
    apply(direction)
    stopRepeat()
    holdTimer = window.setTimeout(() => {
      repeatTimer = window.setInterval(() => apply(direction), HOLD_REPEAT_MS)
    }, HOLD_DELAY_MS)
  }

  const onPointerEnd = (event: PointerEvent) => {
    if (activePointer !== null && event.pointerId !== activePointer) return
    activePointer = null
    stopRepeat()
    paint()
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  minus.addEventListener('pointerdown', onPointerDown(-1))
  plus.addEventListener('pointerdown', onPointerDown(1))
  for (const button of [minus, plus]) {
    button.addEventListener('pointerup', onPointerEnd)
    button.addEventListener('pointercancel', onPointerEnd)
  }

  input.addEventListener('change', () => {
    snapInputValue(input, options.decimals)
    options.onPaint?.()
  })
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    snapInputValue(input, options.decimals)
    options.onPaint?.()
  })
}

export function wrapNumberInput(
  input: HTMLInputElement,
  options: StepperOptions = {},
): HTMLElement {
  const existing = input.closest<HTMLElement>('.num-stepper')
  if (existing) return existing

  const wrap = document.createElement('div')
  wrap.className = 'num-stepper'
  const controls = document.createElement('div')
  controls.className = 'num-stepper__controls'
  const up = document.createElement('button')
  up.type = 'button'
  up.className = 'num-stepper__btn num-stepper__btn--up'
  up.setAttribute('aria-label', 'Increase')
  const down = document.createElement('button')
  down.type = 'button'
  down.className = 'num-stepper__btn num-stepper__btn--down'
  down.setAttribute('aria-label', 'Decrease')

  input.parentNode?.insertBefore(wrap, input)
  controls.append(up, down)
  wrap.append(input, controls)
  bindStepperButtons(input, down, up, options)
  snapInputValue(input, options.decimals)
  return wrap
}

export function bindRateField(input: HTMLInputElement, onPaint?: () => void): void {
  input.step = '0.1'
  wrapNumberInput(input, { decimals: 1, onPaint })
  snapInputValue(input, 1)
}

export function bindIntegerField(input: HTMLInputElement, onPaint?: () => void): void {
  if (!input.step || input.step === 'any') input.step = '1'
  wrapNumberInput(input, { decimals: 0, onPaint })
}

export function bindSteppers(root: ParentNode, onPaint?: () => void): void {
  for (const input of root.querySelectorAll<HTMLInputElement>('input[type="number"]')) {
    if (input.closest('.num-stepper')) continue
    const decimals = inputDecimals(input)
    wrapNumberInput(input, { decimals, onPaint })
  }
}
