# Designs

Rendered page: https://magpie.apache.org/docs/designs/readme/

Source: https://github.com/apache/magpie/blob/main/docs/designs/README.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

Design documents for changes that are in flight or recently landed. Each one
records what was decided and, more usefully, what was rejected and why — the
alternatives section is the part that saves the next person the argument.

A design here is not a promise that the work shipped as described. Each
carries a status line; read that first, and take seriously any section naming
what was designed and deliberately not built.

| Design | Status |
|---|---|
| [Install, adopt, upgrade](/docs/designs/2026-09-13-install-adopt-upgrade) | Built, bar two items it names |
| [Body-owned configuration layers](/docs/designs/2026-09-17-body-owned-config-layers) | Proposed — depends on the Incubator PMC and ComDev |
| [Reproducible releases](/docs/designs/2026-09-20-reproducible-releases) | Built (apache/magpie#1296); the ASF automated-signing path and the ATR SWHID comparison await first use |
| [Reconciliation tracking for marketplace installs](/docs/designs/2026-09-21-marketplace-reconciliation-tracking) | Built, bar seven items it names |
| [Adversarial review by other models, before every PR](/docs/designs/2026-09-23-adversarial-review) | Built (apache/magpie#1368 and the PRs stacked on it) |

One document per subject, describing the result rather than the phases it was
built in. While a design is being implemented it may be split into plans; when
the work lands, the plans are folded back in and deleted. A reader arriving
later wants the decision and the rejected alternative, not the task list that
got there — and git keeps the task list.

These sit outside [`tools/spec-loop/specs/`](https://github.com/apache/magpie/tree/main/tools/spec-loop/specs/),
which is the durable record of what the framework guarantees. A design argues
for a change; a spec states what the shipped system does. When the two
disagree, the spec is right.
