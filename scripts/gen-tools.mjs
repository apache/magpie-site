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

// --- taxonomy (two axes, per RFC-AI-0005) --------------------------------
// Skills carry `capability:*`; tools carry `contract:*` / `substrate:*`.
// Parse all three vocabularies from docs/labels-and-capabilities.md.
const labels = read(labelsDoc);
//  Skill axis:  | `capability:x` | definition |
const capabilities = {};
//  Tool axis:   | `contract:x`/`substrate:x` | kind | definition |
const contracts = {};
const substrates = {};
for (const line of labels.split("\n")) {
  const cap = line.match(/^\|\s*`capability:([a-z]+)`\s*\|\s*(.+?)\s*\|\s*$/);
  if (cap) {
    capabilities[cap[1]] = cap[2].trim();
    continue;
  }
  const tool = line.match(
    /^\|\s*`(contract|substrate):([a-z-]+)`\s*\|\s*[a-z]+\s*\|\s*(.+?)\s*\|\s*$/,
  );
  if (tool) {
    (tool[1] === "contract" ? contracts : substrates)[tool[2]] = tool[3].trim();
  }
}

// MCP servers a tool wraps, from the "MCP servers, classified by capability"
// table: | <server> | `<prefix>` | [`tools/<name>`](..) | <capability> | <org> |.
// An MCP is just a transport behind a capability contract — classify the
// wrapping tool, and badge it so the site can explain the relationship.
const mcpByTool = {};
for (const line of labels.split("\n")) {
  const m = line.match(
    /^\|\s*([^|]+?)\s*\|\s*`(mcp__[^`]+)`\s*\|\s*\[`tools\/([a-z0-9-]+)`\]/,
  );
  if (m) mcpByTool[m[3]] = { server: m[1].trim().replace(/`/g, ""), prefix: m[2].trim() };
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
  if (!m) return name;
  const h1 = m[1]
    .replace(/^Tool:\s*/i, "")
    .replace(/`/g, "")
    .trim();
  // Newer tool READMEs use a path-like H1 (e.g. `tools/github/`); fall back to
  // the directory name in that case so the card shows a clean title.
  if (/^tools\//.test(h1) || h1.includes("/")) return name;
  return h1;
}

// The tool `**Capability:**` line now carries contract:/substrate: labels.
function toolLabelsOf(md) {
  const m = md.match(/^\*\*Capability:\*\*\s*(.+?)\s*$/m);
  if (!m) return [];
  return [...m[1].matchAll(/(contract|substrate):([a-z-]+)/g)].map((x) => ({
    kind: x[1],
    name: x[2],
  }));
}
// Tools/skills/families can declare membership of an organization.
function organizationOf(md) {
  const m = md.match(/^\*\*Organization:\*\*\s*([A-Za-z0-9_-]+)/m);
  return m ? m[1] : null;
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
  const tlabels = toolLabelsOf(readme);
  tools.push({
    name,
    title: title(readme, name),
    description: firstParagraph(readme),
    labels: tlabels,
    kind: tlabels.some((l) => l.kind === "contract") ? "contract" : "substrate",
    organization: organizationOf(readme),
    mcp: mcpByTool[name] ?? null,
    hasCode,
    maturity: toolMaturity[name] ?? null,
    state: hasCode ? "implemented" : "adapter",
    docUrl: `https://github.com/apache/magpie/tree/main/tools/${name}`,
  });
}

// --- organization membership of skill families ---------------------------
// Each family's docs/<family>/README.md declares its scope with a marker
// line: `> **Scope — `organization: ASF` · 🪶 ASF-specific.**` (or
// `organization: independent`, or no marker for org-agnostic families).
// Derive the family→organization map (and the ASF subset for the oak leaf)
// from that metadata so the website badge stays data-driven.
const docsDir = join(root, "docs");
const orgFamilies = {};
if (isDir(docsDir)) {
  for (const fam of readdirSync(docsDir)) {
    const readme = join(docsDir, fam, "README.md");
    if (!existsSync(readme)) continue;
    const m = read(readme).match(
      /Scope\s*[—-]\s*`organization:\s*([A-Za-z0-9_-]+)`/i,
    );
    if (m) orgFamilies[fam] = m[1];
  }
}
const asfFamilies = Object.keys(orgFamilies)
  .filter((f) => orgFamilies[f] === "ASF")
  .sort();

