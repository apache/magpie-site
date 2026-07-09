// Shared view-model for the tools/organizations/vendor data rendered by both
// the Architecture page and the dedicated Tools page. Both derive from the same
// generated src/data/tools.json, so computing this once here keeps the two
// pages in lockstep instead of duplicating ~100 lines of derivations.
import toolsData from "../data/tools.json";

export type Label = { kind: "contract" | "substrate"; name: string };
export type Tool = {
  name: string;
  title: string;
  description: string;
  labels: Label[];
  kind: string;
  vendor: string | null;
  vendorKind: string | null;
  organization: string | null;
  mcp: { server: string; prefix: string } | null;
  hasCode: boolean;
  maturity: string | null;
  state: string;
  docUrl: string;
};
export type VendorNeutrality = {
  minVendors: number;
  overall: { green: number; total: number; percent: number };
  contracts: {
    contract: string;
    class: string;
    green: boolean;
    basis: string;
    vendors: string[];
    interfaces: string[];
    implementations: { tool: string; vendor: string }[];
  }[];
  skills: {
    total: number;
    neutral: number;
    byVerdict: Record<string, number>;
    byOrg: Record<string, number>;
    coupled: { skill: string; coupled: { vendor: string; contract: string }[] }[];
    list: {
      skill: string;
      verdict: string;
      organization: string;
      contractsUsed: string[];
      coupled: { vendor: string; contract: string }[];
    }[];
  };
  harness?: {
    neutral: number;
    total: number;
    percent: number;
    tools: { tool: string; substrates: string[]; harnesses: string[]; verdict: string }[];
    matrix: Record<string, string[]>;
  };
  llm?: {
    defaultApproved: { class: string; examples: string }[];
    optIn: string;
  };
};
export type Org = {
  id: string;
  name: string;
  url: string | null;
  logo: string | null;
  tools: string[];
  families: string[];
};

export const data = toolsData as {
  capabilities: Record<string, string>;
  contracts: Record<string, string>;
  substrates: Record<string, string>;
  tools: Tool[];
  toolsTotal: number;
  implementedTotal: number;
  contractsTotal: number;
  substratesTotal: number;
  mcpTotal: number;
  organizations: Org[];
  vendorNeutrality: VendorNeutrality;
  skills: { total: number; byOrg: Record<string, number>; license: string };
};

const CAP_ORDER = [
  "triage", "review", "fix", "intake", "reconciliation",
  "resolve", "reassess", "stats", "platform", "authoring",
];

/**
 * Build the tools/orgs/vendor view-model. `base` is the site base URL (needed
 * for the bundled logo asset paths), so this is a factory rather than a set of
 * module constants.
 */
