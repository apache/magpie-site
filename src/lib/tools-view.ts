import data from "../data/tools.json";

/** Derive only the dimensions exposed by the tools browser. */
export function buildToolsView() {
  const tools = [...data.tools].sort((a, b) => a.name.localeCompare(b.name));
  const contractList = Object.keys(data.contracts).map(key => ({ key }));
  const substrateList = Object.keys(data.substrates).map(key => ({ key }));
  const vendors = new Set(tools.filter(t => t.vendorKind === "implementation" && t.vendor && t.vendor !== "agnostic").map(t => t.vendor!));
  const vendorChips = [...vendors].sort().map(vendor => ({ vendor }));
  const organizations = new Map(data.organizations.map(o => [o.id, o.name]));
  const orgChips = [...new Set(tools.map(t => t.organization).filter((id): id is string => Boolean(id)))].sort().map(id => ({ id, label: organizations.get(id) ?? id }));
  const stateBadge = (tool: typeof tools[number]) => ({ label: tool.hasCode ? "Implemented" : "Adapter / spec" });
  return { tools, contractList, substrateList, vendorChips, orgChips, stateBadge };
}
