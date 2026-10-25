<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

# Contributing

Thanks for helping improve the Apache Magpie website. This repository holds the
public site at [magpie.apache.org](https://magpie.apache.org): an Astro +
React + Tailwind static site. The framework itself, and its documentation,
live in [`apache/magpie`](https://github.com/apache/magpie); see its
[`CONTRIBUTING.md`](https://github.com/apache/magpie/blob/main/CONTRIBUTING.md)
for changes there.

Before sending a patch, please skim this file and [`AGENTS.md`](AGENTS.md).
`AGENTS.md` holds the site conventions every change must respect, and it
applies to human contributors as much as to agents.

## What lives where

Think about **which repository the change belongs in** before you start
editing:

| You want to change … | Edit under … |
|---|---|
| A documentation page under `/docs/**` | **not here** — the Markdown lives in [`apache/magpie/docs`](https://github.com/apache/magpie/tree/main/docs) and is synced at build time |
| A skill or tool listed on the site | **not here** — [`apache/magpie`](https://github.com/apache/magpie); `src/data/tools.json` is generated from it |
| The homepage and its interactive sections | [`src/components/landing/`](src/components/landing/) |
| Routes, layouts, shared header and footer | [`src/pages/`](src/pages/), [`src/layouts/`](src/layouts/), `SiteHeader` / `SiteFooter` |
| Build-time sync and link rewriting | [`scripts/`](scripts/) |
| Quality checks and browser tests | [`scripts/quality/`](scripts/quality/), [`tests/`](tests/) |
| Why the site is shaped the way it is | [`docs/designs/`](docs/designs/) (a design document) |

`src/content/docs/` and `src/data/tools.json` are **generated** and gitignored:
`npm run build` overwrites them, so never edit them by hand.

## Getting set up

You need these tools on your machine:

- **Node.js 22.12 or newer** with `npm`.
- **`prek`** — the `pre-commit`-compatible hook runner.
  `uv tool install prek` or `pipx install prek`.
- **`gh` CLI** — for opening pull requests. `brew install gh` or equivalent.

First-time clone:

```bash
git clone git@github.com:apache/magpie-site.git
cd magpie-site
npm install
prek install --hook-type pre-commit --hook-type pre-push
npm run dev
```

If you already use a global `core.hooksPath`, git ignores this repository's
`.git/hooks/` and plain `prek install` refuses. Install with
`prek install --overwrite --git-dir "$(git rev-parse --git-common-dir)" --hook-type pre-commit --hook-type pre-push`,
then run `npm run hooks:verify` to check that the global hook chains through
to the repository's own.

Always start the dev server with `npm run dev` (not `astro dev` directly) — see
[`AGENTS.md` → Local setup](AGENTS.md#local-setup) for why.

## Agent-assisted contributions

Most contributions here are authored in a conversation with a coding agent.
What the project expects from an AI-assisted contribution — licensing,
disclosure, the `Generated-by:` trailer, and human ownership of the change — is
set out in the framework's
[AI contribution policy](https://github.com/apache/magpie/blob/main/docs/ai-contribution-policy.md),
which follows the
[ASF Generative Tooling Guidance](https://www.apache.org/legal/generative-tooling.html).

**Magpie is adopted here through its plugin marketplace.** Nothing from the
framework is vendored or snapshotted into this repository. The committed
[`.apache-magpie.lock`](.apache-magpie.lock) records the floor — a minimum
Magpie version and the plugins every contributor gets — and the committed
`.claude/settings.json` is derived from it. When you open and trust the
repository in Claude Code, it offers the `apache-magpie` marketplace and the
floor plugins; there is no install step. Install any other family you need for
yourself (for example `/plugin install magpie-repo-health@apache-magpie`),
configure it with `/magpie-setup:setup config`, and check your checkout with
`/magpie-setup:setup verify`. The
[Agent-assisted contribution section of `README.md`](README.md#agent-assisted-contribution-apache-magpie)
has the details.

Configuration splits into two places:

- [`.apache-magpie-overrides/`](.apache-magpie-overrides/) (committed) — the
  project's configuration and any project-wide changes to framework workflows.
- `.apache-magpie-local/` (gitignored) — your personal configuration. It wins
  over the committed files, for your clone only.

Never edit the installed plugins; framework changes go via PR to
[`apache/magpie`](https://github.com/apache/magpie).

If you run agents against this repository, install the framework's
[secure agent setup](https://github.com/apache/magpie/blob/main/docs/setup/secure-agent-setup.md)
(`/magpie-setup:isolated-setup-install`, then
`/magpie-setup:isolated-setup-verify`). The skills read text written by
outsiders; without the sandbox an injected instruction runs with your full
access.

**Lead with intent, then iterate.** Open with *what* you want and *why*, and
let the agent work out *how*. Treat its first proposal as a draft: read the
diff, push back specifically ("this needs a `{" "}` spacer", "use the shared
button variant"), and let it revise. Probe the edges before you call it done —
narrow viewports, keyboard access, reduced motion, an empty docs sync.

**The agent is not the reviewer.** You are responsible for the PR: its scope,
its commit message, its description and its correctness. The checks and the
human reviewer are the verification layer.

## Running the dev loop

During development:

```bash
npm run check:fast     # unused code, style contracts, types, unit tests
```

Before you call UI work done, and before every push:

```bash
npm run check          # check:fast, then fresh-build browser tests and dev-preview tests
```

The hooks run the same gates: `check:fast` on pre-commit and `check` on
pre-push, alongside the hygiene hooks (trailing whitespace, end-of-file,
merge-conflict markers, private keys), `zizmor` for GitHub Actions workflows,
and the Astro/JSX whitespace-collapse check. CI runs them again on every pull
request.

Browser tests must own a fresh build and server. The hero slide progression,
the security walkthrough and the software lifecycle sequence are critical user
flows: check every stage through the real controls, keyboard, resizing and
reduced motion. Inspect screenshots including the surrounding headings and
containers, not only the inner widget. The measurable contracts are in
[`docs/designs/2026-09-26-ui-quality-contract.md`](docs/designs/2026-09-26-ui-quality-contract.md).

To rebuild without re-cloning the docs (already synced), run
`npx astro build` directly.

## Opening a pull request

- **Base branch:** `main`.
- **Scope:** one concern per PR.
- **Commit message:** an imperative subject, referencing the issue where one
  exists (`Keep an early hero choice (#259)`), and a plain-prose body explaining
  *why*. Record agent assistance with a `Generated-by:` trailer naming the agent
  and model (`Generated-by: Claude Code (Opus 4.8)`); do not add
  `Co-Authored-By:` trailers for agents.
- **Open it for human review** with `gh pr create --web`, so you check the
  title, body and disclosure in the browser before submitting.
- **Before you push:** re-read the diff, run `npm run check`, and check that the
  internal and external links you touched still resolve. If you changed shared
  chrome, inspect both the marketing and documentation layouts and their mobile
  states.
- **Previews:** a committer can publish a live preview of the PR by commenting
  `/show-preview`; see
  [`README.md` → Previewing a pull request](README.md#previewing-a-pull-request).

## Your first contribution

Good entry points, in rough order of ramp-up cost:

1. **Pick an [open issue](https://github.com/apache/magpie-site/issues).**
   Leave a comment first so a maintainer can assign it to you — that keeps two
   people from working on the same issue.
2. **Fix what you notice on the live site** — a broken link, a layout glitch at
   a narrow width, an accessibility gap. Reproduce it with a failing check
   first where you can.
3. **Improve the docs** — in
   [`apache/magpie/docs`](https://github.com/apache/magpie/tree/main/docs), not
   here.

If you're not sure where something belongs, open an issue describing what you
want to try and a maintainer will route you.

## Confidentiality

This repository and the site are **public**, and nothing here is confidential.
Never paste real security-report details, tracker URLs, reporter PII or
pre-publication CVE IDs into the site, a fixture or a screenshot — use synthetic
examples, as the security walkthrough does.

## Authoritative references

When this file and a more specific document disagree, the specific one wins:

- [`AGENTS.md`](AGENTS.md) — site conventions, local setup, commit rules.
- [`README.md`](README.md) — structure, docs pipeline, deployment, previews.
- [`docs/designs/`](docs/designs/) — the design behind each part of the site.
- [`apache/magpie` `CONTRIBUTING.md`](https://github.com/apache/magpie/blob/main/CONTRIBUTING.md)
  — for the framework and its documentation.
