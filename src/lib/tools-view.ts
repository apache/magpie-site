import data from "../data/tools.json";
import { withBase } from "@/ui/lib/utils";

type Tool = (typeof data.tools)[number];

// Bundled brand marks for backend vendors (presentation, not framework fact).
// A vendor without one gets a neutral icon. The ASF is always its oak leaf,
// never the feather that the organization data links to.
const VENDOR_LOGOS: Record<string, string> = {
  GitHub: "github.svg",
  Git: "git.svg",
  Subversion: "subversion.svg",
  Atlassian: "atlassian.svg",
  Google: "google.svg",
  ASF: "oak.svg",
  PonyMail: "oak.svg",
};
const logoUrl = (file: string | undefined) => (file ? withBase(`/vendor-logos/${file}`) : null);

export const INTERFACE = "__interface";
export const AGNOSTIC = "__agnostic";

const isImplementation = (t: Tool) =>
  t.vendorKind === "implementation" && Boolean(t.vendor) && t.vendor !== "agnostic";

export type FilterOption = { value: string; label: string; count: number; logo?: string | null; def?: string };

/** Everything the tools browser renders, derived from the generated tools.json. */
export function buildToolsView() {
  const tools = [...data.tools].sort((a, b) => a.name.localeCompare(b.name));
  const count = (match: (t: Tool) => boolean) => tools.filter(match).length;
  const hasLabel = (kind: string, name: string) => (t: Tool) =>
    t.labels.some((l) => l.kind === kind && l.name === name);

  const contracts: FilterOption[] = Object.entries(data.contracts).map(([key, def]) => ({
    value: `contract:${key}`, label: key, def, count: count(hasLabel("contract", key)),
  }));
  const substrates: FilterOption[] = Object.entries(data.substrates).map(([key, def]) => ({
    value: `substrate:${key}`, label: key, def, count: count(hasLabel("substrate", key)),
  }));

  const vendorNames = [...new Set(tools.filter(isImplementation).map((t) => t.vendor as string))].sort();
  const vendors: FilterOption[] = [
    ...vendorNames.map((v) => ({
      value: v, label: v, logo: logoUrl(VENDOR_LOGOS[v]), count: count((t) => isImplementation(t) && t.vendor === v),
    })),
    { value: INTERFACE, label: "Interface specifications", count: count((t) => t.vendorKind === "interface"),
      def: "A contract with no vendor code yet: adapters implement it for each backend." },
  ];

  const orgName = new Map(data.organizations.map((o) => [o.id, o.name]));
  const orgIds = [...new Set(tools.map((t) => t.organization).filter((o): o is string => Boolean(o)))].sort();
  const organizations: FilterOption[] = [
    ...orgIds.map((id) => ({
      value: id, label: orgName.get(id) ?? id, logo: logoUrl(VENDOR_LOGOS[id]), count: count((t) => t.organization === id),
    })),
    { value: AGNOSTIC, label: "Organization agnostic", count: count((t) => !t.organization),
      def: "Tools that work for any project, whatever organization it belongs to." },
  ];

  const labelDefs = Object.fromEntries([...contracts, ...substrates].map((o) => [o.value, o.def ?? ""]));

  return {
    tools,
    dimensions: [
      { key: "contract", label: "Contract", options: contracts },
      { key: "substrate", label: "Substrate", options: substrates },
      { key: "vendor", label: "Vendor", options: vendors },
      { key: "org", label: "Organization", options: organizations },
    ],
    labelDefs,
    stats: {
      tools: tools.length,
      contracts: Object.keys(data.contracts).length,
      contractTools: data.contractsTotal,
      substrateTools: data.substratesTotal,
      implemented: data.implementedTotal,
      mcp: data.mcpTotal,
    },
    vendorLogo: (t: Tool) => (isImplementation(t) ? logoUrl(VENDOR_LOGOS[t.vendor as string]) : null),
    orgLogo: (t: Tool) => (t.organization ? logoUrl(VENDOR_LOGOS[t.organization]) : null),
    orgLabel: (t: Tool) => (t.organization ? orgName.get(t.organization) ?? t.organization : null),
    isImplementation,
  };
}
