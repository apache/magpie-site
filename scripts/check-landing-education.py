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
"""Guard: every education chapter is linked from the landing page.

The landing hero (``src/components/landing/ImmersiveGradientHero.tsx``)
summarises the maintainer-education stream and links every chapter under
``/docs/education/<slug>``. When someone adds a new education page it must
also be surfaced on the landing, otherwise the stream silently drifts out of
sync with the docs (PRINCIPLE 18: every release ships its learning material).

This check makes that invariant deterministic and enforceable: it compares the
set of chapter pages on disk against the ``/docs/education/<slug>`` links in
the hero and fails if either side is missing an entry.

It runs from ``scripts/sync-docs.sh`` immediately after the docs are pulled in
from apache/magpie (which is where the education chapters actually live). That
is the one place the chapter pages are guaranteed present — locally on
``npm run sync-docs`` and in CI's build job — so a missing link fails the sync
(and therefore the build).

A "chapter" is any Markdown file sitting *directly* in
``src/content/docs/education/``, except its ``README`` (the section overview,
linked separately as the stream's front door). The ``training/`` sub-module
lives in its own directory and its own docs section, so it is intentionally
*not* required on the landing and is excluded by the non-recursive scan.

No third-party dependencies, no network, no filesystem writes — pure stdlib so
it runs identically everywhere.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EDUCATION_DIR = REPO_ROOT / "src" / "content" / "docs" / "education"
LANDING = REPO_ROOT / "src" / "components" / "landing" / "ImmersiveGradientHero.tsx"

# README is the section overview (linked as the stream's front door), not a
# chapter that has to appear in the grouped card list.
EXCLUDED_SLUGS = {"readme", "index"}

# Match /docs/education/<slug> where <slug> is a single path segment (no further
# "/"), so training sub-pages (/docs/education/training/lesson-01) never count
# as chapter links. The lookahead stops a slug matching a longer sibling.
LINK_RE = re.compile(r"/docs/education/([a-z0-9][a-z0-9-]*)(?![\w/-])")


def chapter_slugs() -> set[str]:
    """Chapter pages on disk: education/*.md (non-recursive), minus README."""
    slugs = set()
    for md in EDUCATION_DIR.glob("*.md"):
        slug = md.stem.lower()
        if slug not in EXCLUDED_SLUGS:
            slugs.add(slug)
    return slugs


def landing_slugs() -> set[str]:
    """Education slugs linked from the landing hero, minus the overview link."""
    text = LANDING.read_text(encoding="utf-8")
    return {m.group(1) for m in LINK_RE.finditer(text)} - EXCLUDED_SLUGS


def main() -> int:
    # Defensive: this is invoked from sync-docs.sh right after the docs land,
    # so the directory is normally present. If it is somehow missing (the
    # script was run standalone before a sync), skip cleanly rather than fail —
    # there is nothing to check against.
    if not EDUCATION_DIR.is_dir():
        print(
            f"skip: education docs not synced ({EDUCATION_DIR} missing) — "
            "run `npm run sync-docs` to enable this check",
            file=sys.stderr,
        )
        return 0
    if not LANDING.is_file():
        print(f"error: landing page not found: {LANDING}", file=sys.stderr)
        return 1

    on_disk = chapter_slugs()
    on_landing = landing_slugs()

    missing = sorted(on_disk - on_landing)  # a page exists but the landing never links it
    dangling = sorted(on_landing - on_disk)  # the landing links a page that no longer exists

    if not missing and not dangling:
        return 0

    print("Landing page is out of sync with the education docs.\n", file=sys.stderr)
    if missing:
        print(
            "These education chapters exist under src/content/docs/education/ but are\n"
            "NOT linked from src/components/landing/ImmersiveGradientHero.tsx.\n"
            "Add each to an EDUCATION_GROUPS stream (or EDUCATION_REFERENCES):",
            file=sys.stderr,
        )
        for slug in missing:
            print(f"  - {slug}   (link as /docs/education/{slug})", file=sys.stderr)
        print(file=sys.stderr)
    if dangling:
        print(
            "The landing links these education pages, but no matching Markdown file\n"
            "exists under src/content/docs/education/ (renamed or removed?):",
            file=sys.stderr,
        )
        for slug in dangling:
            print(f"  - /docs/education/{slug}", file=sys.stderr)
        print(file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
