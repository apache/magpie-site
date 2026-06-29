#!/usr/bin/env node
// Publish each apache/magpie tool README as an on-site docs page so the website
// can link to tools internally (e.g. /docs/tools/github) instead of bouncing to
// GitHub. One page per tool: tools/<name>/README.md → <docs>/tools/<name>/readme.md.
//
// Tool READMEs are authored for the repo's tools/<name>/ layout, so their
// relative `.md` / directory links (operations.md, ../../skills/…, tool.md) do
// not resolve on the site — those deep files are not published here. We rewrite
// every relative link in the body to an absolute GitHub-source URL at the tool's
// real repo path, so the on-site overview page has no broken links while its
// deep references point at the source. (The generic docs link-rewriter then
// leaves these absolute URLs untouched.)
//
// Usage: node sync-tool-docs.mjs <magpie-root> <docs-dir>

import {
  readdirSync,
  statSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import path from "node:path";

const [, , root, docsDir] = process.argv;
if (!root || !docsDir) {
  console.error("usage: sync-tool-docs.mjs <magpie-root> <docs-dir>");
  process.exit(1);
}

const toolsDir = path.join(root, "tools");
const GITHUB_BLOB = "https://github.com/apache/magpie/blob/main";
const GITHUB_TREE = "https://github.com/apache/magpie/tree/main";

if (!existsSync(toolsDir)) {
  console.warn(`⚠ no tools/ under ${root}; skipping tool-doc sync`);
  process.exit(0);
}

function rewriteLinks(md, toolName) {
  // ](target) — repo-relative links resolved against tools/<name>/, emitted as
  // absolute GitHub URLs. Leaves http(s)/mailto/anchor/absolute links alone.
  return md.replace(/\]\(([^)\s]+)\)/g, (m, target) => {
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(target)) return m;
    const hashAt = target.indexOf("#");
    const rawPath = hashAt === -1 ? target : target.slice(0, hashAt);
    const hash = hashAt === -1 ? "" : target.slice(hashAt);
    const repoPath = path.posix.normalize(
      path.posix.join("tools", toolName, rawPath),
    );
    const blob = /\.[a-z0-9]+$/i.test(rawPath) ? GITHUB_BLOB : GITHUB_TREE;
    return `](${blob}/${repoPath}${hash})`;
  });
}

let count = 0;
for (const name of readdirSync(toolsDir).sort()) {
  const dir = path.join(toolsDir, name);
  const readme = path.join(dir, "README.md");
  try {
    if (!statSync(dir).isDirectory() || !existsSync(readme)) continue;
  } catch {
    continue;
  }
  const out = path.join(docsDir, "tools", name);
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, "readme.md"),
    rewriteLinks(readFileSync(readme, "utf8"), name),
  );
  count += 1;
}
console.log(`✓ published ${count} tool README(s) → ${docsDir}/tools/<name>/readme.md`);
