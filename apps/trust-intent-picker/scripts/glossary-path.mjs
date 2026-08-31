import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = join(scriptDir, '..')
const repoRoot = join(appRoot, '../..')

/** @type {readonly string[]} */
const CANDIDATE_ROOTS = [
  process.env.ESTATE_NOTEBOOK_ROOT,
  join(repoRoot, '../../.cursor/activities/estate-planning-trust-reference'),
  join(repoRoot, '../estate-planning-trust-reference'),
  join(repoRoot, 'NotebookLinkManager'),
].filter(Boolean)

/**
 * Resolve notebook estate-planning notes directory.
 * Override with ESTATE_NOTEBOOK_ROOT (directory containing estate-planning/notes).
 * @returns {string}
 */
export function resolveNotebookNotesDir() {
  for (const root of CANDIDATE_ROOTS) {
    const notesDir = root.endsWith('notes')
      ? root
      : join(root, 'notebook/estate-planning/notes')
    if (existsSync(join(notesDir, 'glossary-and-trust-types.md'))) return notesDir
  }

  throw new Error(
    'glossary-and-trust-types.md not found. Set ESTATE_NOTEBOOK_ROOT to the notebook notes directory.',
  )
}

/**
 * @param {string} filename
 */
export function resolveNotebookFile(filename) {
  return join(resolveNotebookNotesDir(), filename)
}
