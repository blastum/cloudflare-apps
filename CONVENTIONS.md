# Calculator conventions

Vite SPAs in `apps/`. Follow these so the apps stay uniform and we do not rediscover the same Safari bugs.

## Number steppers (required)

Do **not** paint results on every `input` while a pointer is down on a number control.

Safari native `<input type="number">` spinners fire `input` on pointerdown and repeat until pointerup. Replacing the results DOM in that window steals pointerup, so the stepper sticks. Custom ▲ / ▼ buttons on the right (native placement) with `setPointerCapture` are the fix; they paint only on pointerup/cancel (and on typed `change` / Enter).

```ts
import { bindSteppers } from '../../../shared/stepper'
import { bindLiveForm } from '../../../shared/defer-form-paint'

bindSteppers(form, render)
bindLiveForm(form, render)
```

`bindSteppers` hides native spinners and wraps each `type="number"` input. Keep `bindLiveForm` as a safety net for leftover number inputs.

Do not also bind `input`/`change` → `render()` on nested contribution lists; those events bubble to the form.

Immediate `render()` is fine for **button** clicks (add/remove row).

## Rate fields

CPI / market fields: `step=0.1`, display one decimal (`3.2`, `10.3`), no float junk.

```ts
import { bindGrowthFields } from '../../../shared/growth-fields'
import { DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT } from '../../../shared/growth'

bindGrowthFields(form, render)
```

Defaults are **3.2%** CPI and **10.3%** market unless the model documents otherwise.

## Number field markup

Do **not** wrap the input in `<label>`. Safari mishandles spinner clicks on that pattern.

```html
<div class="form-field">
  <label for="cpi-rate">Average CPI (%)</label>
  <input id="cpi-rate" type="number" name="cpiRate" min="0" max="20" step="0.1" value="3.2" autocomplete="off" />
  <span class="field-hint">…</span>
</div>
```

Calculator `<form>` gets `autocomplete="off"`. Number inputs too.

Import kit CSS from `main.ts`:

```ts
import '../../../shared/styles/controls.css'
import '../../../shared/styles/print.css'
```

## Child lists

Use `mountChildList` from `shared/child-list.ts` (`birth-date` or `month-zero`). The anchor row cannot be removed. Extra rows have a per-row Remove (not “pop last”). Add-child is included. `onChange` must not replace the focused row.

## Reset

```ts
import { bindCalculatorReset } from '../../../shared/reset'

bindCalculatorReset({
  form,
  storageKeys: ['app-slug:inputs'],
  fieldDefaults: { cpiRate: '3.2', marketRate: '10.3' },
  onReset: () => { /* restore children / lists */ },
  paint: render,
})
```

## Print / PDF

`bindPrintToolbar` + `printToolbarHtml` from `shared/print.ts`. PDF via `shared/pdf.ts` (`downloadPdfReport`); pass an `ExportDocument`. Apps may keep `window.print()`.

## Shared helpers

Import from repo-root `shared/` (`../../../shared/…` from `apps/<slug>/src`). Do not copy money, stepper, child-list, growth, or print into a new app.

Existing `apps/*/src/shared/money.ts` files re-export from `shared/money.ts`.

Growth math: `roundUsd`, `inflate`, `deflate`, `growYears`, `realFactor` in `shared/growth.ts`.

## Contribution rows

New row: year = last row’s year + 1; amount = last row’s amount, or the initial default if there is no previous amount.

## Modes over new apps

A new question in the same family is a **mode** + `?mode=` deep link + `_redirects` 301. Do not add a 15th tile.

## Chrome

IBM Plex, `public/css/theme.css`, smirk cat.
