# Jekyll adapter

Makes a Jekyll site's preview build stamp `data-magpie-src="<path>:<line>"` on
rendered elements, so the review overlay can take a reviewer from a marked
region to the source line in the pull request's diff. See the
[build contract](../../README.md#the-build-contract) for how this fits the
rest of the preview system.

## What gets stamped

| Source | How | Granularity |
|---|---|---|
| Markdown pages and collection documents | From the source line kramdown records for each block, shifted past the front matter | Headings, paragraphs, list items, blockquotes, tables and rows, code blocks, definition lists, embedded HTML blocks |
| Layouts (`_layouts/`) | Each opening HTML tag of the raw template, before Liquid runs | Every tag outside `html`, `head`, `body`, `meta`, `link`, `script`, `style`, `title`, `base`, `noscript`, `template` |
| Includes (`include`, `include_relative`) | Same as layouts | Same as layouts |

Left alone: Liquid output (`{{ "<b>" }}`), `{% raw %}`, `{% comment %}` and
`{% highlight %}` blocks, `<script>`, `<style>` and HTML comments, Markdown
rendered by `markdownify` inside a layout, and files from a theme gem, which a
pull request cannot change.

Paths are relative to the repository root: the nearest ancestor of the site
source holding `.git`, or `MAGPIE_SRC_ROOT` when set.

**Known limit.** A Liquid tag inside a Markdown page that expands to several
lines shifts the line of every block after it on that page. The file is still
right, and the screenshot's caption names it.

## Wiring it into a Jekyll site's CI

In the pull-request build, after the production build and its check:

```yaml
      - name: Assert the production build carries no preview annotation
        run: |
          if grep -rq "data-magpie-src" _site/; then
            echo "::error::data-magpie-src found in a production build"
            exit 1
          fi

      - name: Build the preview site with source annotation
        if: github.event_name == 'pull_request'
        run: |
          sh scripts/preview/adapters/jekyll/prepare.sh .
          bundle exec jekyll build

      - name: Write preview metadata
        if: github.event_name == 'pull_request'
        env:
          PR_NUMBER: ${{ github.event.pull_request.number }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          printf '{"pr":%s,"headSha":"%s"}\n' "$PR_NUMBER" "$HEAD_SHA" > _site/preview-meta.json

      - name: Upload preview artifact
        if: github.event_name == 'pull_request'
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: preview-site
          path: _site
          include-hidden-files: true
```

`prepare.sh <site source>` copies `magpie_src.rb` into the site's plugins
directory (`plugins_dir`, default `_plugins`). Run it only in CI, or delete the
copied file afterwards: anything built while it is there is annotated. It
refuses a site with `safe: true` — which the `github-pages` gem forces —
because safe mode ignores `_plugins` and the build would silently stamp
nothing.

For publishing, carry over `scripts/preview/`, `vendor/html2canvas-pro/` and
`.github/workflows/preview-publish.yml`, and set `PREVIEW_SITE_NAME` and
`PREVIEW_BUILD_WORKFLOW` as described in the
[settings](../../README.md#settings-for-another-site).

## Tests

```sh
export BUNDLE_GEMFILE=scripts/preview/adapters/jekyll/test/Gemfile
bundle install
bundle exec ruby scripts/preview/adapters/jekyll/test/magpie_src_test.rb
```

The test builds `test/fixture/` with the plugin loaded and checks the stamped
lines. CI runs it in the `jekyll-adapter` job of `build.yml`. Verified against
Jekyll 4.4.1 and 4.3.4.
