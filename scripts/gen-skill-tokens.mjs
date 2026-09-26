#!/usr/bin/env node
// Render the per-skill token table on the mode-economics page from the
// `measured_tokens:` stamps in each apache/magpie SKILL.md.
//
// apache/magpie used to commit this table into docs/mode-economics.md. Its
// shared header lines changed on every regeneration, so any two skill PRs
// conflicted on them (apache/magpie#1394). Each skill now carries its own
// count as a generated frontmatter line, and the page carries a marker this
// script replaces at build time. No tokenizer runs here: the numbers are the
// stamps apache/magpie's `skill-token-count --check` already verified.
//
// Usage: node gen-skill-tokens.mjs <skills-dir> <mode-economics.md>
//
// Invoked by scripts/sync-docs.sh after the docs are copied and before the
// link rewrite, so the table's `../skills/<name>/SKILL.md` links are rewritten
// exactly like any other link into the framework tree.

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The marker apache/magpie's docs/mode-economics.md carries in place of the table.
export const MARKER_RE = /<!--\s*SKILL TOKEN TABLE\b[\s\S]*?-->/;

// Read `measured_tokens:` from a SKILL.md's frontmatter; null when absent or malformed.
export function readMeasuredTokens(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  const frontmatter = end !== -1 ? text.slice(3, end) : text;
  for (const raw of frontmatter.split("\n")) {
    const match = /^measured_tokens:\s*([1-9][0-9]*)\s*$/.exec(raw.trim());
    if (match) return Number(match[1]);
  }
  return null;
}

// rows: [{ name, tokens }] sorted by name. Links match the old committed table,
// relative to docs/, so the site's link rewriter treats them the same way.
export function renderTable(rows) {
  const lines = [
    "Tokenizer: `cl100k_base` (pinned `tiktoken`). Each figure is the skill's own",
    "`measured_tokens:` stamp: the full file, frontmatter and comments included,",
    "excluding the stamp line itself.",
    "",
    "| Skill file | Measured tokens |",
    "|---|---:|",
  ];
  for (const { name, tokens } of rows) {
    const label = name.replaceAll("|", "&#124;");
    lines.push(`| [${label}](../skills/${encodeURI(name)}/SKILL.md) | ${tokens.toLocaleString("en-US")} |`);
  }
  return lines.join("\n");
}

// Replace the marker with the table. Returns the document unchanged when there
// is no marker (an older framework checkout that still commits its own table).
export function fillMarker(document, table) {
  return MARKER_RE.test(document) ? document.replace(MARKER_RE, () => table) : document;
}

export function collectRows(skillsDir) {
  const rows = [];
  const unstamped = [];
  for (const name of readdirSync(skillsDir).sort()) {
    const file = join(skillsDir, name, "SKILL.md");
    try {
      if (!statSync(join(skillsDir, name)).isDirectory() || !existsSync(file)) continue;
    } catch {
      continue;
    }
    const tokens = readMeasuredTokens(readFileSync(file, "utf8"));
    if (tokens === null) unstamped.push(name);
    else rows.push({ name, tokens });
  }
  return { rows, unstamped };
}

function main() {
  const [, , skillsDir, docPath] = process.argv;
  if (!skillsDir || !docPath) {
    console.error("usage: gen-skill-tokens.mjs <skills-dir> <mode-economics.md>");
    process.exit(1);
  }
  if (!existsSync(docPath)) {
    console.warn(`⚠ ${docPath} not found; skipping the skill token table`);
    return;
  }
  const document = readFileSync(docPath, "utf8");
  if (!MARKER_RE.test(document)) {
    console.warn("⚠ no SKILL TOKEN TABLE marker in mode-economics.md; leaving it as synced");
    return;
  }
  const { rows, unstamped } = collectRows(skillsDir);
  if (unstamped.length) {
    // apache/magpie's CI refuses an unstamped skill, so this only happens on a
    // branch checkout mid-change; render what is stamped rather than fail the build.
    console.warn(`⚠ ${unstamped.length} skill(s) carry no measured_tokens stamp: ${unstamped.join(", ")}`);
  }
  writeFileSync(docPath, fillMarker(document, renderTable(rows)));
  console.log(`✓ Rendered ${rows.length} skill token counts into ${docPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
