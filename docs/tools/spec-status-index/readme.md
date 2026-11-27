# spec-status-index

Rendered page: https://magpie.apache.org/docs/tools/spec-status-index/readme/

Source: https://github.com/apache/magpie/blob/main/docs/tools/spec-status-index/readme.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

**Capability:** substrate:framework-dev + substrate:analytics

**Harness:** agnostic

A deterministic `uv` tool that reads spec-loop specs from
`tools/spec-loop/specs/` and prints them grouped by status, so build
iterations can choose the next work item mechanically.

## Prerequisites

- **Runtime:** Python 3.11+ run via `uv`; stdlib-only (no runtime
  dependencies). The `dev` group pulls `pytest`.
- **CLIs:** None beyond the runtime.
- **Credentials / auth:** None.
- **Network:** Runs fully offline; reads spec files from
  `tools/spec-loop/specs/` on the local filesystem.

## Usage

```bash
# All specs, grouped by status
uv run --project tools/spec-status-index spec-status

# Only actionable items (proposed + experimental)
uv run --project tools/spec-status-index spec-status --ready

# Filter to a specific status
uv run --project tools/spec-status-index spec-status --status proposed

# Machine-readable JSON output
uv run --project tools/spec-status-index spec-status --json
uv run --project tools/spec-status-index spec-status --ready --json
```

## Statuses

| Status | Meaning |
|---|---|
| `proposed` | Planned; no implementation yet |
| `experimental` | Partially implemented; may change |
| `stable` | Production quality |
| `off` | Disabled |

`--ready` surfaces `proposed` and `experimental` specs — the ones with
actionable build work remaining.

## Run tests

```bash
uv run --project tools/spec-status-index --group dev pytest
```
