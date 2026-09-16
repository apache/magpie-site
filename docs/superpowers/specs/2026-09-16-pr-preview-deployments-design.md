# Per-PR preview deployments — design

Every open pull request against `apache/magpie-site` can be published as a live
site at `magpie-pr<N>.staged.apache.org`, so a reviewer can look at a change
instead of imagining it from a diff.

Previews are opt-in per PR: a maintainer comments `/show-preview`, and from then
on the PR's preview tracks its head commit until the PR closes. A scheduled
workflow does the publishing; nothing privileged ever runs pull-request code.

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

**`pull_request_target` is forbidden.** Not discouraged — excluded. The design
may not use it under any circumstance, including for the convenience of posting
a comment on PR open. Everything privileged happens in workflows triggered by
`schedule` or `workflow_dispatch`, which always run the default branch's copy of
themselves and can never be influenced by a pull request's contents.

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

Already runs `npm ci` and `npm run build` on every `pull_request`. It gains one
step: on pull-request events, upload `dist/` together with a small
`preview-meta.json` recording the PR number and the head SHA it was built from.

This job runs the pull request's code — `npm ci` alone executes install scripts
— so it holds nothing worth stealing. Fork-triggered `pull_request` runs already
receive a read-only token; the job additionally declares `permissions: {}` and
checks out with `persist-credentials: false`, so the property is explicit rather
than incidental.

No preview logic lives here. The build does not know whether a preview will be
published, and a pull request cannot cause one by editing this file — the
privileged side re-reads the workflow from the default branch.

### `preview-publish.yml` — privileged, scheduled

Triggered by `schedule` (every 15 minutes) and by `workflow_dispatch` with an
optional `pr` input naming a single PR number. Permissions: `contents: write`
(push and delete preview branches), `pull-requests: write` (comment),
`actions: read` (download artifacts). Concurrency group `preview-publish` with
`cancel-in-progress: false`, so two scheduled runs never race on the same
branches.

One run does four things, in order:

**1. Announce.** For each open PR with no explainer comment yet, post one. The
comment states that a maintainer can publish a preview with `/show-preview`,
gives the URL the preview will take, and notes the few-minute propagation delay.
It carries a stable HTML marker comment so the next run recognises it and does
not post twice.

**2. Resolve the armed set.** A PR is *armed* if any comment on it consists of
`/show-preview` and its author has write access to the repository. Author
permission is resolved through
`GET /repos/{owner}/{repo}/collaborators/{username}/permission` rather than the
comment's `author_association`, which is a weaker signal. The comment body must
match `^/show-preview\s*$` anchored — not a substring search, so quoting the
command while discussing it does not arm anything.

A PR is *disarmed* by deleting or editing that comment; there is no `/hide-preview`.
Since the armed set is recomputed from scratch on every run, removing the comment
is enough, and the next reap tears the preview down.

**3. Publish.** For each armed PR, find the most recent successful `build.yml`
run for that PR's current head SHA and download its artifact. Then:

- Validate `preview-meta.json`. The PR number must be digits only. The head SHA
  in the artifact must equal the head SHA the API reports for that PR. Without
  this check a fork could claim another PR's number and publish content under
  it; with it, the artifact can only ever land on the PR it was built from.
- Reject the artifact if any entry is a symlink or escapes the extraction root.
- Generate `.asf.yaml` **here**, from this workflow, never from the artifact:
  `profile: pr<N>`, `whoami: preview/pr<N>-staging`.
- Add `robots.txt` with `Disallow: /`, so previews never compete with
  `magpie.apache.org` in search results.
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

Reaping runs on every scheduled run, including runs dispatched for a single PR,
so a closed PR's content is replaced within one cron interval. A run that
tombstones a branch does not delete it in the same run — deletion waits for the
following run, so a propagation delay can never strand live PR content behind a
deleted branch.

### Manual publishing

`workflow_dispatch` with `pr: <N>` publishes that PR immediately, skipping the
armed check — a maintainer dispatching the workflow by hand *is* the
authorisation, since dispatch requires write access. This covers the cases the
schedule handles badly: a preview wanted immediately, or a republish after a
failed run, without waiting up to 15 minutes.

A dispatch also **arms** the PR, by recording the dispatching user in the status
comment's marker. Without this the next scheduled run would find the PR unarmed
and immediately reap the preview a maintainer had just asked for. Arming through
the marker keeps one rule — *armed means a maintainer said so, in a comment* —
with `/show-preview` and manual dispatch as two ways of saying it.

## Why polling rather than events

`issue_comment` would arm a PR the moment the comment lands, and `workflow_run`
would publish the moment a build finishes. Both were considered and dropped in
favour of one scheduled workflow, because a single privileged entry point is
easier to reason about than three, and because the scheduled run must exist
anyway to reap closed PRs. The cost is latency: up to 15 minutes from comment to
preview, and up to 15 minutes from close to teardown. `workflow_dispatch` covers
the impatient case.

The same reasoning removes the instant announce comment. Posting on PR open
would need `pull_request_target`, which is excluded, so the explainer arrives on
the next scheduled run instead.

## Failure handling

| Situation | Behaviour |
|---|---|
| No successful build for head SHA | Status comment says the preview is waiting on a green build; no branch is touched |
| Artifact expired | Terminal until the PR is pushed to again — the publisher never rebuilds. Status comment asks for a rebuild; artifact retention is set long enough that this only reaches dormant PRs |
| Artifact fails validation | Publish is skipped and the run logs why; the branch is left as it was |
| Force-push to a preview branch fails | Run fails loudly; the next scheduled run retries |
| PR closed mid-run | Next run tombstones the preview; the run after deletes the branch |
| Two runs overlap | Prevented by the concurrency group |

## Testing

The validation logic — metadata checks, comment matching, armed-set resolution —
goes in a script under `scripts/` with unit tests, not inline in YAML, so it can
be tested without pushing workflows. Test-driven: the anchored comment match, the
digits-only PR number, and the SHA-equality check each get a failing test first.

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
arming a PR is a statement of trust in its author, not in a diff. If that ever
proves too loose, the fix is a label as the armed flag so it can be removed.
