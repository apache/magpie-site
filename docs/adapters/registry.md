# Adapter registry

Rendered page: https://magpie.apache.org/docs/adapters/registry/

Source: https://github.com/apache/magpie/blob/main/docs/adapters/registry.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Adapter registry](#adapter-registry)
  - [In-tree tool adapters](#in-tree-tool-adapters)
  - [In-tree organizations](#in-tree-organizations)
  - [Community / external adapters](#community--external-adapters)
    - [Adding an external adapter to this index](#adding-an-external-adapter-to-this-index)
  - [See also](#see-also)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

A **discovery** index of the [tool adapters](/docs/vendor-neutrality#tool-adapters)
and [organizations](https://github.com/apache/magpie/blob/main/organizations/README.md) Magpie knows about —
the ones that ship in-tree, the open extension points, and links to
**community-maintained adapters defined elsewhere**.

> **Discovery, never installation.** Per
> [`PRINCIPLES.md` §13](https://github.com/apache/magpie/blob/main/PRINCIPLES.md#13-snapshot-plus-override-never-vendored-copies),
> this page is an index, not a package manager. Nothing here is
> auto-fetched. To use an adapter you wire it in deliberately — point
> your `<project-config>/project.md` (or `organizations/<org>/`) at it,
> exactly as you would a built-in one. An external link is a pointer for
> humans to evaluate, not a supply-chain hook.
>
> This applies to the *adapter/organization* index on this page. Skills
> are different: §13 permits **installing** a skill or skill-family from a
> **trusted** external source — pinned, verified, and adopter-vouched.
> That mechanism and its own discovery index live under
> [`docs/skill-sources/`](/docs/skill-sources/readme).

To author a new adapter, see [`authoring.md`](/docs/adapters/authoring).

## In-tree tool adapters

Each capability contract under `tools/<contract>/` enumerates the
adapters that fulfil it. Shipping = a working adapter in the tree;
extension point = a documented, labelled slot with a tracking issue.

| Capability contract | Shipping adapter(s) | Extension points (tracked) |
|---|---|---|
| [`tools/cve-tool`](https://github.com/apache/magpie/tree/main/tools/cve-tool/) | [`cve-tool-vulnogram`](https://github.com/apache/magpie/tree/main/tools/cve-tool-vulnogram/) (ASF) | MITRE form, CVE.org direct, GHSA |
| [`tools/mail-archive`](https://github.com/apache/magpie/tree/main/tools/mail-archive/) | [`ponymail`](https://github.com/apache/magpie/tree/main/tools/ponymail/) (ASF), [`gmail`](https://github.com/apache/magpie/tree/main/tools/gmail/), [`sourcehut`](https://github.com/apache/magpie/tree/main/tools/sourcehut/) | Hyperkitty, Discourse, Google Groups, GitHub Discussions |
| [`tools/mail-source`](https://github.com/apache/magpie/tree/main/tools/mail-source/) | mbox, IMAP, [`gmail`](https://github.com/apache/magpie/tree/main/tools/gmail/), [`maildir`](https://github.com/apache/magpie/tree/main/tools/maildir/), [`ponymail`](https://github.com/apache/magpie/tree/main/tools/ponymail/) (ASF) | Mailman 3 ([#306](https://github.com/apache/magpie/issues/306)) |
| [`tools/forwarder-relay`](https://github.com/apache/magpie/tree/main/tools/forwarder-relay/) | ASF-security ([`tools/gmail/asf-relay.md`](https://github.com/apache/magpie/blob/main/tools/gmail/asf-relay.md)) | huntr.com, HackerOne, GHSA relay |
| [`tools/scan-format`](https://github.com/apache/magpie/tree/main/tools/scan-format/) | ASVS | other scanner formats |
| [`tools/vcs`](https://github.com/apache/magpie/tree/main/tools/vcs/) | Git, Mercurial, Fossil | Subversion [\#602](https://github.com/apache/magpie/issues/602), Jujutsu [\#603](https://github.com/apache/magpie/issues/603), Perforce [\#605](https://github.com/apache/magpie/issues/605) |
| Forge / tracker | [`github`](https://github.com/apache/magpie/tree/main/tools/github/), [`jira`](https://github.com/apache/magpie/tree/main/tools/jira/), [`bitbucket`](https://github.com/apache/magpie/tree/main/tools/bitbucket/) `partial-read-only` foundation, [`sourcehut`](https://github.com/apache/magpie/tree/main/tools/sourcehut/), [`fossil`](https://github.com/apache/magpie/tree/main/tools/fossil/) | GitLab [\#305](https://github.com/apache/magpie/issues/305), Forgejo/Gitea [\#310](https://github.com/apache/magpie/issues/310), Pagure [\#312](https://github.com/apache/magpie/issues/312), deeper Bitbucket/Jira coverage [\#606](https://github.com/apache/magpie/issues/606), Bugzilla [\#302](https://github.com/apache/magpie/issues/302) |
| Agentic runtime | Claude Code, [Codex](/docs/adapters/codex) `experimental` ([#313](https://github.com/apache/magpie/issues/313)) | Gemini CLI [#314](https://github.com/apache/magpie/issues/314)–OpenHands [#322](https://github.com/apache/magpie/issues/322) |
| Security cross-ref | — | OSV.dev [#311](https://github.com/apache/magpie/issues/311) |

## In-tree organizations

| Organization | Directory |
|---|---|
| Apache Software Foundation | [`organizations/ASF/`](https://github.com/apache/magpie/tree/main/organizations/ASF/) |
| Independent (no formal governing body) | [`organizations/independent/`](https://github.com/apache/magpie/tree/main/organizations/independent/) |

## Community / external adapters

Adapters maintained **outside** this repository — kept in their authors'
own repos and linked here for discovery. An adopter wires one in by
pointing their config at it (see the discovery-not-installation note
above); the framework never fetches them.

| Adapter | Capability / org | Maintainer | Link | Notes |
|---|---|---|---|---|
| *(none listed yet)* | | | | Open a PR to add a row — see below. |

### Adding an external adapter to this index

Open a PR against `apache/magpie` that adds one row to the table above
with: the adapter name, the capability contract (or organization) it
implements, the maintainer, a link to its repository, and a one-line
note. Listing here is **editorial discovery only** — it makes no
guarantee about the adapter and triggers no install. Adapters you would
rather contribute into the tree itself follow [`authoring.md`](/docs/adapters/authoring)
instead.

## See also

- [`docs/extending.md`](/docs/extending) — the full extension model (what / where / who).
- [`docs/vendor-neutrality.md`](/docs/vendor-neutrality) — how tool adapters and organizations deliver neutrality.
- [`authoring.md`](/docs/adapters/authoring) — authoring your own adapter.
- [`organizations/README.md`](https://github.com/apache/magpie/blob/main/organizations/README.md) — the organization entity.
