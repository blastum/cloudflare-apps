# Smirking Cat Software

Umbrella site for small single-page web apps, deployed on [Cloudflare Pages](https://developers.cloudflare.com/pages/).

**Production:** [smirking-cat-software.com](https://smirking-cat-software.com)

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

Calculator UI conventions (Safari number spinners, form fields): [CONVENTIONS.md](CONVENTIONS.md).

## Cloudflare Pages setup

Pages project: **smirking-cat-software** (repo: `blastum/cloudflare-apps`).

1. Create a Pages project connected to this GitHub repo (already done).
2. **Production branch:** `main`
3. **Build command:** `npm run build`
4. **Build output directory:** `dist`
5. **Node version:** 22 (or latest LTS in Pages settings)

### Custom domain

Production is served at **smirking-cat-software.com** (and **www.smirking-cat-software.com**). The zone must be on the same Cloudflare account as the Pages project.

Custom domains are attached in **Workers & Pages → smirking-cat-software → Custom domains**. For a zone already on Cloudflare, confirming each hostname there creates proxied CNAME records pointing at `smirking-cat-software.pages.dev`.

If a domain stays **Pending** with “CNAME record not set”, add these proxied records under **DNS** for `smirking-cat-software.com`:

| Type  | Name | Content                         |
| ----- | ---- | ------------------------------- |
| CNAME | `@`  | `smirking-cat-software.pages.dev` |
| CNAME | `www` | `smirking-cat-software.pages.dev` |

`wrangler.jsonc` uses `"name": "smirking-cat-software"` to match the Pages project.

Preview deployments are created automatically for other branches and pull requests.

## Apps

### Kitchen

- [Sourdough Calculator](/sourdough-calculator/) — baker's percentages to preferment and dough grams

### Finance

- [Growth Factor Table](/growth-factor-table/) — dollar-free compounding factors by years and milestone ages
- [Trump Account Modeler](/trump-account-modeler/) — lump-sum brokerage setaside to fund Trump accounts for one or more children
- [Brokerage Modeler](/child-brokerage-modeler/) — child year-by-year gifts, or constant annual contributions
- [Illinois Estate Tax Modeler](/illinois-estate-tax-modeler/) — Form 700 / AG calculator parity
