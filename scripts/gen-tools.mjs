#!/usr/bin/env node
// Generate a Tools & Capabilities summary from an apache/magpie checkout.
//
// Mirrors scripts/gen-skill-counts.mjs: derives the website's /architecture
// page data from the actual framework repo so it never drifts. Invoked by
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
  if (m)
    mcpByTool[m[3]] = {
      server: m[1].trim().replace(/`/g, ""),
      prefix: m[2].trim(),
    };
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
// Vendor-neutrality metadata every contract tool declares (RFC magpie-site#17):
//   **Kind:** interface | implementation
//   **Vendor:** <backend identity> | agnostic
// These feed the deterministic vendor-neutrality score below.
function kindOf(md) {
  const m = md.match(/^\*\*Kind:\*\*\s*(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}
function vendorOf(md) {
  const m = md.match(/^\*\*Vendor:\*\*\s*(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}
// Substrate tools declare **Harness:** — the agent harness they integrate with
// (or `agnostic`) — for the LLM-integration (agent-harness) neutrality axis.
function harnessOf(md) {
  const m = md.match(/^\*\*Harness:\*\*\s*(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}
// MCP backing a tool wraps, from its own README marker (the per-tool source
// of truth — see tools/AGENTS.md):
//   **MCP:** <server> (mcp__<prefix>__*)
// Returns { server, prefix } (same shape as the labels-table fallback below).
function mcpOf(md) {
  const m = md.match(/^\*\*MCP:\*\*\s*(.+?)\s*\((mcp__[^)]+)\)\s*$/m);
  return m ? { server: m[1].trim(), prefix: m[2].trim() } : null;
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
    // Vendor-neutrality axis (only meaningful for contract tools): whether this
    // is a pure interface or a concrete backend, and the backend's identity.
    vendorKind: kindOf(readme),
    vendor: vendorOf(readme),
    harness: harnessOf(readme),
    organization: organizationOf(readme),
    // Prefer the per-tool README **MCP:** marker (source of truth); fall back
    // to the labels-and-capabilities MCP table for any tool not yet migrated.
    mcp: mcpOf(readme) ?? mcpByTool[name] ?? null,
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
    const block = body.match(
      /organization_identity:\s*\n([\s\S]*?)(\n```|\n#|\n\S)/,
    );
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
// Collect each skill's frontmatter + body once; the body is scanned below for
// the concrete backends a skill invokes (vendor-neutrality per-skill verdict).
const skillRecords = []; // { name, org, body }
let skillTotal = 0;
let apacheLicensed = 0;
const skillsByOrg = {};
if (isDir(skillsDir)) {
  for (const name of readdirSync(skillsDir).sort()) {
    const sp = join(skillsDir, name, "SKILL.md");
    if (!existsSync(sp)) continue;
    skillTotal++;
    const text = read(sp);
    const fm = text.split(/^---\s*$/m)[1] ?? "";
    if (/^license:\s*Apache-2\.0/m.test(fm)) apacheLicensed++;
    const om = fm.match(/^organization:\s*([A-Za-z0-9_-]+)/m);
    if (om) skillsByOrg[om[1]] = (skillsByOrg[om[1]] || 0) + 1;
    // Body = everything after the second `---` (matches the scorer's split).
    const parts = text.split(/^---\s*$/m);
    const body = parts.length >= 3 ? parts.slice(2).join("---") : text;
    skillRecords.push({ name, org: om ? om[1] : "agnostic", body });
  }
}

// --- vendor-neutrality score (deterministic, mirrors magpie's
// tools/vendor-neutrality-score) -----------------------------------------
// Measured per capability *contract*. Substrate tools are Magpie's own
// machinery and never count. Each contract belongs to one of three classes
// (the only hand-maintained policy, kept in lockstep with the framework tool):
//   vendor-backed → GREEN once ≥ MIN_VENDORS distinct backend vendors ship it
//   agnostic      → GREEN by construction (one spec serves every backend)
//   single-org    → GREEN by exemption (bound to one org's data model)
const MIN_VENDORS = 2;
const VENDOR_BACKED = "vendor-backed";
const AGNOSTIC = "agnostic";
const SINGLE_ORG = "single-org";
// [contract, class] in the canonical order the framework tool emits.
// Neutrality CLASS per contract (the only hand-maintained policy). Everything
// defaults to vendor-backed; only the agnostic / single-org exceptions are
// listed. The contract *set* is derived from the taxonomy doc (`contracts`,
// parsed from docs/labels-and-capabilities.md) rather than hard-coded, so a
// renamed or newly-added contract (e.g. mail-draft → mail-create) is scored
// automatically instead of being silently dropped.
const CONTRACT_CLASS = {
  "contract:report-relay": AGNOSTIC,
  "contract:scan-format": AGNOSTIC,
  "contract:project-metadata": SINGLE_ORG,
};
const CONTRACT_POLICY = Object.keys(contracts).map((c) => [
  `contract:${c}`,
  CONTRACT_CLASS[`contract:${c}`] ?? VENDOR_BACKED,
]);
// High-confidence usage signals (MCP tool names, CLI verbs, hostnames) that a
// skill actually *invokes* a contract's backend — not mere prose mentions.
// Agnostic contracts are omitted (they never change a verdict).
const CONTRACT_USAGE_TOKENS = {
  "contract:tracker": [
    /mcp__github__/,
    /\bgh (?:issue|api|search|run|workflow|release|label)\b/,
    /\bJIRA\b/,
  ],
  // `gh pr` is the change-request contract, not tracker (Jira has no PR model).
  "contract:change-request": [/\bgh pr\b/],
  "contract:source-control": [
    /\bgit (?:commit|push|checkout|branch|rebase|merge|switch|worktree)\b/,
    /\bsvn (?:checkout|commit|update|cat|list|mkdir|import|move|delete|switch|copy)\b/,
  ],
  "contract:mail-archive": [
    /mcp__ponymail__/,
    /mcp__claude_ai_Gmail__(?:search_threads|get_thread|list_)/,
  ],
  "contract:mail-create": [
    /mcp__claude_ai_Gmail__create_draft/,
    /\bcreate_draft\b/,
  ],
  "contract:cve-authority": [/\bVulnogram\b/, /\bcveawg\b/, /\bcve\.org\b/],
  "contract:project-metadata": [
    /mcp__apache-projects__/,
    /\bprojects\.apache\.org\b/,
  ],
};

const contractTools = tools.filter((t) =>
  t.labels.some((l) => l.kind === "contract"),
);
const providersOf = (contract) =>
  contractTools.filter((t) =>
    t.labels.some(
      (l) => l.kind === "contract" && `contract:${l.name}` === contract,
    ),
  );

const vnContracts = CONTRACT_POLICY.map(([contract, klass]) => {
  const providers = providersOf(contract);
  const interfaces = providers
    .filter((t) => t.vendorKind === "interface")
    .map((t) => t.name)
    .sort();
  const implementations = providers
    .filter((t) => t.vendorKind === "implementation")
    .map((t) => ({ tool: t.name, vendor: t.vendor }))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));
  const vendors = [...new Set(implementations.map((i) => i.vendor))].sort();
  let green = false;
  let basis = "";
  if (klass === AGNOSTIC) {
    green = true;
    basis = "vendor-neutral by construction — one spec serves every backend";
  } else if (klass === SINGLE_ORG) {
    green = true;
    const org = vendors.join(", ") || "a single organisation";
    basis = `single-organisation capability (${org}); no vendor choice to make`;
  } else {
    const n = vendors.length;
    green = n >= MIN_VENDORS;
    basis = green
      ? `${n} backend vendors: ${vendors.join(", ")}`
      : n === 0
        ? "no backend implemented yet"
        : `only ${n} backend vendor (${vendors.join(", ")}); needs ${MIN_VENDORS - n} more`;
  }
  return {
    contract,
    class: klass,
    green,
    basis,
    vendors,
    interfaces,
    implementations,
  };
});

