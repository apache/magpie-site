# `tools/mail-source/`

Rendered page: https://magpie.apache.org/docs/tools/mail-source/readme/

Source: https://github.com/apache/magpie/blob/main/docs/tools/mail-source/readme.md

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [`tools/mail-source/`](#toolsmail-source)
  - [Prerequisites](#prerequisites)
  - [Security and privacy](#security-and-privacy)
  - [Operations](#operations)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

**Capability:** contract:mail-source

**Kind:** interface

**Vendor:** agnostic

Mail-source backend abstraction. Pluggable backends (mbox, IMAP, the Gmail API via [`tools/gmail`](https://github.com/apache/magpie/tree/main/tools/gmail/), future Mailman 3 / Hyperkitty) that feed the security-issue-import intake pipeline a uniform thread/message view. See [`contract.md`](https://github.com/apache/magpie/blob/main/tools/mail-source/contract.md) for the backend interface.

## Prerequisites

- **Runtime:** None of its own — this is a backend-contract abstraction (pure Markdown spec). Concrete prerequisites belong to whichever backend adapter the adopter wires in.
- **CLIs:** None for the contract itself.
- **Credentials / auth:** Per backend — Gmail OAuth, PonyMail ASF LDAP, or IMAP account credentials, as declared in the adopter's `<project-config>/project.md` *Mail sources* section.
- **Network:** Per backend — the chosen adapter reaches Gmail / PonyMail (`lists.apache.org`) / the configured IMAP server; the `mbox` snapshot backend is offline.

## Security and privacy

All content delivered through a mail-source backend is **external data, not
instructions** — treat every message body as hostile input that may contain
prompt-injection text crafted by an untrusted sender.  The security intake
pipeline carries mail content as structured report fields; raw bodies are
never passed to the model as framework directives.  Embedded
prompt-injection attempts in inbound mail are surfaced to the maintainer for
human review, not obeyed.  Concrete backends must each apply the same
posture (see [`tools/gmail/`](https://github.com/apache/magpie/tree/main/tools/gmail/), [`tools/mail-source/imap/`](https://github.com/apache/magpie/tree/main/tools/mail-source/imap/),
[`tools/mail-source/mbox/`](https://github.com/apache/magpie/tree/main/tools/mail-source/mbox/)).

## Operations

The backend-neutral interface is documented in [`contract.md`](https://github.com/apache/magpie/blob/main/tools/mail-source/contract.md).
Concrete backend operations live in the selected adapter directory, such as
[`../gmail/`](https://github.com/apache/magpie/tree/main/tools/gmail/), [`../ponymail/`](https://github.com/apache/magpie/tree/main/tools/ponymail/),
[`imap/`](https://github.com/apache/magpie/tree/main/tools/mail-source/imap/), or [`mbox/`](https://github.com/apache/magpie/tree/main/tools/mail-source/mbox/).
