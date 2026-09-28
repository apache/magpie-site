// Keep documentation examples literal and task lists labelled without editing
// the generated Markdown. These placeholders are prose, not custom elements.
export const placeholders = new Set(['<link>', '<N>', '<issue-ref>', '<project>', '<name>']);
export const markdownSemantics = () => {
  let sawTitle = false;
  return {
    name: 'magpie-markdown-semantics',
    html(node, ctx) {
      if (placeholders.has(node.value)) ctx.replaceNode(node, { type:'text', value:node.value });
      // One upstream runbook has a trailing, unmatched authoring wrapper.
      // It is neither content nor an HTML element; handle only that exact file.
      if (ctx.source.includes('# SVN source-release runbook (signed') && !ctx.source.includes('<content>') && node.value.trim() === '</content>') ctx.removeNode(node);
    },
    heading(node, ctx) {
      if (node.depth === 1) {
        if (sawTitle) ctx.setProperty(node, 'depth', 2);
        sawTitle = true;
      }
    },
  };
};

export const taskLabels = {
  name: 'magpie-task-labels',
  element: {
    filter: ['li'],
    visit(node, ctx) {
      if (!node.children.some(n => n.type === 'element' && n.tagName === 'input')) return;
      ctx.replaceNode(node, { ...node, children:[{ type:'element', tagName:'label', properties:{}, children:node.children }] });
    },
  },
};
