export function printToolbarHtml(options?: { label?: string; hint?: string }): string {
  const label = options?.label ?? 'Print summary'
  const hint = options?.hint ?? 'Summary and tables — opens your browser print dialog.'
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-print-summary>${label}</button>
      <span class="export-hint">${hint}</span>
    </div>
  `
}

export function bindPrintToolbar(
  results: HTMLElement,
  options?: { summarySelector?: string },
): void {
  const selector = options?.summarySelector ?? '[data-print-summary], [data-print-results], [data-print-recipe]'
  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (!target.closest(selector)) return
    window.print()
  })
}
