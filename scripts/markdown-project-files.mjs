// Project-specific configuration files are not pages hosted by this website.
/** @type {import('satteri').HastPluginDefinition} */
export default {
  name: 'magpie-project-file-references',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !href.startsWith('/docs/')) return;
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
