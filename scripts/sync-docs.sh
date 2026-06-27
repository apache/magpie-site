#!/usr/bin/env bash
# Sync docs from apache/magpie into src/content/docs/
# Runs as prebuild step and locally via `npm run sync-docs`.
set -euo pipefail

REPO="${MAGPIE_DOCS_REPO:-https://github.com/apache/magpie.git}"
BRANCH="${MAGPIE_DOCS_BRANCH:-main}"
DEST="$(dirname "$0")/../src/content/docs"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Cloning $REPO@$BRANCH (sparse, docs/ + images/)"
git clone --depth 1 --branch "$BRANCH" --filter=blob:none --sparse "$REPO" "$TMP" >/dev/null 2>&1
(cd "$TMP" && git sparse-checkout set docs images >/dev/null)

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
find "$DEST" -name '*.md' -exec sed -i \
  -e 's|\.\./\.\./images/|/docs-assets/|g' \
  -e 's|\.\./images/|/docs-assets/|g' \
  -e 's|(images/|(/docs-assets/|g' \
  {} +

count=$(find "$DEST" -name '*.md' | wc -l)
echo "✓ Synced $count markdown files into $DEST"
