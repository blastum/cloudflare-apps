import { formatMonthYear, MONTH_NAMES } from './money'
import { bindIntegerField } from './stepper'

/** Label for spacing inputs between consecutive children (birth-date and month-zero UIs). */
export const SPACING_AFTER_PREVIOUS_CHILD_LABEL =
  'Spacing after previous child adds (months)'

export type BirthDateChild = {
  birthYear: number
  birthMonth: number
}

export type BirthDateState = {
  firstChild: BirthDateChild
  childSpacings: number[]
}

export type MonthZeroState = {
  spacingMonths: number[]
}

type BirthDateOptions = {
  mode: 'birth-date'
  state: BirthDateState
  defaultSpacing?: number
  onChange: (state: BirthDateState) => void
  onPaint: () => void
}

type MonthZeroOptions = {
  mode: 'month-zero'
  state: MonthZeroState
  defaultSpacing?: number
  onChange: (state: MonthZeroState) => void
  onPaint: () => void
}

export type ChildListHandle =
  | {
      mode: 'birth-date'
      getState: () => BirthDateState
      setState: (state: BirthDateState) => void
    }
  | {
      mode: 'month-zero'
      getState: () => MonthZeroState
      setState: (state: MonthZeroState) => void
    }

function addMonths(year: number, month: number, delta: number): BirthDateChild {
  const total = year * 12 + (month - 1) + delta
  return {
    birthYear: Math.floor(total / 12),
    birthMonth: (total % 12) + 1,
  }
}

function monthOptions(selected: number): string {
  return MONTH_NAMES.map(
    (name, i) =>
      `<option value="${i + 1}"${i + 1 === selected ? ' selected' : ''}>${name}</option>`,
  ).join('')
}

function derivedBirths(state: BirthDateState): BirthDateChild[] {
  const children: BirthDateChild[] = [{ ...state.firstChild }]
  let current = state.firstChild
  for (const spacing of state.childSpacings) {
    current = addMonths(current.birthYear, current.birthMonth, spacing)
    children.push({ ...current })
  }
  return children
}

function bindNewSteppers(root: ParentNode, onPaint: () => void): void {
  for (const input of root.querySelectorAll<HTMLInputElement>('input[type="number"]')) {
    if (input.closest('.num-stepper')) continue
    bindIntegerField(input, onPaint)
  }
}

function mountBirthDate(container: HTMLElement, options: BirthDateOptions): ChildListHandle {
  let state: BirthDateState = {
    firstChild: { ...options.state.firstChild },
    childSpacings: [...options.state.childSpacings],
  }
  const defaultSpacing = options.defaultSpacing ?? 20

  const readFromDom = (): void => {
    const anchor = container.querySelector<HTMLElement>('[data-anchor-row]')
    if (anchor) {
      state.firstChild = {
        birthYear: Number(
          anchor.querySelector<HTMLInputElement>('[data-birth-year]')?.value ??
            state.firstChild.birthYear,
        ),
        birthMonth: Number(
          anchor.querySelector<HTMLSelectElement>('[data-birth-month]')?.value ??
            state.firstChild.birthMonth,
        ),
      }
    }
    state.childSpacings = [...container.querySelectorAll<HTMLElement>('[data-spacing-row]')].map(
      (row) =>
        Math.max(
          1,
          Math.round(
            Number(row.querySelector<HTMLInputElement>('[data-spacing-months]')?.value) ||
              defaultSpacing,
          ),
        ),
    )
  }

  const updateHints = (): void => {
    const children = derivedBirths(state)
    container.querySelectorAll<HTMLElement>('[data-spacing-row]').forEach((row, index) => {
      const spacing = state.childSpacings[index] ?? defaultSpacing
      const born = children[index + 1]
      const hint = row.querySelector('.field-hint')
      if (hint && born) {
        hint.textContent = `${spacing} months · born ${formatMonthYear(born.birthYear, born.birthMonth)}`
      }
    })
  }

  const emit = (): void => {
    options.onChange({
      firstChild: { ...state.firstChild },
      childSpacings: [...state.childSpacings],
    })
  }

  const render = (): void => {
    const children = derivedBirths(state)
    const spacingRows = state.childSpacings
      .map((spacing, index) => {
        const born = children[index + 1]!
        return `
    <div class="child-row child-row--spacing" data-child-row data-spacing-row>
      <div class="form-field">
        <label for="spacing-months-${index}">${SPACING_AFTER_PREVIOUS_CHILD_LABEL}</label>
        <input
          id="spacing-months-${index}"
          type="number"
          data-spacing-months
          min="1"
          max="240"
          step="1"
          value="${spacing}"
          autocomplete="off"
        />
        <span class="field-hint">${spacing} months · born ${formatMonthYear(born.birthYear, born.birthMonth)}</span>
      </div>
      <button type="button" class="btn-remove-child" data-remove-child="${index + 1}">Remove</button>
    </div>`
      })
      .join('')

    container.innerHTML = `
    <fieldset class="child-row child-row--anchor" data-child-row data-anchor-row>
      <legend class="child-row-legend">First child</legend>
      <div class="form-field">
        <label for="first-child-year">Year</label>
        <input
          id="first-child-year"
          type="number"
          data-birth-year
          min="1990"
          max="2040"
          step="1"
          value="${state.firstChild.birthYear}"
          autocomplete="off"
        />
      </div>
      <div class="form-field">
        <label for="first-child-month">Month</label>
        <select id="first-child-month" data-birth-month autocomplete="off">${monthOptions(state.firstChild.birthMonth)}</select>
      </div>
    </fieldset>
    ${spacingRows}
    <button type="button" class="btn-add-child" data-add-child>Add child</button>
    `

    bindNewSteppers(container, options.onPaint)
  }

  container.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    if (target.closest('[data-add-child]')) {
      readFromDom()
      state.childSpacings.push(defaultSpacing)
      emit()
      render()
      options.onPaint()
      return
    }

    const remove = target.closest<HTMLElement>('[data-remove-child]')
    if (remove) {
      const idx = Number(remove.dataset.removeChild)
      readFromDom()
      if (idx >= 1) state.childSpacings.splice(idx - 1, 1)
      emit()
      render()
      options.onPaint()
    }
  })

  container.addEventListener('input', () => {
    readFromDom()
    updateHints()
    emit()
  })
  container.addEventListener('change', () => {
    readFromDom()
    updateHints()
    emit()
  })

  render()

  return {
    mode: 'birth-date',
    getState: () => {
      readFromDom()
      return {
        firstChild: { ...state.firstChild },
        childSpacings: [...state.childSpacings],
      }
    },
    setState: (next) => {
      state = {
        firstChild: { ...next.firstChild },
        childSpacings: [...next.childSpacings],
      }
      render()
    },
  }
}

