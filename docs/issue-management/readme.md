# Issue management skill family

Rendered page: https://magpie.apache.org/docs/issue-management/readme/

Source: https://github.com/apache/magpie/blob/main/docs/issue-management/README.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

> **Scope.** Works on any project, ASF or not — no
> Apache-Software-Foundation-specific assumptions baked in.

Maintainer-facing skills for projects with a general-issue tracker
(JIRA, GitHub Issues, Bugzilla, GitLab Issues). Eight skills that
cover per-issue work, pool-level sweeps, deduplication, and
read-only reporting:

1. **Agentic Triage** — sweep open issues in the configured candidate pool,
   classify against the project's criteria, propose a disposition
   (BUG / FEATURE-REQUEST / NEEDS-INFO / DUPLICATE / INVALID /
   ALREADY-FIXED), execute on maintainer confirmation.
2. **Reassess** — sweep a configured pool of resolved or end-of-life
   issues and re-assess each against the current upstream codebase,
   surfacing silent fixes and partial fixes.
3. **Reproducer** — for a single issue identifying a code-level bug,
   extract the reporter's example code, adapt it to run on the
   current default branch, execute via the project's runtime, and
   compose a structured verdict. Read-only on the tracker.
4. **Fix-workflow** — for a triaged issue confirmed as a bug or
   feature, draft a fix PR (code change, regression test, commit
   message, PR description). Drafts only; the human committer
   reviews and pushes.
5. **Stale-sweep** — sweep open issues for inactivity past a
   configurable threshold, classify each as `REQUEST-UPDATE` (nudge)
   or `CLOSE-STALE` (pre-close notice), post one comment per issue on
   maintainer confirmation; closures require a second explicit
   confirmation step.
6. **Stats** — read-only dashboard over a directory of `verdict.json`
   files produced by reassess campaigns. Surfaces health rating,
   classification distribution, partial-fix surfaces, and per-component
   breakdowns.
7. **Deduplicate** — identify two open issues sharing the same root
   cause, draft a cross-link comment and a closing rationale, and
   close the duplicate on maintainer confirmation; closures require a
   second explicit confirmation step.
8. **Backlog stats** — read-only dashboard over the open issue
   backlog. Surfaces a health rating, prioritised recommendations,
   age and staleness breakdowns, area pressure ranking, and a
   triage-funnel summary without modifying any tracker state.

> [!TIP]
> **Why this family**
> - A triage pass over the backlog that proposes a disposition per issue instead of a label per issue
> - A runnable reproducer extracted from a bug report, so "cannot reproduce" stops being the first reply
> - Duplicates merged without losing the second reporter's detail, or their credit

## Install & first runs

[Install & first runs](/docs/issue-management/install) has the install command for this family,
the files to configure before the first run, and the skills to try first.

## Triage issues

Run `/magpie-issue:triage` to classify issues against the project's criteria and propose a disposition.
Use `/magpie-issue:backlog-stats` to review backlog health, pressure areas, and staleness.

## Reproduce and fix an issue

Run `/magpie-issue:reproducer` to extract and try a minimal reproducer from an issue.
After triage confirms a bug, run `/magpie-issue:fix-workflow` to draft a fix for maintainer review.

## Family boundary

This family sits **alongside** two related families:

- [`pr-management-*`](/docs/pr-management/readme) handles the
  pull-request queue (open PRs, code review, queue stats). PRs are
  not issues; the skills there operate on a different tracker
  surface and apply different criteria.
- [`security-issue-*`](/docs/security/readme) handles the security-
  issue tracker, with confidentiality and CVE-allocation constraints
  the general-issue family does not need. A project may use both
  families against different trackers (private security repo;
  public general-issue JIRA).

A maintainer of a project with both an issue tracker and an active
PR flow typically uses both `issue-*` and `pr-management-*` families,
configured with different trackers.

## Skills

| Skill | Mode | Purpose |
|---|---|---|
| [`issue-triage`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/triage/SKILL.md) | Agentic Triage | Per-issue classification + disposition proposal |
| [`issue-reassess`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/reassess/SKILL.md) | Agentic Triage | Pool-level sweep of resolved / EOL issues for re-assessment |
| [`issue-reproducer`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/reproducer/SKILL.md) | — | Per-issue extraction + execution of code examples |
| [`issue-fix-workflow`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/fix-workflow/SKILL.md) | Agentic Drafting | Drafts a fix PR for a triaged issue |
| [`issue-stale-sweep`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/stale-sweep/SKILL.md) | Agentic Triage | Backlog hygiene: classifies dormant issues as `REQUEST-UPDATE` or `CLOSE-STALE`; posts one comment per issue on confirmation |
| [`issue-reassess-stats`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/reassess-stats/SKILL.md) | — | Read-only campaign dashboard |
| [`issue-deduplicate`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/deduplicate/SKILL.md) | Triage | Merge two open issues describing the same root cause; posts notices and closes the duplicate on explicit two-step confirmation |
| [`issue-backlog-stats`](https://github.com/apache/magpie/blob/main/plugins/magpie-issue/skills/backlog-stats/SKILL.md) | Triage | Read-only dashboard over the open issue backlog: health rating, area pressure, age breakdown, triage funnel, and staleness candidates |

`issue-reproducer` and `issue-reassess-stats` sit outside the MISSION
mode taxonomy; they are mechanical / read-only, not classificatory or
mutating.

## Status

**Experimental.** No adopter pilot has run an evaluation against
this family yet. Shape may change between framework versions.

To provide pilot feedback, copy
[`docs/pilot-report-template.md`](/docs/pilot-report-template) into your
project notes, fill in each section, and optionally validate the filled-in
report with:

```bash
uv run --project tools/pilot-report-validator pilot-report-validate <your-report.md>
```

## Cross-references

- [Top-level README — Install](https://github.com/apache/magpie/blob/main/README.md#install) — 3-step bootstrap.
- [`projects/_template/README.md`](https://github.com/apache/magpie/blob/main/plugins/magpie-setup/templates/README.md) — adopter scaffold index.
- [`docs/modes.md`](/docs/modes) — MISSION mode taxonomy that the
  `mode:` frontmatter field declares against.
- [Project rules](/docs/setup/agentic-overrides) —
  the override mechanism every skill in this family supports.
