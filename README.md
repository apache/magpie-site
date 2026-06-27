# Apache Magpie — Website

Landing page and documentation hub for [Apache Magpie](https://github.com/apache/magpie), an AI assistant that helps open-source maintainers handle the repetitive parts of running a project — triage, mentoring, drafting fixes, and security-report handling — so they can focus on the work that needs a human.

> Status: **Apache Top-Level Project**. Project source lives at [apache/magpie](https://github.com/apache/magpie); this repo holds the public website.

## Stack

| Layer | Tool |
|---|---|
| Framework | [Astro 6](https://astro.build) (static output) |
| UI | React 19 + [Tailwind CSS 4](https://tailwindcss.com) |
| Animations | [Magic UI](https://magicui.design) (Particles, BorderBeam, BlurFade, TextAnimate, ShimmerButton) via `motion` |
| Icons | [lucide-react](https://lucide.dev) + inline SVG for brand marks |
| Docs | Astro content collections, markdown synced from [apache/magpie/docs](https://github.com/apache/magpie/tree/main/docs) |

Zero runtime dependency on closed-source design tooling. All components are owned in-tree.

## Local development

```bash
npm install
npm run sync-docs    # one-time fetch of markdown from apache/magpie
npm run dev          # http://localhost:4321
```

The `prebuild` hook runs `sync-docs` automatically, so `npm run build` always pulls a fresh copy of docs before generating the static site.

### Available commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run sync-docs` | Clone `apache/magpie` (sparse, `docs/` + `images/`) into `src/content/docs/` and `public/docs-assets/` |
| `npm run build` | Static build to `dist/` (runs sync-docs first) |
| `npm run preview` | Serve the built site locally |
| `npm run astro` | Astro CLI passthrough |

### Environment variables (optional)

| Var | Default | Purpose |
|---|---|---|
| `MAGPIE_DOCS_REPO` | `https://github.com/apache/magpie.git` | Source repo for markdown |
| `MAGPIE_DOCS_BRANCH` | `main` | Branch to sync from |

## Project structure

```
website/
├── scripts/
│   └── sync-docs.sh             # sparse-clone docs/ + images/ from source repo
├── src/
│   ├── components/
│   │   ├── Badge/               # Subframe-derived primitives (owned)
│   │   ├── Button/
│   │   ├── IconButton/
│   │   ├── landing/             # LP + SiteHeader/SiteFooter
│   │   └── ui/                  # Magic UI / shadcn primitives
│   ├── content/
│   │   └── docs/                # synced markdown (gitignored)
│   ├── content.config.ts        # docs collection schema
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── DocsLayout.astro
│   ├── lib/utils.ts             # cn() helper
│   ├── pages/
│   │   ├── index.astro          # /
│   │   └── docs/
│   │       ├── index.astro      # /docs
│   │       └── [...slug].astro  # /docs/<any>
│   ├── styles/global.css
│   └── theme.css                # design tokens (brand, neutral, text sizes)
├── public/                       # static assets (logos, favicons, /docs-assets)
└── astro.config.mjs
```

## Docs pipeline

The website is decoupled from the docs source. The markdown lives in [apache/magpie/docs](https://github.com/apache/magpie/tree/main/docs); this repo fetches it at build time and renders it through Astro content collections.

```
apache/magpie/docs/*.md
        │
        ▼  scripts/sync-docs.sh (sparse clone)
src/content/docs/*.md
        │
        ▼  Astro content collection
dist/docs/**/*.html   (one static page per markdown file)
```

Image references inside markdown (`../../images/foo.png`) are rewritten to `/docs-assets/foo.png` during sync so they resolve against `public/docs-assets/`.

## CI

GitHub Actions workflow `.github/workflows/build.yml` runs on every push and PR to `main`:

1. Install dependencies
2. Sync docs from the source repo
3. `astro check` (warn-only)
4. `astro build`
5. On `main`: copy `.asf.yaml` into `dist/` and force-push the build to the `publish` branch

## Deployment

The site is published by **ASF infrastructure**, not GitHub Pages. On every push to `main`, CI builds the static site and force-pushes `dist/` (an orphan, single-commit history) to the **`publish`** branch. The root [`.asf.yaml`](./.asf.yaml) — carried into that branch — tells ASF infra to serve it:

```yaml
publish:
  whoami: publish
  hostname: magpie.apache.org
```

Production URL: **[magpie.apache.org](https://magpie.apache.org/)** (served at the apex root).

The site is built with `base: '/'` so all links and assets resolve against the apex domain. Set `SITE_BASE` / `SITE_URL` to preview under a subpath (e.g. GitHub Pages).

> One-time infra setup (outside this repo): the `magpie.apache.org` hostname and its TLS must be registered with ASF Infra, and the `publish` branch created on first CI run.

## License

[Apache License 2.0](./LICENSE).
