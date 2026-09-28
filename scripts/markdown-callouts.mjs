// Render GitHub alert blockquotes without modifying the synced source documents.
/** @type {import('satteri').HastPluginDefinition} */
const callouts = {
  name: 'magpie-documentation-callouts',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      const index = node.children.findIndex(child => child.type === 'element' && child.tagName === 'p');
      const paragraph = node.children[index];
      if (paragraph?.type !== 'element') return;
      const first = paragraph.children[0];
      const match = first?.type === 'text' && first.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r?\n|$)/);
      if (!match) return;
      const kind = match[1].toLowerCase();
      const remaining = first.value.slice(match[0].length);
      const paragraphChildren = [...(remaining ? [{ type: 'text', value: remaining }] : []), ...paragraph.children.slice(1)];
      const children = node.children.flatMap((child, i) => i !== index ? [child] : paragraphChildren.length ? [{ ...paragraph, children: paragraphChildren }] : []);
      ctx.replaceNode(node, {
        type: 'element', tagName: 'aside', properties: { className: ['doc-callout', `doc-callout-${kind}`], role: 'note' },
        children: [{ type: 'element', tagName: 'p', properties: { className: ['doc-callout-title'] }, children: [{ type: 'text', value: kind[0].toUpperCase() + kind.slice(1) }] }, ...children],
      });
    },
  },
};
export default callouts;
