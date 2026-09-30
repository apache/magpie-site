// Project-specific configuration files live in each adopter's repository, not
// on this website or in the framework source: a <project-config> link rewritten
// to a docs route or a GitHub URL would lead nowhere, so it renders as text.
/** @type {import('satteri').HastPluginDefinition} */
export default {
  name: 'magpie-project-file-references',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      let path;
      try { path = decodeURIComponent(href); } catch { return; }
      if (!path.includes('<project-config>')) return;
      ctx.replaceNode(node, {
        type: 'element', tagName: 'span',
        properties: { className: ['project-file-reference'], title: 'A file in your project’s configuration' },
        children: node.children,
      });
    },
  },
};
