import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, 'content')

const candidates = [
  join(root, '../../../NotebookLinkManager/notebook/estate-planning/notes'),
  join(root, '../../../../NotebookLinkManager/notebook/estate-planning/notes'),
  '/Users/james/Developer/NotebookLinkManager/notebook/estate-planning/notes',
]

const FILES = [
  'glossary-and-trust-types.md',
  'estate-planning-glossary.md',
  'trusts-overview-for-estates.md',
  'ab-abc-trust-plan.md',
  'bypass-trust-and-first-death-tax.md',
  'strategies-overview.md',
  'inheritance-flow.md',
  'tax-treatment.md',
  'trust-taxation-and-gst.md',
  'roth-iras-and-trusts.md',
  'roth-estate-tax-shielding.md',
  'weaknesses-and-limitations.md',
  'costs.md',
  'illinois-estate-tax-computation.md',
  'illinois-estate-tax-chart-3.9m-6m.md',
  'hb2368.md',
  'estate-planning-document-checklist.md',
  'wills-and-pour-over.md',
  'financial-power-of-attorney.md',
  'incapacity-and-healthcare-directives.md',
]

async function main() {
  const src = candidates.find((p) => existsSync(p))
  if (!src) {
    console.error('Notebook notes folder not found. Content left unchanged.')
    process.exit(1)
  }

  await mkdir(dest, { recursive: true })
  for (const file of FILES) {
    await cp(join(src, file), join(dest, file))
  }
  console.log(`Synced ${FILES.length} notes from ${src}`)
  const listing = await readdir(dest)
  console.log(listing.sort().join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
