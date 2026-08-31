# Apps

Each subdirectory here is an independent single-page app (typically Vite + TypeScript).

## URL layout

After build, source in `apps/trump-account-modeler/` is served at the site root subpath:

```
https://smirking-cat-software.com/trump-account-modeler/
```

(The `apps/` folder is only the monorepo layout — it is not part of the public URL.)

The umbrella home page lives at `/` (`index.html` in the repo root).

See `CONVENTIONS.md` at the repo root for the shared calculator kit: custom number steppers, growth fields (CPI 3.2% / market 10.3%), child lists, reset, print/PDF, and imports from `shared/`.

## Adding a new app

1. Create `apps/<slug>/` with its own `package.json`, `index.html`, and source.
2. Configure Vite `base: '/<slug>/'` so asset paths resolve under the subpath.
3. Set Vite `build.outDir` to `dist` (default).
4. Run `npm run build` from the repo root — the root build script copies each app into `dist/<slug>/`.
5. Add a link on the root `index.html`.

See `apps/_template/` for a starter layout (when present).
