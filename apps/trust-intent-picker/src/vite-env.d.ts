/// <reference types="vite/client" />

declare module './intent-schema.mjs' {
  export const INTENT_GROUPS: readonly { id: string; label: string }[]
  export const INTENT_FACETS: readonly {
    id: string
    label: string
    group: string
    description?: string
  }[]
  export function getIntentFacet(id: string): { id: string; label: string } | undefined
}

declare module './match-by-intent.mjs' {
  export type MatchResult = {
    slug: string
    name: string
    why: string
    matched: string[]
    missing: string[]
    partial: string[]
    caveats: string[]
    score: number
  }

  export function matchIntents(
    selection: Record<string, boolean>,
    catalog: unknown[],
  ): MatchResult[]
}

declare module './intent-mappings.mjs' {
  export const INTENT_MAPPINGS: unknown[]
}

declare module './intent-url.mjs' {
  export function parseIntentParam(param: string): Record<string, boolean>
  export function readSelectionFromUrl(): Record<string, boolean>
  export function writeSelectionToUrl(selection: Record<string, boolean>): void
}
