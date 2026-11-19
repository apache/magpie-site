# `tools/body-field-contract/`

Rendered page: https://magpie.apache.org/docs/tools/body-field-contract/readme/

Source: https://github.com/apache/magpie/blob/main/docs/tools/body-field-contract/readme.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

**Capability:** contract:body-field

**Kind:** interface

**Vendor:** agnostic

How every reader and writer finds the `### <Name>` fields of a tracker issue body, stated once and independent of language:
what a field boundary is, which code blocks count, which heading is the field, what is ambiguous and must be refused,
the four operations an implementation provides (list fields, extract, replace, normalise) with their refusals,
and the two writer operations (escape text, escape body) that keep untrusted text from ever becoming a field.

A tracker whose reports use another layout reads them through a *format adapter* ([`formats/`](https://github.com/apache/magpie/blob/main/tools/body-field-contract/formats/README.md), the upstream home for them; [format adapter interface](https://github.com/apache/magpie/blob/main/tools/body-field-contract/contract.md#format-adapters)).

See [`contract.md`](https://github.com/apache/magpie/blob/main/tools/body-field-contract/contract.md) for the rules and [`conformance/cases.jsonl`](https://github.com/apache/magpie/blob/main/tools/body-field-contract/conformance/cases.jsonl) for the shared conformance cases,
which `tools/github-body-field/tests/test_conformance.py` runs against every implementation in the repository.

| Implementation | Language |
|---|---|
| [`tools/github-body-field/`](https://github.com/apache/magpie/blob/main/tools/github-body-field/README.md) | Python (reference) |
| [`tools/vetted-ops/`](https://github.com/apache/magpie/blob/main/tools/vetted-ops/README.md) | Python (byte-identical copy) |
| [`tools/local-tracker/`](https://github.com/apache/magpie/blob/main/tools/local-tracker/README.md) | Python (byte-identical copy; escape text and escape body) |
| [`tools/jira/`](https://github.com/apache/magpie/blob/main/tools/jira/README.md) | Python (byte-identical copy, after mapping wiki headings; escape body) |
| [`groovy/`](https://github.com/apache/magpie/blob/main/tools/body-field-contract/groovy/BodyFieldParser.groovy) | Groovy (basic implementation, every operation) |
| [`tools/security-management/`](https://github.com/apache/magpie/blob/main/tools/security-management/README.md) | Python (writer only: escape text, the import's inert block) |

## Prerequisites

- **Runtime:** None for the contract itself (Markdown and JSON Lines fixtures).
  The Groovy implementation in [`groovy/`](https://github.com/apache/magpie/blob/main/tools/body-field-contract/groovy/BodyFieldParser.groovy) needs the Groovy runtime only (it was checked with Groovy 6.0.0 on JVM 27); it has no other dependency and pulls nothing with `@Grab`.
- **CLIs / credentials / network:** None. The conformance runner lives in `tools/github-body-field/tests/` and runs offline under its pytest.
- **Optional:** `groovy` on `PATH`, for the runner's Groovy check; without it that check skips with the reason.
