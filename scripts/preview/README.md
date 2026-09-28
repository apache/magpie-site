# PR previews

Publishes an armed pull request's built site to
`https://<site>-pr<N>.staged.apache.org/`, with a review overlay that turns a
marked region into a screenshot and a link to the matching diff line. The
design is in
[`docs/designs/2026-09-16-pr-preview-deployments-design.md`](../../docs/designs/2026-09-16-pr-preview-deployments-design.md)
and
[`docs/designs/2026-09-17-preview-review-overlay-design.md`](../../docs/designs/2026-09-17-preview-review-overlay-design.md).

Everything in this directory except `adapters/` is independent of the site
generator. An adapter is the one generator-specific piece: it makes a preview
build say which source line each element came from.

| Path | What it is |
|---|---|
| `publish.mjs` and its modules | The privileged publisher run by `preview-publish.yml` |
| `overlay/` | The review overlay injected into every published page |
| `adapters/astro/` | Babel plugin stamping JSX, used by this site |
| `adapters/jekyll/` | Jekyll plugin stamping Markdown, layouts and includes |

## The build contract

The publisher never builds anything. It consumes an artifact that the
unprivileged pull-request build produced, and this is all it expects of it:

1. **An artifact named `preview-site`**, uploaded by a successful run of the
   build workflow for the pull request's head commit, holding the built static
   site. Upload with `include-hidden-files: true` if the site has dotfiles.
2. **`preview-meta.json` at its root**:
   `{"pr": <number>, "headSha": "<40-hex head commit>", "anchors": {...}}`. The
   publisher checks `pr` and `headSha` against the pull request and refuses a
   mismatch. `anchors` is optional — `write-meta.mjs` produces it from the PR's
   changed files — and is sanitised before use.
3. **Optionally, `data-magpie-src="<repo-relative path>:<line>"`** on rendered
   elements. The overlay walks up from the marked region to the nearest stamped
   element and, when that line is in the diff, opens the Files tab on it. An
   element without one falls back to the Conversation tab, so an adapter that
   covers only some sources is still useful.

The attribute is for preview builds only. Build production without the
adapter and fail the build if `data-magpie-src` appears in it — see the
assertion step in `.github/workflows/build.yml`.

## Arming and triggers

A pull request is armed by the `preview` label, added by someone with write
access — directly, by commenting `/show-preview` (the publisher adds the label
and reacts 🚀), or by dispatching the workflow for that PR. Removing the label
retires the preview.

`preview-publish.yml` has no schedule and does not use `pull_request_target`.
It runs on `workflow_run` when `build.yml` completes — so a push to an armed PR
publishes the moment its build ends — and when `preview-signal.yml` completes,
a no-op `pull_request` workflow that exists only to signal label changes,
opens and closes. It also runs on any PR comment (`issue_comment`, so a
`/show-preview` publishes at once) and on manual dispatch. Every run checks out
the default branch only, takes nothing from the event, and reconciles every
open PR and preview branch.

What the publisher may learn about a PR is fixed by the projections in
`github.mjs`: number, label names, head SHA, author login/type, and a comment's
body only when it is exactly `/show-preview` or bot-authored — never code,
diff, title, description, branch name or commit messages. The diff-derived
anchor manifest is computed by the build (`write-meta.mjs`) and sanitised by
the publisher. `boundary.test.mjs` enforces the workflows, the projections and
the endpoint allowlist deterministically. Every
publish posts a new comment on the PR, and every preview comment leads with the
preview URL.

## Settings for another site

All default to this site's values.

| Variable | Default | Meaning |
|---|---|---|
| `PREVIEW_SITE_NAME` | `magpie` | First label of the staging hostname. ASF staging derives it from the repository, so it must match what infra serves. |
| `PREVIEW_BUILD_WORKFLOW` | `build.yml` | File name of the workflow whose runs carry the `preview-site` artifact |
| `PREVIEW_LABEL` | `preview` | The arming label |

Set them in the `env:` of the publish step in `preview-publish.yml`.
