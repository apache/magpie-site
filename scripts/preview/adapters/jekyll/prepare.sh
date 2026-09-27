#!/bin/sh
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements; and to You under the Apache License,
# Version 2.0. See http://www.apache.org/licenses/LICENSE-2.0
#
# Install the source-annotation plugin into a Jekyll site for a PREVIEW build.
# Run it in the preview build only, never before the production build: the
# plugin stamps every page with data-magpie-src, which must not ship.
#
# Usage: prepare.sh <jekyll site source directory>
set -eu

site="${1:?usage: prepare.sh <jekyll site source directory>}"

config=""
for c in "$site/_config.yml" "$site/_config.yaml"; do
  if [ -f "$c" ]; then config="$c"; break; fi
done
if [ -z "$config" ]; then
  echo "prepare.sh: no _config.yml in $site" >&2
  exit 1
fi

# Safe mode, which the github-pages gem forces, ignores _plugins entirely. The
# build would succeed with nothing stamped, so refuse rather than pretend.
if grep -Eq '^[[:space:]]*safe:[[:space:]]*true' "$config"; then
  echo "prepare.sh: $config sets safe: true, which ignores _plugins" >&2
  exit 1
fi

plugins_dir="$(sed -n 's/^plugins_dir:[[:space:]]*["'\'']*\([^"'\'' ]*\).*/\1/p' "$config" | head -n 1)"
plugins_dir="${plugins_dir:-_plugins}"

mkdir -p "$site/$plugins_dir"
cp "$(dirname "$0")/magpie_src.rb" "$site/$plugins_dir/magpie_src.rb"
echo "prepare.sh: installed magpie_src.rb into $site/$plugins_dir"