function mountMonthZero(container: HTMLElement, options: MonthZeroOptions): ChildListHandle {
  let spacingMonths =
    options.state.spacingMonths.length > 0 ? [...options.state.spacingMonths] : [0]
  spacingMonths[0] = 0
  const defaultSpacing = options.defaultSpacing ?? 24

  const readFromDom = (): void => {
    const rows = container.querySelectorAll<HTMLElement>('[data-child-row]')
    const next: number[] = []
    rows.forEach((row, index) => {
      if (index === 0) {
        next.push(0)
        return
      }
      const input = row.querySelector<HTMLInputElement>('[data-spacing-months]')
      next.push(Math.max(0, Number(input?.value ?? defaultSpacing)))
    })
    spacingMonths = next.length > 0 ? next : [0]
  }

  const emit = (): void => {
    options.onChange({ spacingMonths: [...spacingMonths] })
  }

  const render = (): void => {
    const rows = spacingMonths
      .map((months, index) => {
        if (index === 0) {
          return `
      <div class="child-row child-row--month-zero" data-child-row>
        <span class="child-row__label">Child 1</span>
        <span class="child-row__birth">Born at month 0</span>
      </div>`
        }
        return `
      <div class="child-row child-row--month-zero" data-child-row>
        <span class="child-row__label">Child ${index + 1}</span>
        <div class="form-field child-row__spacing">
          <label for="spacing-${index + 1}">${SPACING_AFTER_PREVIOUS_CHILD_LABEL}</label>
          <input
            id="spacing-${index + 1}"
            type="number"
            data-spacing-months
            min="0"
            max="240"
            step="1"
            value="${months}"
            autocomplete="off"
          />
        </div>
        <button type="button" class="btn-remove-child" data-remove-child="${index}" aria-label="Remove child ${index + 1}">Remove</button>
      </div>`
      })
      .join('')

    container.innerHTML = `
      ${rows}
      <button type="button" class="btn-add-child" data-add-child>Add child</button>
    `
    bindNewSteppers(container, options.onPaint)
  }

  container.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    if (target.closest('[data-add-child]')) {
      readFromDom()
      spacingMonths.push(defaultSpacing)
      emit()
      render()
      options.onPaint()
      return
    }

    const remove = target.closest<HTMLElement>('[data-remove-child]')
    if (!remove) return
    const idx = Number(remove.dataset.removeChild)
    readFromDom()
    if (spacingMonths.length <= 1 || idx < 1) return
    spacingMonths.splice(idx, 1)
    spacingMonths[0] = 0
    emit()
    render()
    options.onPaint()
  })

  container.addEventListener('input', () => {
    readFromDom()
    emit()
  })
  container.addEventListener('change', () => {
    readFromDom()
    emit()
  })

  render()

  return {
    mode: 'month-zero',
    getState: () => {
      readFromDom()
      return { spacingMonths: [...spacingMonths] }
    },
    setState: (next) => {
      spacingMonths = next.spacingMonths.length > 0 ? [...next.spacingMonths] : [0]
      spacingMonths[0] = 0
      render()
    },
  }
}

export function mountChildList(
  container: HTMLElement,
  options: BirthDateOptions | MonthZeroOptions,
): ChildListHandle {
  container.classList.add('children-list')
  if (options.mode === 'birth-date') return mountBirthDate(container, options)
  return mountMonthZero(container, options)
}
