# Apps

Each subdirectory here is an independent single-page app (typically Vite + TypeScript).

## URL layout

After build, source in `apps/trump-calculator/` is served at the site root subpath:

```
https://<your-domain>/trump-calculator/
```

(The `apps/` folder is only the monorepo layout — it is not part of the public URL.)

The umbrella home page lives at `/` (`index.html` in the repo root).

## Adding a new app

1. Create `apps/<slug>/` with its own `package.json`, `index.html`, and source.
2. Configure Vite `base: '/<slug>/'` so asset paths resolve under the subpath.
3. Set Vite `build.outDir` to `dist` (default).
4. Run `npm run build` from the repo root — the root build script copies each app into `dist/<slug>/`.
5. Add a link on the root `index.html`.

See `apps/_template/` for a starter layout (when present).
