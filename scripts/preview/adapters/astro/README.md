# Astro adapter

Makes an Astro site's preview build stamp `data-magpie-src="<path>:<line>"` on
rendered elements, so the review overlay can take a reviewer from a marked
region to the source line in the pull request's diff. See the
[build contract](../../README.md#the-build-contract) for how this fits the
rest of the preview system.

## What gets stamped

| Source | How | Granularity |
|---|---|---|
| React components (`.tsx`, `.jsx`) | A Vite plugin parses each file with Vite's own parser (`parseSync`, oxc) before the JSX transform, and inserts the attribute into each opening tag | Every host element (lowercase tag name) |

Left alone: component elements (`<Thing />`), whose host elements are stamped
in their own file; member-expression tags (`<motion.div>`); an element that
already carries `data-magpie-src`; files under `node_modules`; and a file that
fails to parse, which passes through unchanged. `.astro` templates and Markdown
are not stamped — that would need the Astro compiler — so content from them
falls back to the Conversation tab.

Paths are relative to the `root` option, the build's working directory by
default.

The plugin uses only Vite, which every Astro site already has. It needs no
Babel and does not depend on `@astrojs/react` options: since `@astrojs/react`
7 (`@vitejs/plugin-react` 6) the React integration no longer runs Babel.

## Wiring it into an Astro site

Copy `vite-plugin-magpie-src.mjs` and list `vite` in `devDependencies` (the
plugin imports it directly). Enable it only when the build asks for
annotation:

```js
// astro.config.mjs
import magpieSrc from './scripts/preview/adapters/astro/vite-plugin-magpie-src.mjs';

export default defineConfig({
  vite: {
    plugins: [process.env.MAGPIE_PREVIEW_ANNOTATE === "1" && magpieSrc()],
  },
});
```

In the pull-request build, after the production build:

```yaml
      - name: Assert the production build carries no preview annotation
        run: |
          if grep -rq "data-magpie-src" dist/; then
            echo "::error::data-magpie-src found in a production build"
            exit 1
          fi

      - name: Build the preview site with source annotation
        if: github.event_name == 'pull_request'
        env:
          MAGPIE_PREVIEW_ANNOTATE: "1"
        run: npm run build

      - name: Write preview metadata
        if: github.event_name == 'pull_request'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          OUT: dist/preview-meta.json
        run: node scripts/preview/write-meta.mjs

      - name: Upload preview artifact
        if: github.event_name == 'pull_request'
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: preview-site
          path: dist
          include-hidden-files: true
```

This site's `build.yml` runs exactly these steps, and with
`MAIN_REVIEW_OVERLAY: "true"` also builds main annotated and passes it to
`inject-main.mjs` (see [the overlay on the published
site](../../README.md#the-overlay-on-the-published-site)).

For publishing, carry over `scripts/preview/`, `vendor/html2canvas-pro/` and
`.github/workflows/preview-publish.yml`, and set `PREVIEW_SITE_NAME` and
`PREVIEW_BUILD_WORKFLOW` as described in the
[settings](../../README.md#settings-for-another-site).

## Tests

```sh
node --test scripts/preview/adapters/astro/vite-plugin-magpie-src.test.mjs
```

The test stamps small TSX snippets and checks the inserted attributes and
lines. `npm test` runs it with the rest of `scripts/**/*.test.mjs`.
