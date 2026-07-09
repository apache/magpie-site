#!/usr/bin/env bash
# Sync docs from apache/magpie into src/content/docs/
# Runs as prebuild step and locally via `npm run sync-docs`.
set -euo pipefail

REPO="${MAGPIE_DOCS_REPO:-https://github.com/apache/magpie.git}"
BRANCH="${MAGPIE_DOCS_BRANCH:-main}"
DEST="$(dirname "$0")/../src/content/docs"

# macOS's `mktemp -d` (with no template) ignores $TMPDIR and forces a dir under
# /var/folders, which sandboxed environments often disallow. Passing an explicit
# template rooted at $TMPDIR keeps the temp dir inside a writable location on
# both BSD/macOS and GNU/Linux.
TMP="$(mktemp -d "${TMPDIR:-/tmp}/magpie-docs.XXXXXXXX")"
trap 'rm -rf "$TMP"' EXIT

echo "→ Cloning $REPO@$BRANCH (sparse, docs/ + images/ + assets/ + skills/ + tools/ + organizations/)"
# The source repo is public, so no credentials are needed. Disable the credential
# helper for this clone (and persist that into the repo config so the partial-clone
# lazy fetch during `sparse-checkout set` inherits it) — otherwise a system-level
# credential.helper=osxkeychain tries to store into a keychain that is unwritable in
# sandboxed/CI environments and spams `fatal: failed to store: -60008`.
git clone --depth 1 --branch "$BRANCH" --filter=blob:none --sparse \
  --config credential.helper= "$REPO" "$TMP" >/dev/null 2>&1
(cd "$TMP" && git sparse-checkout set docs images assets skills tools organizations >/dev/null)

echo "→ Replacing $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$TMP/docs/." "$DEST/"

# Publish the root-level design principles as a docs page (/docs/principles) so
# the site can link to them locally instead of to GitHub.
if [ -f "$TMP/PRINCIPLES.md" ]; then
  echo "→ Publishing PRINCIPLES.md → $DEST/principles.md"
  cp "$TMP/PRINCIPLES.md" "$DEST/principles.md"
else
  echo "⚠ no PRINCIPLES.md in framework checkout; /docs/principles will be missing"
fi

# Publish each tool's README as an on-site docs page (/docs/tools/<name>) so the
# website links to tools internally instead of GitHub. Done before the generic
# link rewrite, which then leaves the absolute GitHub URLs these emit untouched.
echo "→ Publishing tool READMEs → $DEST/tools/<name>/readme.md"
if [ -d "$TMP/tools" ]; then
  node "$(dirname "$0")/sync-tool-docs.mjs" "$TMP" "$DEST"
else
  echo "⚠ no tools/ in framework checkout; /docs/tools/* will be missing"
fi

ASSET_DEST="$(dirname "$0")/../public/docs-assets"
echo "→ Syncing images/ + assets/ to $ASSET_DEST"
rm -rf "$ASSET_DEST"
mkdir -p "$ASSET_DEST"
# The framework moved its doc images from images/ to assets/; copy both so the
# site keeps working whichever location a given release uses. assets/ also holds
# non-image files (e.g. badge.json) that the site consumes directly.
for src in images assets; do
  if [ -d "$TMP/$src" ]; then
    cp -r "$TMP/$src/." "$ASSET_DEST/"
  fi
done

echo "→ Rewriting image refs in markdown (../../{images,assets} → /docs-assets, etc.)"
# perl -i is portable across GNU/Linux and BSD/macOS (sed -i differs between them)
find "$DEST" -name '*.md' -exec perl -pi -e '
  s{\.\./\.\./(?:images|assets)/}{/docs-assets/}g;
  s{\.\./(?:images|assets)/}{/docs-assets/}g;
  s{\((?:images|assets)/}{(/docs-assets/}g;
' {} +

echo "→ Rewriting internal .md links in markdown (→ site routes / GitHub)"
node "$(dirname "$0")/rewrite-doc-links.mjs" "$DEST" "${SITE_BASE:-/}"

count=$(find "$DEST" -name '*.md' | wc -l)
echo "✓ Synced $count markdown files into $DEST"

COUNTS_OUT="$(dirname "$0")/../src/data/skill-counts.json"
echo "→ Generating skill-family counts → $COUNTS_OUT"
mkdir -p "$(dirname "$COUNTS_OUT")"
if [ -d "$TMP/skills" ]; then
  node "$(dirname "$0")/gen-skill-counts.mjs" "$TMP/skills" "$COUNTS_OUT"
else
  echo "⚠ no skills/ in framework checkout; leaving existing $COUNTS_OUT untouched"
fi

TOOLS_OUT="$(dirname "$0")/../src/data/tools.json"
echo "→ Generating Tools & Capabilities summary → $TOOLS_OUT"
if [ -d "$TMP/tools" ]; then
  node "$(dirname "$0")/gen-tools.mjs" "$TMP" "$TOOLS_OUT"
else
  echo "⚠ no tools/ in framework checkout; leaving existing $TOOLS_OUT untouched"
fi

# Now that the education chapters are synced in, verify every one of them is
# linked from the landing page (and the landing links no page that vanished).
# This runs here — not as a standalone prek hook — because the docs are pulled
# from apache/magpie and gitignored, so this is the one place they are
# guaranteed present (locally on `npm run sync-docs`, and in CI's build job).
echo "→ Checking every education chapter is linked on the landing page"
python3 "$(dirname "$0")/check-landing-education.py"
