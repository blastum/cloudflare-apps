/**
 * Safari (and some Chrome) number spinners fire `input` on pointerdown and
 * keep repeating until pointerup. Replacing results DOM in that window steals
 * pointerup, so the stepper sticks in one direction or ignores later clicks.
 *
 * Defer the paint until the pointer is up (short timeout fallback).
 */
export function bindLiveForm(form: HTMLFormElement, paint: () => void): void {
  let dirty = false
  let flushTimer = 0
  const pointersDown = new Set<number>()

  const isNumberInput = (target: EventTarget | null): target is HTMLInputElement =>
    target instanceof HTMLInputElement && target.type === 'number'

  const flush = () => {
    if (flushTimer) {
      window.clearTimeout(flushTimer)
      flushTimer = 0
    }
    if (dirty && pointersDown.size === 0) {
      dirty = false
      paint()
    }
  }

  const schedule = (event: Event) => {
    dirty = true
    if (isNumberInput(event.target) || pointersDown.size > 0) {
      if (pointersDown.size > 0) return
      if (flushTimer) window.clearTimeout(flushTimer)
      flushTimer = window.setTimeout(flush, 200)
      return
    }
    flush()
  }

  form.addEventListener('pointerdown', (event) => {
    if (isNumberInput(event.target)) pointersDown.add(event.pointerId)
  })
  const onPointerEnd = (event: PointerEvent) => {
    pointersDown.delete(event.pointerId)
    flush()
  }
  window.addEventListener('pointerup', onPointerEnd)
  window.addEventListener('pointercancel', onPointerEnd)

  form.addEventListener('input', schedule)
  form.addEventListener('change', schedule)
}