export function buildToolsView(base: string) {
  const skillCaps = CAP_ORDER.filter((c) => c in data.capabilities).map((c) => ({
    key: c,
    def: data.capabilities[c],
  }));

  const contractList = Object.keys(data.contracts).map((c) => ({
    key: c,
    def: data.contracts[c],
    count: data.tools.filter((t) => t.labels.some((l) => l.kind === "contract" && l.name === c)).length,
  }));
  const substrateList = Object.keys(data.substrates).map((s) => ({
    key: s,
    def: data.substrates[s],
    count: data.tools.filter((t) => t.labels.some((l) => l.kind === "substrate" && l.name === s)).length,
  }));

  const tools = [...data.tools].sort((a, b) => a.name.localeCompare(b.name));
  const orgById = Object.fromEntries(data.organizations.map((o) => [o.id, o]));

  // Organizations with any presence — skills, org-specific tools, or families.
  const visibleOrgs = data.organizations.filter(
    (o) =>
      (data.skills.byOrg[o.id] ?? 0) > 0 ||
      o.tools.length > 0 ||
      o.families.length > 0,
  );

  // Organization filter dimension + an "agnostic" bucket for tools with no org.
  const AGNOSTIC = "__agnostic";
  const orgCounts: Record<string, number> = {};
  for (const t of tools) {
    const k = t.organization ?? AGNOSTIC;
    orgCounts[k] = (orgCounts[k] ?? 0) + 1;
  }
  const orgChips = Object.keys(orgCounts)
    .filter((k) => k !== AGNOSTIC)
    .sort()
    .map((id) => ({
      id,
      label: orgById[id]?.name ?? id,
      // ASF is shown as its oak-leaf mark, never the Apache feather.
      logo: (id === "ASF" ? `${base}/vendor-logos/oak.svg` : orgById[id]?.logo) ?? null,
      count: orgCounts[id],
    }));
  const agnosticCount = orgCounts[AGNOSTIC] ?? 0;

  // label → definition, for the filter explanation.
  const labelDefs: Record<string, string> = {};
  for (const [k, v] of Object.entries(data.contracts)) labelDefs[`contract:${k}`] = v;
  for (const [k, v] of Object.entries(data.substrates)) labelDefs[`substrate:${k}`] = v;

  // Backend-vendor identity → bundled brand logo (presentation, not framework
  // fact). Vendors with no recognizable mark fall back to their name.
  const VENDOR_LOGOS: Record<string, string> = {
    GitHub: `${base}/vendor-logos/github.svg`,
    Git: `${base}/vendor-logos/git.svg`,
    Subversion: `${base}/vendor-logos/subversion.svg`,
    Atlassian: `${base}/vendor-logos/atlassian.svg`,
    Google: `${base}/vendor-logos/google.svg`,
    PonyMail: `${base}/vendor-logos/oak.svg`,
    ASF: `${base}/vendor-logos/oak.svg`,
  };
  const vendorLogo = (v: string | null) => (v ? (VENDOR_LOGOS[v] ?? null) : null);
  const OAK_LOGO = `${base}/vendor-logos/oak.svg`;
  const orgLogoOf = (o: { id: string; logo: string | null } | null | undefined) =>
    o ? (o.id === "ASF" ? OAK_LOGO : o.logo) : null;

  // Distinct backend vendors (implementation tools only) → tool count.
  const vendorCounts: Record<string, number> = {};
  for (const t of tools) {
    if (t.vendorKind === "implementation" && t.vendor && t.vendor !== "agnostic") {
      vendorCounts[t.vendor] = (vendorCounts[t.vendor] ?? 0) + 1;
    }
  }
  const vendorChips = Object.keys(vendorCounts)
    .sort()
    .map((v) => ({ vendor: v, logo: vendorLogo(v), count: vendorCounts[v] }));
  const interfaceCount = tools.filter((t) => t.vendorKind === "interface").length;

  // A contract tool is a concrete backend for a vendor, or a pure interface spec.
  const isImplementation = (t: Tool) =>
    t.vendorKind === "implementation" && !!t.vendor && t.vendor !== "agnostic";

  const stateBadge = (t: Tool) =>
    t.hasCode
      ? { label: "Implemented", cls: "bg-success-50 text-success-700 border-success-200" }
      : { label: "Adapter / spec", cls: "bg-brand-50 text-brand-700 border-brand-200" };
  const maturityBadge = (m: string | null) => {
    if (!m) return null;
    const map: Record<string, string> = {
      stable: "bg-success-50 text-success-700 border-success-200",
      experimental: "bg-warning-50 text-warning-700 border-warning-200",
      proposed: "bg-neutral-100 text-neutral-700 border-neutral-200",
      off: "bg-neutral-100 text-neutral-500 border-neutral-200",
    };
    return { label: m, cls: map[m] ?? map.proposed };
  };
  const labelCls = (kind: string) =>
    kind === "contract"
      ? "bg-brand-50 text-brand-700"
      : "bg-neutral-100 text-neutral-700";

  return {
    data,
    skillCaps,
    contractList,
    substrateList,
    tools,
    orgById,
    visibleOrgs,
    orgChips,
    agnosticCount,
    labelDefs,
    vendorLogo,
    orgLogoOf,
    vendorChips,
    interfaceCount,
    isImplementation,
    stateBadge,
    maturityBadge,
    labelCls,
  };
}
