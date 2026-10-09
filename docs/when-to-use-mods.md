# When to use a mod in a Magpie family plugin

Rendered page: https://magpie.apache.org/docs/when-to-use-mods/

Source: https://github.com/apache/magpie/blob/main/docs/when-to-use-mods.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

Claude Code introduces **mods** (TypeScript/JavaScript event hook modules packaged in plugins).
This page documents the framework rules, boundaries, and decision rubric for when to introduce a mod into an Apache Magpie family plugin, and where mods must never be used.

The central theme of any Magpie mod is **moving deterministic or presentational work out of the model's context**.
Doing work in local code eliminates token consumption, removes latency, and produces deterministic user experiences while preserving full multi-harness portability.

## Overview and motivation

A mod is a plugin component that executes inside the host agent process when events occur.
Each hook acts as middleware `($, e, next)` that can observe an event, rewrite it, or answer it without initiating a model turn.

In Apache Magpie, skills are the universal unit of workflow authorship ([`PRINCIPLES.md` §15](https://github.com/apache/magpie/blob/main/PRINCIPLES.md#15-skills-are-the-unit-of-authorship)).
A skill is plain Markdown that any capable agentic harness can execute.
However, certain repetitive tasks do not require model reasoning:
- Checking whether local lockfiles have drifted before executing a skill.
- Rendering live terminal dashboards, progress bands, or interactive multi-item selection panes.
- Executing zero-token slash commands (such as listing available skills or inspecting local setup status).
- Enforcing deterministic safety checks (such as grepping outgoing patches for private CVE identifiers before pushing).

When implemented as a mod, these operations run with **zero token cost** and zero latency.

## The four non-negotiable constraints

Every mod authored for or shipped with Apache Magpie must strictly comply with four non-negotiable constraints.

### 1. Vendor neutrality (the additive-only rule)

Vendor neutrality is a foundational design principle of Apache Magpie ([`PRINCIPLES.md` §10](https://github.com/apache/magpie/blob/main/PRINCIPLES.md#10-vendor-neutrality-is-non-negotiable), [`docs/vendor-neutrality.md`](/docs/vendor-neutrality)).
Mods exist only in Claude Code (CLI and Desktop Code tab).
They don't run in Codex or Gemini CLI, and the VS Code panel and `claude -p` don't draw them.

Therefore, a mod can **only ever enhance a skill additively**.
Every skill must continue to work end-to-end when mods are disabled, unsupported, or absent.
A skill that requires a mod to complete its core workflow is broken by definition.

When a mod accelerates or formats an interaction, the underlying skill must maintain a clean fallback:
- If a mod provides an interactive multi-item review pane, the skill must still support sequential terminal prompts or standard markdown output on other harnesses.
- If a mod performs a zero-token pre-flight check, the skill must retain its standard markdown pre-flight step for harnesses without mod support.

### 2. Security and unsandboxed execution boundaries

Mods execute directly in the user's host environment with full user privileges outside the Bash sandbox.
A mod's `$.fs`, `$.process`, and `$.http` calls bypass the filesystem isolation and network egress gateways that sandbox standard agent tool executions.
Furthermore, a mod can intercept and approve tool calls that an interactive user confirmation rule would otherwise prompt for.

To protect adopters:
- Any mod shipped in a Magpie family plugin must expose a minimal, strictly auditable `calls:` surface.
- Mods must never execute unvetted external scripts, spawn long-lived unsandboxed background daemons, or initiate untracked network requests.
- All secure-setup documentation ([`docs/setup/secure-agent-setup.md`](/docs/setup/secure-agent-setup)) must explicitly document the security trade-offs of enabled mods.

### 3. Privacy-LLM compliance

The privacy-aware LLM routing policy ([`docs/setup/privacy-llm.md`](/docs/setup/privacy-llm), [`RFC-AI-0003`](/docs/rfcs/rfc-ai-0003)) governs every model interaction.
Calls to `$.model.complete`, `$.model.fork`, or `turn.step` model routing constitute model hops under the privacy rules.

- A mod must never route sensitive or private project data to an unapproved model endpoint.
- A mod must not attempt to circumvent privacy sanitization or PII redaction filters.
- Mods should favor deterministic code execution over embedded model calls whenever possible.

### 4. Distribution and enterprise policy fallbacks

Magpie distributes skills through modular family plugins (such as `plugins/magpie-setup/` and `plugins/magpie-utilities/`).
When a family includes a mod, the mod files live under the family plugin's `hooks/` directory (e.g. `hooks/hooks.json` and `hooks/register.ts`), not directly in the plugin root.

Enterprise environments often enforce strict administrator policies, such as `allowManagedModsOnly`.
In these environments, user-level or third-party mods will be blocked by the agent runtime.
Magpie plugins must handle this gracefully: the plugin and its skills will load normally, and the workflow must proceed without throwing errors or halting execution.

## Architectural seam: mods vs. capabilities vs. skills

To maintain architectural clarity, Magpie enforces a strict distinction between skills, capability contracts, tools, and mods:

```text
┌────────────────────────────────────────────────────────┐      ┌─────────────────────────────────────────────────┐
│ SKILLS (Universal Markdown)                            │      │ MODS (Claude Code Only)                         │
│ - Portable across all harnesses (Gemini, Codex, etc.)  │      │ - Additive event hooks                          │
│ - Declares required capability contracts (contract:*)  │<─────┤ - Hooks harness alongside skill execution       │
└───────────────────────────┬────────────────────────────┘      │ - Zero-token UI, commands, & pre-checks         │
                            │                                   │ - Lives under plugins/<family>/hooks/           │
                            v                                   └─────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ CAPABILITY CONTRACTS & TOOLS (Python / Shell)          │
│ - Abstraction layer for vendor backends (GitHub, Git)  │
│ - Backed by tool adapters under tools/<name>/          │
└────────────────────────────────────────────────────────┘
```

A mod is **not** a Magpie capability contract.
Capability contracts (`contract:tracker`, `contract:source-control`, `contract:cve-authority`) define abstract operations fulfilled by swappable backend tools.
Mods operate purely at the harness integration tier alongside skill execution to enhance user experience and optimize token efficiency.

## Decision rubric: when to author a mod

Contributors and maintainers should evaluate proposed mod implementations against the following rubric.

### Allowed and recommended uses

| Use Case | Implementation Mechanism | Benefit |
|---|---|---|
| **Zero-Token Slash Commands** | `$.command.register` + `command.run` | Instant execution of deterministic utilities (e.g. `/magpie-skills`, `/magpie-status`) without consuming model tokens or waiting for LLM turns. |
| **Presentational UI & Live Panes** | `ui.render` (`Pane`, `AbovePrompt`), `$.ui.toast`, `$.ui.status` | Rich interactive terminal surfaces (e.g. review finding selectors, vote tally countdowns, triage progress bands). |
| **Deterministic Pre-Push & Safety Guards** | `tool.call`, `tool.check` on `git commit` / `gh pr` | Intercepting commands to inspect outgoing text for accidental private CVE or secret leaks before network dispatch. |
| **Token-Free Lock Drift Detection** | `session.start` hook comparing lockfiles via `$.fs` | Immediate notification of snapshot drift without burning prompt tokens on every skill execution. |
| **Hardware Key & Auth Toasts** | `$.ui.toast` / `$.ui.status` during GPG signing | Non-intrusive status indicators when operations wait on hardware token touches. |

### Forbidden anti-patterns

| Anti-Pattern | Why It Is Forbidden | Correct Alternative |
|---|---|---|
| **Embedding Skill Workflow Logic in a Mod** | Violates vendor neutrality; breaks execution on Gemini CLI, Codex, and Cursor. | Keep workflow steps in the skill's markdown; use the mod only for presentational enhancement. |
| **Replacing Capability Tools with Unsandboxed Mod Calls** | Bypasses sandbox security and breaks backend interchangeability. | Implement backend functionality as a tool adapter under `tools/<name>/` fulfilling a capability contract. |
| **Silent Tool Call Approvals** | Bypasses the human-in-the-loop safety principle ([`PRINCIPLES.md` §7](https://github.com/apache/magpie/blob/main/PRINCIPLES.md#7-the-human-is-always-in-the-loop-until-they-choose-otherwise)). | Always require explicit maintainer confirmation before executing state-changing operations. |
| **Unvetted Network Egress** | Violates data residency and sandbox egress controls. | Restrict mod network calls; route external fetches through vetted tool adapters. |

## Starting points across skill families

The following table summarizes candidate opportunities for additive mods across Magpie skill families:

| Skill Family | Candidate Mod Enhancement | Fallback Behaviour (Without Mod) |
|---|---|---|
| **`family:setup`** | Instant lockfile drift notification on `session.start`; zero-token `/magpie-status` command; GPG hardware touch toast. | Skill pre-flight step performs comparison in prompt context; standard CLI status output. |
| **`family:utilities`** | Zero-token `/magpie-skills` command; live token-usage band during skill authoring and evals. | Standard skill execution via model turn. |
| **`family:security`** | Deterministic pre-commit/pre-push grep for unredacted CVE references; local tracker queue dashboard pane. | Explicit grep check instruction in `security-issue-fix` workflow step. |
| **`family:pr-management`** | Interactive review pane with accept/skip/edit buttons for code review findings; triage sweep progress band. | Sequential `AskUserQuestion` prompts or consolidated review summary markdown. |
| **`family:issue`** | Issue backlog status pane; triage sweep progress indicator. | Standard terminal summary output. |
| **`family:release-management`** | Live 72-hour vote tally countdown timer; step-by-step RC verification checklist pane. | Static markdown checklist rendered in terminal. |
| **`family:pairing`** | Side-by-side multi-agent review findings pane. | Consolidated sequential findings list in session transcript. |

## Packaging, testing, and CI validation

Mods ship inside their respective family plugins in `plugins/<family>/` under the `hooks/` directory.
The plugin manifest sits at `.claude-plugin/plugin.json` declaring plugin metadata:

```json
{
  "name": "magpie-utilities",
  "description": "Apache Magpie — framework meta-skills and zero-token utilities.",
  "version": "0.9.0.dev0"
}
```

The hooks manifest at `hooks/hooks.json` lists the mod modules to load:

```json
{
  "modules": ["./register.ts"]
}
```

The module (`hooks/register.ts`) exports a `register(on, options)` function that registers event listeners with the harness.

Every mod must include unit tests and pass strict validation before landing:
1. **Static Validation**: Mod modules must pass `claude plugin validate <dir> --strict` to verify hooked events and API calls.
2. **Automated Unit Tests**: Hook logic must be tested using `claude plugin test` with corresponding `*.test.ts` test suites.
3. **CI Integration**: Plugin validation and test suites must run alongside standard pre-commit hooks and Python test runners.

## See also

- [`docs/vendor-neutrality.md`](/docs/vendor-neutrality) — How Magpie achieves neutrality across six independent axes
- [`docs/extending.md`](/docs/extending) — Extension points across skills, tools, organizations, and harnesses
- [`docs/labels-and-capabilities.md`](/docs/labels-and-capabilities) — The capability taxonomy and label taxonomy
- [`docs/setup/secure-agent-setup.md`](/docs/setup/secure-agent-setup) — The sandboxed agent execution environment
- [`docs/setup/privacy-llm.md`](/docs/setup/privacy-llm) — Privacy-aware LLM routing and endpoint approval
- [`PRINCIPLES.md`](https://github.com/apache/magpie/blob/main/PRINCIPLES.md) — Core architectural principles of Apache Magpie
