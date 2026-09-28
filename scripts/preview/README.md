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
   `{"pr": <number>, "headSha": "<40-hex head commit>"}`. The publisher checks
   both against the pull request and refuses a mismatch.
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

`preview-publish.yml` has no schedule. `pull_request_target` and
`issue_comment` are used as signals only: both jobs check out the default
branch, and only the PR number reaches a step. `await-build.mjs` waits for the
unprivileged build of the PR's head commit, then `publish.mjs` reconciles every
open PR and preview branch. Every publish posts a new comment on the PR with
the commit and URL, besides updating the sticky status comment, because an edit
notifies nobody.

## Settings for another site

All default to this site's values.

| Variable | Default | Meaning |
|---|---|---|
| `PREVIEW_SITE_NAME` | `magpie` | First label of the staging hostname. ASF staging derives it from the repository, so it must match what infra serves. |
| `PREVIEW_BUILD_WORKFLOW` | `build.yml` | File name of the workflow whose runs carry the `preview-site` artifact |
| `PREVIEW_LABEL` | `preview` | The arming label. The workflow's `if:` expressions name it literally too — change both. |

Set them in the `env:` of the publish step in `preview-publish.yml`.