const greenByContract = Object.fromEntries(
  vnContracts.map((r) => [r.contract, r.green]),
);
// A not-green vendor-backed contract with exactly one backend is a real
// lock-in; name the sole vendor so the report can attribute it.
const soleVendor = {};
for (const r of vnContracts) {
  if (r.class === VENDOR_BACKED && !r.green && r.vendors.length === 1) {
    soleVendor[r.contract] = r.vendors[0];
  }
}
const usagePatterns = Object.entries(CONTRACT_USAGE_TOKENS);
const vnSkills = skillRecords.map(({ name, org, body }) => {
  const used = usagePatterns
    .filter(([, regexes]) => regexes.some((re) => re.test(body)))
    .map(([c]) => c)
    .sort();
  const coupled = used
    .filter((c) => !greenByContract[c] && c in soleVendor)
    .map((c) => ({ vendor: soleVendor[c], contract: c }))
    .sort(
      (a, b) =>
        a.vendor.localeCompare(b.vendor) ||
        a.contract.localeCompare(b.contract),
    );
  const verdict =
    used.length === 0
      ? "capability-pure"
      : coupled.length
        ? "vendor-coupled"
        : "portable";
  return {
    skill: name,
    organization: org,
    contractsUsed: used,
    verdict,
    coupled,
  };
});

const vnByVerdict = { "capability-pure": 0, portable: 0, "vendor-coupled": 0 };
const vnByOrg = {};
for (const s of vnSkills) {
  vnByVerdict[s.verdict] = (vnByVerdict[s.verdict] || 0) + 1;
  vnByOrg[s.organization] = (vnByOrg[s.organization] || 0) + 1;
}
const vnGreen = vnContracts.filter((r) => r.green).length;
const vnTotal = vnContracts.length;

