# Updating Magpie

Rendered page: https://magpie.apache.org/docs/updating-magpie/

Source: https://github.com/apache/magpie/blob/main/docs/updating-magpie.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

The rest of the documentation is about *using* Magpie. This section is about
working on it: how changes to the framework get built, what the project
expects of the text its skills produce, how it measures whether any of this is
helping, and what ships when a release is cut.

Not everything here is for contributors to `apache/magpie`. If you only want
to add a skill for your own project, [Extending
Magpie](/docs/extending) is the page you want — no fork, no PR to this
repository.

## Building the framework

- [**Spec-driven development**](/docs/spec-driven-development) — the build loop
  in [`tools/spec-loop/`](https://github.com/apache/magpie/tree/main/tools/spec-loop/),
  and how a change to the framework goes from spec to merged.
- [**Editorial guidelines**](/docs/editorial-guidelines) — the playbook for text
  the framework produces: canned responses, reporter-facing mail, status
  comments, CVE and tracker links, maintainer mentions.
- [**Source release contents**](/docs/source-release-contents) — what ends up in
  the signed artefact a `[VOTE]` thread votes on, and how `export-ignore`
  decides it.

## Reporting back

- [**Contributor-sentiment evaluation methodology**](/docs/contributor-sentiment) —
  how the project measures whether agentic maintainership is helping
  contributors rather than wearing them down. The gate evidence
  [RFC-AI-0004](/docs/rfcs/rfc-ai-0004) asks for.
- [**Pilot report template**](/docs/pilot-report-template) — the shape of a
  report from a project piloting a skill.

## Extending it instead

[**Extending Magpie**](/docs/extending) maps what you can extend, where an
extension can live, and who owns each kind — an adapter, a skill, a whole
family, in your own repository or an external skill source. Most of what
people want from "changing Magpie" is here, and none of it needs a change to
this repository.
