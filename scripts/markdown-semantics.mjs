import html5 from 'html-validate/elements/html5';

// Keep documentation examples literal and task lists labelled without editing
// the generated Markdown. Upstream prose writes placeholders such as <N>,
// <release> or <tracker title> outside code spans; they are text, not elements.
// A bare tag (no attributes) whose name is not an HTML element is a
// placeholder. The few placeholders that share a name with a real element are
// listed explicitly.
const bareTag = /^<([A-Za-z][\w-]*)(?:\s+[\w-]+)*\s*>$/;
const elementNamedPlaceholders = new Set(['<link>']);
const isPlaceholder = value => {
  const name = bareTag.exec(value)?.[1];
  return name !== undefined && (!Object.hasOwn(html5, name.toLowerCase()) || elementNamedPlaceholders.has(value));
};
export const markdownSemantics = () => {
  let sawTitle = false;
  return {
    name: 'magpie-markdown-semantics',
    html(node, ctx) {
      if (isPlaceholder(node.value)) ctx.replaceNode(node, { type:'text', value:node.value });
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
