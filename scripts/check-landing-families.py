#!/usr/bin/env python3
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""Guard: every skill family in the metadata has a landing-page card.

The landing hero (``src/components/landing/KineticHome.tsx``) shows a
card per skill family in its ``families`` array. The per-family *counts*
are already data-driven (read from ``src/data/skill-counts.json``, which
``scripts/gen-skill-counts.mjs`` derives from each skill's ``family:``
frontmatter in apache/magpie). But the *list* of families — and each card's
editorial copy (icon, modes, cta, desc) — is hand-maintained in the component.

That split means a family can land upstream (a new ``family:`` value) and show
up in ``skill-counts.json`` while the landing silently omits its card. That is
exactly how ``pairing`` went missing until it was noticed by eye.

This check makes the invariant deterministic: it compares the family set in
``skill-counts.json`` (the metadata source of truth) against the ``name:``
values in the hero's ``families`` array, and fails if either side is
missing an entry.

It runs from ``scripts/sync-docs.sh`` immediately after
``gen-skill-counts.mjs`` regenerates ``skill-counts.json`` from the freshly
pulled apache/magpie ``skills/``. That is the moment a newly-added upstream
family first appears in the data, so a missing card fails the sync (and
therefore the build). It reads only committed files (no synced docs), so it is
equally safe to run standalone at any time.

No third-party dependencies, no network, no filesystem writes — pure stdlib so
it runs identically everywhere.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL_COUNTS = REPO_ROOT / "src" / "data" / "skill-counts.json"
LANDING = REPO_ROOT / "src" / "components" / "landing" / "KineticHome.tsx"

# Isolate the `const families = [ ... ];` array so `name:` keys elsewhere
# in the file (community members, VN score labels, education groups) can never
# be mistaken for a family name.
FAMILIES_BLOCK_RE = re.compile(r"const families\s*=\s*\[(.*?)\n\];", re.DOTALL)
# Each family object opens with `name: "<family>"`.
FAMILY_NAME_RE = re.compile(r'name:\s*"([a-z0-9][a-z0-9-]*)"')


def metadata_families() -> set[str]:
    """Family names present in the metadata-derived skill-counts.json."""
    data = json.loads(SKILL_COUNTS.read_text(encoding="utf-8"))
    return set(data.get("counts", {}).keys())


def landing_families() -> set[str]:
    """Family names declared in the hero's families array."""
    text = LANDING.read_text(encoding="utf-8")
    block = FAMILIES_BLOCK_RE.search(text)
    if not block:
        raise SystemExit(
            "error: could not find the `const families = [ ... ];` array in\n"
            f"{LANDING} — was it renamed? Update scripts/check-landing-families.py."
        )
    return set(FAMILY_NAME_RE.findall(block.group(1)))


def main() -> int:
    # Defensive: skill-counts.json is committed, so it is normally present. If a
    # sync has never run and it is somehow absent, skip cleanly — there is
    # nothing authoritative to check against.
    if not SKILL_COUNTS.is_file():
        print(
            f"skip: {SKILL_COUNTS} missing — run `npm run sync-docs` to enable "
            "this check",
            file=sys.stderr,
        )
        return 0
    if not LANDING.is_file():
        print(f"error: landing page not found: {LANDING}", file=sys.stderr)
        return 1

    in_metadata = metadata_families()
    on_landing = landing_families()

    missing = sorted(in_metadata - on_landing)  # family in data, no card on landing
    dangling = sorted(on_landing - in_metadata)  # card on landing, no such family

    if not missing and not dangling:
        return 0

    print("Landing page is out of sync with the skill-family metadata.\n", file=sys.stderr)
    if missing:
        print(
            "These families appear in src/data/skill-counts.json (derived from the\n"
            "`family:` frontmatter in apache/magpie) but have NO card in the\n"
            "families array of\n"
            "src/components/landing/KineticHome.tsx.\n"
            "Add a card (icon, modes, overview, cta, desc) for each:",
            file=sys.stderr,
        )
        for family in missing:
            print(f"  - {family}", file=sys.stderr)
        print(file=sys.stderr)
    if dangling:
        print(
            "The landing declares cards for these families, but no skill in\n"
            "apache/magpie carries the matching `family:` value (renamed or\n"
            "removed upstream?). Remove or rename each card:",
            file=sys.stderr,
        )
        for family in dangling:
            print(f"  - {family}", file=sys.stderr)
        print(file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
