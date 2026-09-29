// Mark a table row's first cell as a label when it is short, so it can keep to
// one line. Long first cells (whole sentences in scenario tables) still wrap;
// CSS alone cannot tell the two apart. Tables scroll sideways when they do not
// fit, so each is focusable: keyboard users can scroll it too.
const MAX_LABEL = 32;

const textOf = node =>
  node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join('');

/** @type {import('satteri').HastPluginDefinition} */
const tableLabels = {
  name: 'magpie-table-labels',
  element: {
    filter: ['tr', 'table'],
    visit(node, ctx) {
      if (node.tagName === 'table') {
        if (node.properties?.tabIndex === undefined) ctx.replaceNode(node, { ...node, properties: { ...node.properties, tabIndex: 0 } });
        return;
      }
      const index = node.children.findIndex(child => child.type === 'element' && (child.tagName === 'td' || child.tagName === 'th'));
      const first = node.children[index];
      if (!first || textOf(first).trim().length > MAX_LABEL) return;
      // Nodes are read-only: replace the row with one whose first cell is marked.
      const classes = [first.properties?.className ?? []].flat();
      const label = { type: 'element', tagName: first.tagName, properties: { ...first.properties, className: [...classes, 'table-label'] }, children: first.children };
      ctx.replaceNode(node, { ...node, children: node.children.map((child, i) => (i === index ? label : child)) });
    },
  },
};
export default tableLabels;
