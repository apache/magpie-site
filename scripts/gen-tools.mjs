#!/usr/bin/env node
// Generate a Tools & Capabilities summary from an apache/magpie checkout.
//
// Mirrors scripts/gen-skill-counts.mjs: derives the website's /tools page data
// from the actual framework repo so it never drifts. Invoked by
// scripts/sync-docs.sh after the framework is checked out.
//
// For each tool under tools/<name>/ it captures:
//   - title + one-line description (from the README)
//   - declared capabilities (the `**Capability:** capability:x + capability:y`
//     line every tool README carries)
//   - implementation state, combining two signals:
//       * hasCode  — a real implementation is present (pyproject.toml + src/
//                    + tests/), an objective fact
//       * maturity — the most mature spec-loop status (stable > experimental >
//                    proposed) among specs that reference the tool
//
// It also reads the capability taxonomy from docs/labels-and-capabilities.md
// and a small skills summary (count + whether every skill is Apache-2.0
// licensed, used to badge the skill families with the ASF mark).
//
// Output is deterministic (no timestamps) so the committed JSON only changes
// when the derived data changes.
//
// Usage: node gen-tools.mjs <magpie-root> <out-json>

import {
  readdirSync,
  statSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const [, , root, outPath] = process.argv;
if (!root || !outPath) {
  console.error("usage: gen-tools.mjs <magpie-root> <out-json>");
  process.exit(1);
}

const toolsDir = join(root, "tools");
const specsDir = join(root, "tools", "spec-loop", "specs");
const skillsDir = join(root, "skills");
const labelsDoc = join(root, "docs", "labels-and-capabilities.md");

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

// --- capability taxonomy -------------------------------------------------
// Parse the `| `capability:x` | definition |` table rows from the labels doc.
const capabilities = {};
for (const line of read(labelsDoc).split("\n")) {
  const m = line.match(/^\|\s*`capability:([a-z]+)`\s*\|\s*(.+?)\s*\|\s*$/);
  if (m) capabilities[m[1]] = m[2].trim();
}

// --- spec maturity per tool ---------------------------------------------
// status precedence (higher = more mature / more done)
const RANK = { off: -1, proposed: 0, experimental: 1, stable: 2 };
const toolMaturity = {}; // tool -> best status string
if (isDir(specsDir)) {
  for (const f of readdirSync(specsDir).filter((f) => f.endsWith(".md"))) {
    const body = read(join(specsDir, f));
    const sm = body.match(/^status:\s*([a-z]+)/m);
    const status = sm && sm[1];
    if (!status || !(status in RANK)) continue;
    const refs = new Set(
      [...body.matchAll(/tools\/([a-z0-9-]+)/g)].map((m) => m[1]),
    );
    for (const t of refs) {
      if (
        toolMaturity[t] === undefined ||
        RANK[status] > RANK[toolMaturity[t]]
      ) {
        toolMaturity[t] = status;
      }
    }
  }
}

// --- per-tool description + capabilities ---------------------------------
function firstParagraph(md) {
  // strip HTML comments (doctoc TOC, SPDX header) and leading blank lines
  const cleaned = md.replace(/<!--[\s\S]*?-->/g, "");
  const lines = cleaned.split("\n");
  let i = 0;
  // skip to the first H1
  while (i < lines.length && !/^#\s/.test(lines[i])) i++;
  if (i < lines.length) i++; // move past the H1
  // skip blanks and metadata lines (e.g. **Capability:** ...) to the prose
  const buf = [];
  for (; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) {
      if (buf.length) break;
      continue;
    }
    if (/^\*\*[A-Za-z]/.test(l)) continue; // **Capability:** etc.
    if (/^#{1,6}\s/.test(l)) {
      if (buf.length) break;
      continue;
    }
    if (/^[|>-]/.test(l)) {
      if (buf.length) break;
      continue;
    }
    buf.push(l);
  }
  let text = buf
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // unlink markdown links
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > 240) text = text.slice(0, 237).replace(/\s\S*$/, "") + "…";
  return text;
}

function title(md, name) {
  const cleaned = md.replace(/<!--[\s\S]*?-->/g, "");
  const m = cleaned.match(/^#\s+(.+?)\s*$/m);
  if (m) return m[1].replace(/^Tool:\s*/i, "").trim();
  return name;
}

function capabilitiesOf(md) {
  const m = md.match(/^\*\*Capability:\*\*\s*(.+?)\s*$/m);
  if (!m) return [];
  return [...m[1].matchAll(/capability:([a-z]+)/g)].map((x) => x[1]);
}

const tools = [];
for (const name of readdirSync(toolsDir).sort()) {
  const dir = join(toolsDir, name);
  if (!isDir(dir)) continue;
  const readme = read(join(dir, "README.md"));
  if (!readme) continue;
  const hasCode =
    existsSync(join(dir, "pyproject.toml")) &&
    isDir(join(dir, "src")) &&
    isDir(join(dir, "tests"));
  tools.push({
    name,
    title: title(readme, name),
    description: firstParagraph(readme),
    capabilities: capabilitiesOf(readme),
    hasCode,
    maturity: toolMaturity[name] ?? null,
    // objective, human-readable state combining both signals
    state: hasCode ? "implemented" : "adapter",
    docUrl: `https://github.com/apache/magpie/tree/main/tools/${name}`,
  });
}

// --- ASF-specific families ----------------------------------------------
// Each skill family's docs/<family>/README.md declares its scope with a
// marker line: `> **Scope — `asf: true` · 🪶 ASF-specific.**` (or `asf: false`).
// Derive the set of ASF-specific families from that metadata so the website's
// oak-leaf badge is data-driven, not hardcoded.
const docsDir = join(root, "docs");
const asfFamilies = [];
if (isDir(docsDir)) {
  for (const fam of readdirSync(docsDir)) {
    const readme = join(docsDir, fam, "README.md");
    if (!existsSync(readme)) continue;
    const m = read(readme).match(/Scope\s*[—-]\s*`asf:\s*(true|false)`/i);
    if (m && m[1].toLowerCase() === "true") asfFamilies.push(fam);
  }
  asfFamilies.sort();
}

// --- skills summary (for the ASF mark on skill families) -----------------
let skillTotal = 0;
let apacheLicensed = 0;
if (isDir(skillsDir)) {
  for (const name of readdirSync(skillsDir)) {
    const sp = join(skillsDir, name, "SKILL.md");
    if (!existsSync(sp)) continue;
    skillTotal++;
    const fm = read(sp).split(/^---\s*$/m)[1] ?? "";
    if (/^license:\s*Apache-2\.0/m.test(fm)) apacheLicensed++;
  }
}

const out = {
  _comment:
    "GENERATED by scripts/gen-tools.mjs — do not edit by hand. Derives from apache/magpie tools/, spec-loop specs, and skills/.",
  capabilities,
  tools,
  toolsTotal: tools.length,
  implementedTotal: tools.filter((t) => t.hasCode).length,
  asfFamilies,
  skills: {
    total: skillTotal,
    apacheLicensed,
    allApache: skillTotal > 0 && apacheLicensed === skillTotal,
    license: "Apache-2.0",
  },
};

writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(
  `✓ tools → ${outPath}: ${tools.length} tools (${out.implementedTotal} with code), ` +
    `${Object.keys(capabilities).length} capabilities, ${skillTotal} skills, ` +
    `ASF families: ${asfFamilies.join(", ") || "(none)"}`,
);
