import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  clearAssumptions,
  defaultAssumptions,
  loadAssumptions,
  saveAssumptions,
} from './persistence'

function installLocalStorageMock(): void {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => store.clear(),
    },
    configurable: true,
  })
}

describe('persistence', () => {
  beforeEach(() => {
    installLocalStorageMock()
    clearAssumptions()
  })

  it('round-trips assumptions including child spacings', () => {
    const state = defaultAssumptions()
    state.childSpacings.push(20, 18)
    saveAssumptions(state)
    expect(loadAssumptions()).toEqual(state)
  })

  it('migrates legacy absolute child birth dates', () => {
    saveAssumptions({
      mode: 'several',
      fundingYear: '2026',
      cpiRate: '3.2',
      marketRate: '10.3',
      children: [
        { birthYear: 2025, birthMonth: 10 },
        { birthYear: 2027, birthMonth: 6 },
      ],
    } as unknown as ReturnType<typeof defaultAssumptions>)
    expect(loadAssumptions()).toEqual({
      fundingYear: '2026',
      cpiRate: '3.2',
      marketRate: '10.3',
      firstChild: { birthYear: 2025, birthMonth: 10 },
      childSpacings: [20],
    })
  })

  it('clear removes saved state', () => {
    saveAssumptions(defaultAssumptions())
    clearAssumptions()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
