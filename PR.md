# feat(site): agent discoverability — llms.txt, Markdown twins, sitemap, 404, structured data

Ports apache/iggy-website #77 and #79 to the Astro site. Nothing visible to a
person changes; every addition is a file agents read or a header they see.

## What the scan found (is-agentic, 59/100, 5 Sep)

- unknown paths answer 200 with the app shell (critical)
- the scanner reported Accept negotiation without `Vary: Accept`; unverified, see below
- no `llms.txt`; developer resources not discoverable by name
- phantom "API" surface: the scanner inferred an HTTP API and marked it blocked

## Files

| Path | Does |
|---|---|
| `public/.htaccess` | `ErrorDocument 404 /404.html`; `text/markdown` type on `.md` and the llms files |
| `public/robots.txt` | allow all, points at the sitemap |
| `src/lib/site.ts` | site constants, static route list, docs → markdown helpers |
| `src/pages/llms.txt.ts` | llmstxt.org index from the docs collection; says plainly there is no API on this domain |
| `src/pages/llms-full.txt.ts` | every docs page concatenated |
| `src/pages/docs/[...slug].md.ts` | Markdown twin of every docs page, same path with `.md` |
| `src/components/JsonLd.astro` | Organization / WebSite / SoftwareSourceCode JSON-LD, `rel=alternate` to the twin, `rel=llms-txt` |
| `src/pages/404.astro` | recovery links |

## Wiring (needs the checkout)

1. `npm install` (branch 1 adds `@astrojs/sitemap` to package.json and wires
   it in astro.config.mjs; commit the regenerated lockfile on that branch).
2. Collection is `docs`, slug is `entry.id`, hidden pages come from
   `HIDDEN_DOCS` in `src/lib/site.ts` (now shared with `[...slug].astro`).
3. `docSourceUrl` derives the upstream path from `entry.filePath` the same
   way the page's edit link does.
4. Add `<JsonLd markdownPath={...} />` to the base layout `<head>`; on docs
   pages pass `docMarkdownPath(entry)`, elsewhere omit it.
5. If a 404 page already exists, merge the link list into it and delete mine.
6. No workflow change: Astro copies `public/` into `dist/`, and build.yml
   pushes `dist/` to `publish`. Confirm `.htaccess` is in `dist/` after a build.
7. **Check the catch-all.** The scan got a 200 for `/apache/magpie`. Search
   `.htaccess`, `.asf.yaml` and the workflow for `RewriteRule`, `FallbackResource`
   or a copy of `index.html` to `404.html`; whichever is producing the 200 has to
   go, or `ErrorDocument` never fires.

## Verify after `npm run build` (or on staging)

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://magpie.apache.org/no-such-page      # 404
curl -sI https://magpie.apache.org/docs/modes.md | grep -i '^content-type'            # text/markdown
curl -sI -H "Accept: text/markdown" https://magpie.apache.org/docs/modes/ | grep -i '^content-type'  # see note
curl -s https://magpie.apache.org/llms.txt | head -20
curl -s https://magpie.apache.org/docs/modes/ | grep -o '<link rel="alternate"[^>]*>'
grep -c '"@type":"SoftwareSourceCode"' dist/index.html                                # 1
```

Then rescan: `npx is-agentic magpie.apache.org`.

## Deliberately not done

- No Accept-header negotiation, same as Iggy: a static export on ASF
  infrastructure has no server-side control worth relying on, and the `.md`
  sibling needs none. If the curl above already returns text/markdown, the
  server is negotiating on its own (MultiViews); then, and only then, add
  `Header merge Vary "Accept"` to `.htaccess` so caches key the variants apart.

- No OpenAPI spec and no JSON error bodies: there is no API. `llms.txt` states
  that, which is what removes the scanner's phantom API surface.
- No ASF postal address in the JSON-LD (dropped from Iggy for the same reason).
