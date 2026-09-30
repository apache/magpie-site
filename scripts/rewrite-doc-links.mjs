#!/usr/bin/env node
// Rewrite GitHub-relative `.md` links in the synced docs so they work on the
// rendered site. The markdown is authored for apache/magpie's repo layout
// (e.g. `modes.md`, `setup/README.md`, `../MISSION.md`), which does not match
// the site: routes are lowercased and extensionless, and files above docs/
// (README, MISSION, …) are not published here at all.
//
//   link resolving inside docs/  -> site route   (<base>/docs/<slug>)
//   link resolving outside docs/ -> GitHub source (its real path in <magpie-root>)
//
// (The site's documentation lives under the /docs route; per-tool READMEs are
// published beneath it at /docs/tools/<name>.)
//
// Usage: node scripts/rewrite-doc-links.mjs <magpie-root> <docs-dir> [base]
import fs from "node:fs";
import path from "node:path";
import { githubSourceUrl } from "./github-source.mjs";

const root = process.argv[2];
const docsDir = process.argv[3];
const base = (process.argv[4] || process.env.SITE_BASE || "/").replace(/\/$/, "");

if (!root || !docsDir) {
  console.error("usage: rewrite-doc-links.mjs <magpie-root> <docs-dir> [base]");
  process.exit(1);
}

function rewriteTarget(target, currentDir) {
  if (!target || /^(https?:|mailto:|tel:|#|\/)/i.test(target)) return null;
  const hashAt = target.indexOf("#");
  const rawPath = hashAt === -1 ? target : target.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : target.slice(hashAt);
  if (!rawPath) return null;
  const repoPath = path.posix.normalize(
    path.posix.join("docs", currentDir, rawPath),
  );
  // A `.md` page that resolves inside docs/ becomes an on-site route; every
  // other repo-relative target (a doc directory, or a file/dir above docs/ such
  // as ../../skills/, ../tools/vcs/, ../../MISSION.md) has no page here, so it
  // points at its GitHub source.
  if (/\.md$/i.test(rawPath) && repoPath.startsWith("docs/")) {
    const slug = repoPath
      .slice("docs/".length)
      .replace(/\.md$/i, "")
      .toLowerCase();
    // The retired overview's headings do not exist on the docs landing page.
    if (slug === "index") return `${base}/docs`;
    return `${base}/docs/${slug}${hash}`;
  }
  return githubSourceUrl(root, repoPath, hash);
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