// --- LLM-integration axis (mirrors magpie's vendor-neutrality-score) --------
// Part A — agent harness: substrate tools declare **Harness:** (a harness or
// `agnostic`); a tool is harness-neutral when agnostic or supporting ≥2 harnesses.
// Emitted only when substrate tools declare the field (i.e. once the upstream
// framework carries it), so a resync against an older magpie stays valid.
const AGNOSTIC_HARNESS = "agnostic";
const substrateTools = tools.filter(
  (t) =>
    t.labels.some((l) => l.kind === "substrate") &&
    !t.labels.some((l) => l.kind === "contract"),
);
const vnHarness = substrateTools
  .filter((t) => t.harness)
  .map((t) => {
    const substrates = t.labels
      .filter((l) => l.kind === "substrate")
      .map((l) => `substrate:${l.name}`);
    let harnesses = [];
    let verdict;
    if (t.harness.toLowerCase() === AGNOSTIC_HARNESS) {
      verdict = "agnostic";
    } else {
      harnesses = [
        ...new Set(
          t.harness
            .split(",")
            .map((h) => h.trim())
            .filter(Boolean),
        ),
      ].sort();
      verdict = harnesses.length >= MIN_VENDORS ? "portable" : "coupled";
    }
    return { tool: t.name, substrates, harnesses, verdict };
  })
  .sort((a, b) => a.tool.localeCompare(b.tool));
const harnessMatrix = {};
for (const r of vnHarness) {
  if (r.verdict === "agnostic")
    (harnessMatrix[AGNOSTIC_HARNESS] ??= []).push(r.tool);
  else for (const h of r.harnesses) (harnessMatrix[h] ??= []).push(r.tool);
}
for (const h of Object.keys(harnessMatrix)) harnessMatrix[h].sort();
const harnessNeutral = vnHarness.filter((r) => r.verdict !== "coupled").length;

// Part B — approved-LLM endpoint classes from tools/privacy-llm/models.md.
function parseApprovedLlms() {
  const md = read(join(toolsDir, "privacy-llm", "models.md"));
  const heading = "## The default-approved entries";
  if (!md.includes(heading)) return [];
  const section = md.split(heading)[1].split("\n## ")[0];
  const rows = [];
  for (const line of section.split("\n")) {
    const l = line.trim();
    if (!l.startsWith("|") || l.startsWith("|--") || /\|\s*Class\s*\|/.test(l))
      continue;
    const cells = l
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.length < 3) continue;
    const name = cells[0].replace(/\*\*/g, "").replace(/`/g, "").trim();
    if (name) rows.push({ class: name, examples: cells[2].trim() });
  }
  return rows;
}
const vnLlm = parseApprovedLlms();

const vendorNeutrality = {
  minVendors: MIN_VENDORS,
  overall: {
    green: vnGreen,
    total: vnTotal,
    percent: vnTotal ? Math.round((100 * vnGreen) / vnTotal) : 0,
  },
  contracts: vnContracts,
  ...(vnHarness.length > 0 && {
    harness: {
      neutral: harnessNeutral,
      total: vnHarness.length,
      percent: vnHarness.length
        ? Math.round((100 * harnessNeutral) / vnHarness.length)
        : 0,
      tools: vnHarness,
      matrix: harnessMatrix,
    },
  }),
  ...(vnLlm.length > 0 && {
    llm: {
      defaultApproved: vnLlm,
      optIn:
        "adopter-declared in <project-config>/privacy-llm.md (no fixed list)",
    },
  }),
  skills: {
    total: vnSkills.length,
    neutral: vnByVerdict["capability-pure"] + vnByVerdict.portable,
    byVerdict: vnByVerdict,
    byOrg: vnByOrg,
    coupled: vnSkills
      .filter((s) => s.verdict === "vendor-coupled")
      .map((s) => ({ skill: s.skill, coupled: s.coupled })),
    // Full per-skill assessment so the site can list the skills in each bucket.
    // Sorted by name; `contractsUsed` explains a portable/coupled verdict.
    list: [...vnSkills]
      .sort((a, b) => a.skill.localeCompare(b.skill))
      .map((s) => ({
        skill: s.skill,
        verdict: s.verdict,
        organization: s.organization,
        contractsUsed: s.contractsUsed,
        coupled: s.coupled,
      })),
  },
};

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
  vendorNeutrality,
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
    `${organizations.length} orgs, ${skillTotal} skills, ` +
    `vendor-neutrality ${vendorNeutrality.overall.green}/${vendorNeutrality.overall.total} (${vendorNeutrality.overall.percent}%)`,
);
