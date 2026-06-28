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

echo "→ Cloning $REPO@$BRANCH (sparse, docs/ + images/ + skills/)"
git clone --depth 1 --branch "$BRANCH" --filter=blob:none --sparse "$REPO" "$TMP" >/dev/null 2>&1
(cd "$TMP" && git sparse-checkout set docs images skills >/dev/null)

echo "→ Replacing $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$TMP/docs/." "$DEST/"

ASSET_DEST="$(dirname "$0")/../public/docs-assets"
echo "→ Syncing images to $ASSET_DEST"
rm -rf "$ASSET_DEST"
if [ -d "$TMP/images" ]; then
  mkdir -p "$ASSET_DEST"
  cp -r "$TMP/images/." "$ASSET_DEST/"
fi

echo "→ Rewriting image refs in markdown (../../images → /docs-assets, ../images → /docs-assets)"
# perl -i is portable across GNU/Linux and BSD/macOS (sed -i differs between them)
find "$DEST" -name '*.md' -exec perl -pi -e '
  s{\.\./\.\./images/}{/docs-assets/}g;
  s{\.\./images/}{/docs-assets/}g;
  s{\(images/}{(/docs-assets/}g;
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
