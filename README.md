# Smirking Cat Software

Umbrella site for small single-page web apps, deployed on [Cloudflare Pages](https://developers.cloudflare.com/pages/).

## Layout

```
/
├── index.html          # Home page (/)
├── apps/               # One folder per app → served at /<slug>/
│   └── trump-account-modeler/
├── scripts/build.mjs   # Builds all apps into dist/
├── dist/               # Pages deploy output (gitignored)
└── wrangler.jsonc      # Local dev + Pages config
```

## Local development

```bash
npm install
npm run dev
```

`npm run build` copies the home page and each built app into `dist/`.

## Cloudflare Pages setup

1. Create a Pages project connected to this GitHub repo.
2. **Production branch:** `main`
3. **Build command:** `npm run build`
4. **Build output directory:** `dist`
5. **Node version:** 22 (or latest LTS in Pages settings)

Preview deployments are created automatically for other branches and pull requests.

## Apps

- [Trump Account Modeler](/trump-account-modeler/) — growth, Roth conversion, and IRA projections
- [Illinois Estate Tax Modeler](/illinois-estate-tax-modeler/) — Form 700 / AG calculator parity
- [Estate Trusts](/estate-trusts/) — hyperlinked trust types, guides, Illinois notes, glossary
- [Ramsey Debt Modeler](/ramsey-modeler/) — Monte Carlo snowball vs avalanche debt payoff
