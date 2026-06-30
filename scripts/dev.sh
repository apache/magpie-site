#!/usr/bin/env bash
# Start the Astro dev server with telemetry disabled.
# Runs locally via `npm run dev`; any extra args are forwarded to `astro dev`.
#
# ASTRO_TELEMETRY_DISABLED=1 stops Astro writing to its telemetry config dir
# (e.g. ~/Library/Preferences/astro on macOS). That write fails under sandboxed
# environments and aborts the dev server, so we disable it unconditionally —
# the project does not rely on Astro telemetry. See AGENTS.md "Local setup".
set -euo pipefail

export ASTRO_TELEMETRY_DISABLED=1
exec npx astro dev "$@"
