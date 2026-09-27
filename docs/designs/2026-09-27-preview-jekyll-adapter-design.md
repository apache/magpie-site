# PR previews for Jekyll sites

**Status:** implemented · **Date:** 2026-09-27

## Goal

The PR-preview system (`scripts/preview/`) was built for this Astro site, but
most ASF project sites are Jekyll. Make previews — including the overlay's
file-and-line lookup — work for a Jekyll site, without changing how this site
behaves.

The preview system is due to move to its own repository, so it stays here for
now, and the generator-specific parts are kept in separable directories so that
move is a file move.

## What was already generic

Almost all of it. The publisher consumes a built directory plus
`preview-meta.json` and never builds anything; validation, reaping, diff
anchors and the overlay do not care which generator produced the HTML. Two
things were Astro-specific, and two were hardcoded to this site:

- **Source annotation** — `data-magpie-src` came from a Babel plugin, so only
  `.tsx`/`.jsx` was covered.
- **The build commands** in `build.yml`.
- **The staging hostname label** `magpie`, and **the build workflow name**
  `build.yml` the publisher looks up artifacts from.

## Design

**Adapters.** `scripts/preview/adapters/<generator>/` holds the one piece
that differs per generator. The Babel plugin moved to `adapters/astro/`
unchanged. `adapters/jekyll/` is new.

**The contract** between a site's build and the publisher is now written down
in `scripts/preview/README.md`: a `preview-site` artifact, `preview-meta.json`,
and optional `data-magpie-src` attributes. Optional matters — an element
without one falls back to the Conversation tab, which is already how `.astro`
templates behave here.

**Settings.** `PREVIEW_SITE_NAME` and `PREVIEW_BUILD_WORKFLOW` replace the two
hardcoded values, defaulting to them. Both reach a hostname, YAML or an API
path, so both are validated to a strict character set, for the same reason the
PR number is.

**The Jekyll plugin** (`magpie_src.rb`) stamps from two sources:

- *Markdown.* kramdown records a source line on every block element. The plugin
  adds the front-matter length and stamps blocks while Jekyll converts a
  document's own content — tracked around `Jekyll::Renderer#convert`, so
  `markdownify` inside a layout is not mis-stamped with the page's path.
  kramdown calls `convert` only on the root element and dispatches children
  directly, so the tree is stamped once, from the root.
- *Layouts and includes.* Opening HTML tags in the raw template are stamped
  before Liquid parses it: layouts after the site is read, includes as they
  are loaded (`Jekyll::Inclusion#content` for `include`, which Jekyll 4 renders
  through `OptimizedIncludeTag`; `IncludeTag#read_file` for
  `include_relative`). Liquid spans, raw/comment/highlight blocks, scripts,
  styles and HTML comments pass through untouched.

It is installed by `prepare.sh`, which copies it into `_plugins/` for the
preview build only — no Gemfile change, and the production build never loads
it. `prepare.sh` refuses `safe: true` (the `github-pages` gem), where
`_plugins` is ignored and the build would silently stamp nothing.

## Known limits

- A Liquid tag in a Markdown page that expands to several lines shifts the
  line numbers of later blocks on that page. The path stays correct and the
  screenshot caption names it. Fixing it means mapping lines through Liquid
  rendering, which Jekyll does not expose.
- Sites that must build in safe mode cannot use the adapter.

## Alternatives considered

- **Extract the preview system into `apache/magpie`** as a reusable workflow
  plus a packaging action. Rejected for now: the system is moving to a
  different repository.
- **Inject kramdown IAL markers into the Markdown source** before rendering.
  Exact through Liquid, but it changes Markdown semantics around lists, code
  fences and tables — too easy to break the page being reviewed.

## Testing

`adapters/jekyll/test/` builds a fixture site with the plugin loaded and
asserts stamped `path:line` values for Markdown, a layout and an include, plus
what must stay untouched. CI runs it in the `jekyll-adapter` job, in a
digest-pinned `ruby:3.3` container, so no new third-party action is needed,
installing from a checksummed `Gemfile.lock` with `BUNDLE_FROZEN`.
Verified locally against Jekyll 4.4.1 and 4.3.4.
