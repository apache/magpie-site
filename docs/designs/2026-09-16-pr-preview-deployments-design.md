# Per-PR preview deployments — design

Every open pull request against `apache/magpie-site` can be published as a live
site at `magpie-pr<N>.staged.apache.org`, so a reviewer can look at a change
instead of imagining it from a diff.

Previews are opt-in per PR: a maintainer adds the `preview` label — directly, or
by commenting `/show-preview` — and from then on the PR's preview tracks its
head commit until the PR closes or the label is removed. An event-driven
workflow does the publishing; nothing privileged ever runs pull-request code.

> **Revised 2026-09-28.** The original design armed PRs by comment and
> published from a 15-minute schedule. Both changed: the `preview` label is now
> the armed state, and the schedule is gone in favour of `workflow_run` and
> `issue_comment` triggers used purely as signals. The sections below are
> updated in place; "Why polling rather than events" records the reasoning.

A preview is also reviewable in place: a reviewer can point at any element on the
rendered page and write a comment against it, and land that comment on the source
line it came from. That half is specified in [Reviewing in place](#reviewing-in-place).

## What was verified

The ASF publishing framework was probed directly on 2026-09-16 before this
design was written, because the documentation describes staging in terms of
Pelican autobuild and this site is built by Astro in GitHub Actions.

A scratch branch `preview/pr0-staging` was pushed to `apache/magpie-site`
carrying two files — a hand-written `index.html` and an `.asf.yaml` of:

```yaml
staging:
  profile: pr0
  whoami: preview/pr0-staging
```

It was served at `https://magpie-pr0.staged.apache.org/` within about three
minutes of the push, then the branch was deleted. This establishes four things
the design depends on:

- An **arbitrary branch** can stage. The branch does not need to be `asf-staging`
  or match any naming convention beyond its own `whoami`.
- **Prebuilt output works.** No Pelican, no `autobuild`, no `autostage`. The
  branch content is served as-is, exactly as the existing `publish` branch is.
- **An explicit `profile:` yields `$project-<profile>.staged.apache.org`**, so
  the profile is ours to choose per PR.
- **Propagation is a few minutes**, not seconds. Previews are not instant and
  the UX must say so.

`magpie.staged.apache.org` (the profile-less host) returns 404, confirming
profiles are independent of one another.

**Deleting the branch does not unstage the site.** After `preview/pr0-staging`
was deleted, `magpie-pr0.staged.apache.org` continued to serve the probe page
with HTTP 200 ten minutes later. Staging is push-driven: content is copied out
when a branch is pushed, and removing the branch removes the source, not the
copy. This is the single most consequential finding here, because "delete the
preview when the PR closes" cannot be implemented by deleting a branch. The reap
step is designed around it below.

## Constraints

**`pull_request_target` is not used.** Not discouraged — excluded, and GitHub
is restricting it further. Everything privileged runs the default branch's copy
of the workflow and its scripts, and can never be influenced by a pull
request's contents. The privileged workflow is triggered only by
`workflow_run`, `issue_comment` and `workflow_dispatch`, all of which always
run the default branch's copy of themselves, under these rules:

- no job sets `actions/checkout`'s `ref`, so it checks out the default branch;
  no step reads, builds or executes anything from the pull request's tree;
- nothing from the triggering event reaches a step. The triggering run's event
  type and the comment body are read in the job's `if:` expression only, as a
  cheap filter, never in a shell;
- the site content arrives only through the unprivileged build's artifact,
  screened exactly as it always was;
- no trigger arms a preview by itself. Every run re-derives the armed state
  from the API, as described under "Resolve the armed set".

**What the publisher may learn about a pull request** is fixed, and enforced
in code rather than by convention. Every GitHub response passes through a
projection in `scripts/preview/github.mjs` before any other code sees it, so
the fields below are all that exists as far as the publisher is concerned:

| Field | Why |
|---|---|
| PR number | Identifies the PR and its preview |
| Label names | The arming state |
| Head SHA (40-hex) | Binds the build artifact to the PR's current head |
| Author login and type | Skips the explainer on bot-authored PRs |
| Comment id, author and type | Finds arming commands and the publisher's own markers |
| Comment body — **only** when it is exactly `/show-preview`, or bot-authored | The command itself; human discussion is dropped |
| Actor of the last `labeled` event | Who armed it, for the write-access check |
| The build's artifact | The site being previewed — screened, never executed |

Never the PR's code, diff, title, description, branch name or commit
messages. Workflow-run objects are reduced to their id, because they carry the
PR's branch name, title and head commit message. The diff is needed only for
the review overlay's anchors, so the unprivileged build computes the anchor
manifest (`write-meta.mjs`) and ships it in `preview-meta.json`; the publisher
sanitises it and recomputes every anchor from its path.

`scripts/preview/boundary.test.mjs` checks all of this deterministically on
every pull request: it parses the workflows (no `pull_request_target`, no
checkout `ref` or `repository`, no event data in any step, a fixed set of
`github.*` contexts), runs the whole publisher against GitHub responses whose
every forbidden field carries a marker string and fails if the marker reaches
the publisher or anything it writes, and fails on any API endpoint outside a
fixed allowlist.

**`pr<N>.dev.magpie.apache.org` is not available.** asfyaml refuses to let a
project name its own `$project.apache.org` space ("It has to be inferred to
prevent abuse"), and there is no wildcard-subdomain mechanism. A `dev.` zone
with wildcard DNS would be a separate INFRA request for unreviewed third-party
content, which `staged.apache.org` already exists to serve. The hostname is
therefore `magpie-pr<N>.staged.apache.org`.

**New workflows must satisfy the ASF allowlist.** `asf-allowlist-check.yml`
runs `apache/infrastructure-actions/allowlist-check` on any change under
`.github/**`. Every action must be allowlisted and pinned to a full commit SHA.
`zizmor` also runs in pre-commit and will reject the usual workflow smells.

**The commits list sees the traffic.** `.asf.yaml` routes commit mail to
`commits@magpie.apache.org`, so each preview branch create, update and delete
is a mail. Publishing on every push to an armed PR is deliberate; the noise is
the accepted cost.

## Architecture

Two workflows, one of them already exists.

### `build.yml` — unprivileged, unchanged in spirit

Already runs `npm ci` and `npm run build` on every `pull_request`. It gains two
things: the build runs with `MAGPIE_PREVIEW_ANNOTATE=1` so elements carry their
source location, and `dist/` is uploaded together with a small
`preview-meta.json` recording the PR number and the head SHA it was built from.

This job runs the pull request's code — `npm ci` alone executes install scripts
— so it holds nothing worth stealing. Fork-triggered `pull_request` runs already
receive a read-only token; the job additionally declares `permissions: {}` and
checks out with `persist-credentials: false`, so the property is explicit rather
than incidental.

No preview logic lives here. The build does not know whether a preview will be
published, and a pull request cannot cause one by editing this file — the
privileged side re-reads the workflow from the default branch.

### `preview-publish.yml` — privileged, event-driven

Triggered by:

- `workflow_run` on completion of **`build.yml`** — the moment a pull
  request's build finishes, so a push to an armed PR publishes with no waiting
  or polling — and of **`preview-signal.yml`**, a no-op `pull_request` workflow
  with no permissions that exists only to be completed on the PR events that
  start no build (`labeled`, `unlabeled`, `closed`, plus `opened` and
  `reopened` so the explainer does not wait for a build). Runs triggered by a
  build of `main` are filtered out;
- `issue_comment` on any pull-request comment, so a `/show-preview` command
  publishes immediately when the build is already green. The workflow does not
  inspect the comment; the publisher finds commands through the API;
- `workflow_dispatch` with an optional `pr` input naming a single PR number.

One `publish` job. Permissions: `contents: write` (push and delete preview
branches), `pull-requests: write` and `issues: write` (comment, label, react),
`actions: read` (download artifacts). Concurrency group `preview-publish` with
`cancel-in-progress: false`, so two runs never race on the same branches.

Every publish run is a full reconcile of all open PRs and preview branches, not
just the one whose event triggered it. That is what makes the event-driven
design safe: GitHub keeps at most one pending run per concurrency group and
drops the rest, and a dropped run's work is done by whichever run follows.

One run does four things, in order:

**1. Announce.** For each open PR with no explainer comment yet, post one. The
comment states that a maintainer can publish a preview with the `preview` label
or `/show-preview`. It deliberately carries no URL: an unarmed PR has no
preview, and a link that does not resolve is worse than none. The URL is posted
once the preview is published. It carries a stable HTML marker comment so the next run recognises it and does
not post twice.

**2. Resolve the armed set.** A PR is *armed* when it carries the `preview`
label and whoever **last added** that label has write access to the
repository, read from the PR's `labeled` events. The label alone is not enough:
on an ASF repository, collaborators with the triage role can add labels without
being committers. The publisher's own login (`github-actions[bot]`) is trusted,
because it adds the label only on a maintainer's behalf; no other bot is.
Permission is resolved through
`GET /repos/{owner}/{repo}/collaborators/{username}/permission` rather than
`author_association`, which is a weaker signal.

A `/show-preview` comment is a way of adding the label. Before resolving, the
run looks for comments whose body matches `^/show-preview\s*$` anchored — not a
substring search, so quoting the command while discussing it does not arm
anything — from an author with write access, which the publisher has not yet
acknowledged. For those it adds the label and then acknowledges each comment
with a 🚀 reaction. The acknowledgement is what keeps the label the single
source of truth: without it, a maintainer removing the label would see the old
comment re-add it on the next run.

A PR is *disarmed* by removing the label; the `unlabeled` event triggers a run,
which tears the preview down.

**3. Publish.** For each armed PR, first ask whether anything has changed.

A preview branch's head commit subject records what it was built from —
`Publish preview for #180 (14fdc13)` — so the publisher already knows the
published commit from the same read that detects tombstones. If it equals the
PR's current head, the run does nothing for that PR: no artifact download, no
push, no comment. Republishing regardless force-pushes an identical tree on
every run, which costs a `commits@` mail and a rewritten status comment
for a preview nobody touched. A manual dispatch skips this check, because asking
for a preview explicitly is a request to rebuild it.

A tombstoned branch's subject carries no SHA, so a re-armed pull request
publishes rather than being mistaken for up to date.

Otherwise, find the most recent successful `build.yml` run for that PR's current
head SHA and download its artifact. Then:

- Validate `preview-meta.json`. The PR number must be digits only. The head SHA
  in the artifact must equal the head SHA the API reports for that PR. Without
  this check a fork could claim another PR's number and publish content under
  it; with it, the artifact can only ever land on the PR it was built from.
- Reject the artifact if any entry is a symlink or escapes the extraction root.
- Generate `.asf.yaml` **here**, from this workflow, never from the artifact:
  `profile: pr<N>`, `whoami: preview/pr<N>-staging`.
- Add `robots.txt` with `Disallow: /`, so previews never compete with
  `magpie.apache.org` in search results.
- Inject the reviewing overlay: write `_preview/review.js` with the anchor
  manifest (computed by the unprivileged build from the PR diff, sanitised
  here), and add the one-line
  `<script>` tag to each HTML file. Injecting here rather than in the build is
  what keeps the tool outside the pull request's reach.
- Force-push the result to `preview/pr<N>-staging`.
- Upsert a single status comment on the PR — edited in place, not appended —
  carrying the preview URL and the SHA it was built from.

If an armed PR has no successful build artifact for its head SHA, the run says
so in the status comment and moves on. It never falls back to building the code
itself; that would put pull-request code in the privileged context and is the
thing this design exists to avoid.

**4. Reap.** Enumerate `preview/*` branches and select those whose PR is closed
or merged, or no longer armed. Because deleting a branch leaves the staged copy
untouched, teardown is a two-step **tombstone then delete**:

- Force-push a tombstone to `preview/pr<N>-staging` — a single `index.html`
  saying the preview has been retired and linking to the pull request, the same
  generated `.asf.yaml`, and `robots.txt` with `Disallow: /`. This overwrites the
  staged copy, which is the only way to stop serving the old content.
- Once that push has propagated, delete the branch. The hostname keeps resolving
  and keeps serving the tombstone; what matters is that the pull request's code
  is no longer published.

Reaping runs on every run, including runs dispatched for a single PR; closing
a PR or removing its label triggers one, so its content is replaced within
minutes. A run that tombstones a branch does not delete it in the same run —
deletion waits for the next run, triggered by any later event on any PR, so a
propagation delay can never strand live PR content behind a deleted branch.

The same step also deletes the **head branches** that pull requests were opened
from inside this repository, once every pull request from that branch has
closed or merged. It is guarded against deleting anything someone may still
want: protected branches, `main`, `publish`, `preview/*` and `asf-*` are never
touched; a branch no pull request was ever opened from is left alone; and a
branch whose tip has moved past the closed pull request's head commit — someone
pushed to it again — is kept. These branches carry no staged site, so they are
deleted directly with no tombstone.

### Manual publishing

`workflow_dispatch` with `pr: <N>` publishes that PR immediately, skipping the
armed check — a maintainer dispatching the workflow by hand *is* the
authorisation, since dispatch requires write access. It covers a republish
after a failed run, and a dispatch with no `pr` reconciles every PR, which is
the retry path now that there is no schedule.

A dispatch also **arms** the PR by adding the `preview` label, and posts a
comment naming the dispatching user. Without the label the next run would find
the PR unarmed and immediately reap the preview a maintainer had just asked for.
One rule holds — *armed means a maintainer put the label there* — with the
label itself, `/show-preview` and manual dispatch as three ways of doing it.

## Reviewing in place

> **Superseded.** This section was never implemented. It is replaced by
> [the preview review overlay design](2026-09-17-preview-review-overlay-design.md),
> which marks a region and produces a screenshot, and lands the comment inline on
> the diff line rather than as a pasted markdown block. It keeps the build-time
> source annotation described below. The reasoning here is kept because the
> constraints it establishes still hold.


Looking at a preview and then describing the problem in words — *"the third card
in the community row, the button under it"* — is the slow part of reviewing a
site change. The preview should let a reviewer point instead.

### The constraint that shapes it

A preview is static files on ASF staging with no backend, and **the page renders
the pull request's own code**. Both halves matter. There is nowhere to run a
receiver, and no credential may ever exist on that page: a token in
`localStorage` — a PAT, an OAuth result, anything — is readable by whatever the
pull request chose to ship. A design where the reviewer authenticates to post
comments directly is a design that hands a maintainer's token to the author of a
hostile PR. So nothing on the preview page ever authenticates, and the comment
reaches GitHub through the reviewer's own browser session.

### Build-time source annotation

A Vite plugin, active only when `MAGPIE_PREVIEW_ANNOTATE=1`, stamps rendered
elements with `data-magpie-src="<repo-relative path>:<line>"`. `build.yml` sets
it for the artifact that feeds previews; the `publish` build never does, so
`magpie.apache.org` is byte-identical to what it is today.

This is the one place previews deliberately differ from production. The
difference is additive — extra attributes, no changed markup or styles — and is
asserted by a check that the published build contains no `data-magpie-src`.

### The overlay

The publisher injects `_preview/review.js` and a one-line `<script>` tag into
each HTML file after downloading the artifact, rather than the build including
it. That keeps the reviewing tool out of the pull request's reach: a PR cannot
edit, disable or impersonate it by changing its own source. The script holds no
secrets, so running in the same origin as untrusted code costs nothing.

It is off until asked for — a floating button, or `c` — because a review tool
that overlays the thing being reviewed is worse than useless. When armed:

- Hovering outlines the nearest ancestor carrying `data-magpie-src`; clicking
  selects it. A text selection resolves the same way, from its anchor node.
- A composer opens showing the resolved `file:line` and the selected text, with
  a textarea for the comment.
- Escape exits; the picker is keyboard-navigable, since a reviewer checking
  keyboard access should not have to leave the tool to do it.

### What it produces

On submit the overlay composes one markdown block, copies it with
`navigator.clipboard.writeText` (a secure context and a user gesture, both
satisfied), and opens the PR at the matching location:

```markdown
**Preview feedback** — `src/components/landing/SiteFooter.tsx:72`

> Discord

The invite should open in a new tab like the other footer links.

<sub>from magpie-pr176.staged.apache.org @ 834cad5</sub>
```

The reviewer pastes and submits. One paste per comment is the price of never
holding a credential, and it keeps the comment attributable to the reviewer
rather than to a bot speaking for them.

### Landing it in the right place

The unprivileged build lists the PR's changed files and writes the anchor
manifest into `preview-meta.json`: for each changed file, its diff anchor and
the line ranges the diff actually touches. The publisher never reads the diff
itself; it sanitises the manifest and recomputes each anchor from its path.

- **Source line inside the diff** → open the Files tab anchored at that line, so
  the paste target is the inline comment box on the very line the element came
  from.
- **Source line outside the diff** (an unchanged component rendering changed
  content) → open the Conversation tab. The pasted block still names `file:line`,
  so the comment is precise even where GitHub has no line to anchor to.

The anchor format GitHub uses for diff lines is not contractual and has changed
before. `anchors.json` is generated in one place for exactly this reason: if the
format moves, one function changes. **To verify before implementation:** the
current anchor shape, against a real PR on this repository.

### Failure handling

| Situation | Behaviour |
|---|---|
| Element has no annotated ancestor | Falls back to the page URL plus a CSS path; the comment is still useful, just less precise |
| Clipboard write refused | Composer keeps the block on screen and selected, with a "copy failed — select and copy" note |
| `anchors.json` missing or stale | Overlay degrades to opening the Conversation tab |
| Reviewer has no GitHub session | GitHub's own sign-in handles it; the clipboard already holds the comment |

## Why polling rather than events

`issue_comment` would arm a PR the moment the comment lands, and `workflow_run`
would publish the moment a build finishes. Both were considered and dropped in
favour of one scheduled workflow, because a single privileged entry point is
easier to reason about than three, and because the scheduled run must exist
anyway to reap closed PRs. `workflow_dispatch` covers the impatient case.

In practice the latency was worse than the cron suggested: GitHub delays
scheduled runs well past their interval, and a pull-request build takes up to
half an hour, so a push to an armed PR could take 40 minutes to reach its
preview, and the publish only edited the status comment, which notifies nobody.

So on 2026-09-28 the schedule was replaced by events. `workflow_run` and
`issue_comment` are admitted strictly as signals (see Constraints) — the
original objection to them was the number of privileged entry points, and the
single `publish` job keeps that at one. The full-reconcile run keeps it simple
to reason about: any event on any PR converges every preview. What the
schedule used to do now happens on:

| Was done by the schedule | Now triggered by |
|---|---|
| Publish after a push to an armed PR | `build.yml` completing (`workflow_run`) |
| Publish after arming | `/show-preview` (`issue_comment`), or `labeled` via `preview-signal.yml` |
| Explainer comment | `opened` via `preview-signal.yml` |
| Retire a closed or disarmed PR's preview | `closed` or `unlabeled` via `preview-signal.yml` |
| Delete tombstoned and stale head branches | Any later run |

A short-lived intermediate version used `pull_request_target` with a job that
polled for the build; it was replaced the same day, because `workflow_run`
fires exactly when the build ends and `pull_request_target` is being
restricted.

Every preview comment leads with the preview URL on its own line.
Each successful publish also posts a new comment naming the commit and URL,
besides editing the status comment, so everyone following the PR is notified.

## Failure handling

| Situation | Behaviour |
|---|---|
| No successful build for head SHA | Status comment says the preview is waiting on a green build; no branch is touched |
| Artifact expired | Terminal until the PR is pushed to again — the publisher never rebuilds. Status comment asks for a rebuild; artifact retention is set long enough that this only reaches dormant PRs |
| Artifact fails validation | Publish is skipped and the run logs why; the branch is left as it was |
| Force-push to a preview branch fails | Run fails loudly; the next event on any PR, or a dispatch, retries |
| Build still running when the PR is armed | Status comment says it is waiting; the build's completion triggers the publish |
| PR closed mid-run | Next run tombstones the preview; the run after deletes the branch |
| Two runs overlap | Prevented by the concurrency group |
| Nothing changed since the last publish | The run does nothing for that PR — no push, no comment, no `commits@` mail |

## Testing

The validation logic — metadata checks, comment matching, armed-set resolution —
goes in a script under `scripts/` with unit tests, not inline in YAML, so it can
be tested without pushing workflows. Reading the published commit out of a
branch's head subject is one of those pure functions, and the test that an
unchanged preview is left alone fails if the check is removed. Test-driven: the anchored comment match, the
digits-only PR number, and the SHA-equality check each get a failing test first.

The reviewing overlay has two testable seams, both pure functions: composing the
markdown block from a selection, and resolving a `file:line` against
`anchors.json` to a URL. Both get unit tests, including the outside-the-diff
fallback. A build check asserts that a production build contains no
`data-magpie-src` — the one regression that would leak preview-only markup to
`magpie.apache.org`.

End-to-end verification uses a throwaway PR against the repository: comment
`/show-preview`, confirm the branch appears and the URL serves within a few
minutes, push a commit and confirm the preview follows it, then close the PR and
confirm the URL serves the tombstone rather than the PR's content. Asserting the
tombstone — not a 404 — is the point: the branch goes away, the hostname does
not.

## Open questions

**Can a staging profile be removed entirely?** Tombstoning stops the PR's
content from being served, but `magpie-pr<N>.staged.apache.org` keeps resolving
and keeps serving the tombstone, apparently forever. Whether INFRA can purge a
profile, and whether an accumulating set of tombstoned hostnames is acceptable
to them, is a question for `users@infra.apache.org`. It does not block the
implementation — a tombstone is correct behaviour regardless — but it decides
whether the reap step is the end of the story or the start of a cleanup ticket.

**Is there a limit on staging profiles?** The documentation does not say. If
many PRs are armed at once this could meet an undocumented ceiling or simply be
impolite to shared infrastructure. Worth asking INFRA if armed PRs routinely
exceed a handful.

**Arming is per-PR, not per-commit.** Once armed, later commits publish without
further review — that is the sticky behaviour chosen deliberately, but it means
arming a PR is a statement of trust in its author, not in a diff. The label
(2026-09-28) makes that trust visible on the PR and revocable by removing it.
