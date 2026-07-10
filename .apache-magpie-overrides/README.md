# apache-magpie overrides

Agent-readable instructions that override specific steps or
behaviours of apache-magpie framework skills, scoped to
this adopter repo. Each override file is named after the
framework skill it modifies (e.g. `pr-management-triage.md`
overrides the `pr-management-triage` skill).

The framework skills consult this directory at run-time
before executing default behaviour. See
[`docs/setup/agentic-overrides.md`](https://github.com/apache/magpie/blob/main/docs/setup/agentic-overrides.md)
in the framework for the full contract.

**Hard rule**: never modify the snapshot under
`.apache-magpie/`. Local mods go here.
Framework changes go via PR to `apache/magpie`.