// --- organizations -------------------------------------------------------
// Each organizations/<org>/organization.md carries a fenced `yaml` block:
//   organization_identity:
//     id: ASF
//     name: "Apache Software Foundation"
//     url: https://www.apache.org/
//     logo: https://www.apache.org/.../asf_logo.svg
const orgsDir = join(root, "organizations");
const organizations = [];
const cleanVal = (v) =>
  v
    .replace(/#.*$/, "") // strip trailing yaml comment
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
if (isDir(orgsDir)) {
  for (const id of readdirSync(orgsDir).sort()) {
    if (id === "_template") continue;
    const orgFile = join(orgsDir, id, "organization.md");
    if (!existsSync(orgFile)) continue;
    const body = read(orgFile);
    const ident = {};
    const block = body.match(/organization_identity:\s*\n([\s\S]*?)(\n```|\n#|\n\S)/);
    const src = block ? block[1] : "";
    for (const line of src.split("\n")) {
      const km = line.match(/^\s+(id|name|url|logo):\s*(.*)$/);
      if (!km) continue;
      const val = cleanVal(km[2]);
      ident[km[1]] = val === "null" || val === "" ? null : val;
    }
    organizations.push({
      id: ident.id || id,
      name: ident.name || id,
      url: ident.url || null,
      logo: ident.logo || null,
      tools: tools.filter((t) => t.organization === id).map((t) => t.name),
      families: Object.keys(orgFamilies)
        .filter((f) => orgFamilies[f] === id)
        .sort(),
    });
  }
}

// --- skills summary ------------------------------------------------------
let skillTotal = 0;
let apacheLicensed = 0;
const skillsByOrg = {};
if (isDir(skillsDir)) {
  for (const name of readdirSync(skillsDir)) {
    const sp = join(skillsDir, name, "SKILL.md");
    if (!existsSync(sp)) continue;
    skillTotal++;
    const fm = read(sp).split(/^---\s*$/m)[1] ?? "";
    if (/^license:\s*Apache-2\.0/m.test(fm)) apacheLicensed++;
    const om = fm.match(/^organization:\s*([A-Za-z0-9_-]+)/m);
    if (om) skillsByOrg[om[1]] = (skillsByOrg[om[1]] || 0) + 1;
  }
}

const out = {
  _comment:
    "GENERATED by scripts/gen-tools.mjs — do not edit by hand. Derives from apache/magpie tools/, spec-loop specs, skills/, docs/, and organizations/.",
  // Two-axis taxonomy (RFC-AI-0005)
  capabilities, // skill axis (capability:*)
  contracts, // tool axis — capability contracts (contract:*)
  substrates, // tool axis — framework substrate (substrate:*)
  tools,
  toolsTotal: tools.length,
  implementedTotal: tools.filter((t) => t.hasCode).length,
  contractsTotal: tools.filter((t) => t.kind === "contract").length,
  substratesTotal: tools.filter((t) => t.kind === "substrate").length,
  mcpTotal: tools.filter((t) => t.mcp).length,
  organizations,
  orgFamilies,
  asfFamilies,
  skills: {
    total: skillTotal,
    apacheLicensed,
    allApache: skillTotal > 0 && apacheLicensed === skillTotal,
    license: "Apache-2.0",
    byOrg: skillsByOrg,
  },
};

writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(
  `✓ tools → ${outPath}: ${tools.length} tools ` +
    `(${out.contractsTotal} contract, ${out.substratesTotal} substrate, ${out.implementedTotal} with code), ` +
    `${Object.keys(capabilities).length} skill-capabilities, ` +
    `${Object.keys(contracts).length} contracts, ${Object.keys(substrates).length} substrates, ` +
    `${organizations.length} orgs, ${skillTotal} skills`,
);
