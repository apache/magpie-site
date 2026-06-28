#!/usr/bin/env node
// Rewrite GitHub-relative `.md` links in the synced docs so they work on the
// rendered site. The markdown is authored for apache/magpie's repo layout
// (e.g. `modes.md`, `setup/README.md`, `../MISSION.md`), which does not match
// the site: routes are lowercased and extensionless, and files above docs/
// (README, MISSION, …) are not published here at all.
//
//   link resolving inside docs/  -> site route   (<base>/docs/<slug>)
//   link resolving outside docs/ -> GitHub source (blob/main/<path>)
//
// Usage: node scripts/rewrite-doc-links.mjs <docs-dir> [base]
import fs from "node:fs";
import path from "node:path";

const GITHUB_BLOB = "https://github.com/apache/magpie/blob/main";
const docsDir = process.argv[2];
const base = (process.argv[3] || process.env.SITE_BASE || "/").replace(/\/$/, "");

if (!docsDir) {
  console.error("usage: rewrite-doc-links.mjs <docs-dir> [base]");
  process.exit(1);
}

function rewriteTarget(target, currentDir) {
  if (!target || /^(https?:|mailto:|tel:|#|\/)/i.test(target)) return null;
  const hashAt = target.indexOf("#");
  const rawPath = hashAt === -1 ? target : target.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : target.slice(hashAt);
  if (!/\.md$/i.test(rawPath)) return null;
  const repoPath = path.posix.normalize(
    path.posix.join("docs", currentDir, rawPath),
  );
  if (repoPath.startsWith("docs/")) {
    const slug = repoPath
      .slice("docs/".length)
      .replace(/\.md$/i, "")
      .toLowerCase();
    return `${base}/docs/${slug}${hash}`;
  }
  return `${GITHUB_BLOB}/${repoPath}${hash}`;
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".md")) rewriteFile(full);
  }
}

let changed = 0;
function rewriteFile(file) {
  const rel = path.relative(docsDir, file).split(path.sep).join("/");
  const currentDir = path.posix.dirname(rel) === "." ? "" : path.posix.dirname(rel);
  const src = fs.readFileSync(file, "utf8");
  // inline markdown links: ](target) — targets here never contain spaces/parens
  const out = src.replace(/\]\(([^)\s]+)\)/g, (m, target) => {
    const next = rewriteTarget(target, currentDir);
    return next ? `](${next})` : m;
  });
  if (out !== src) {
    fs.writeFileSync(file, out);
    changed += 1;
  }
}

walk(docsDir);
console.log(`✓ rewrote internal .md links in ${changed} doc file(s)`);
