import { relative } from "node:path";

/**
 * Stamps every JSX host element with the source file and line it came from, so
 * a preview's overlay can resolve a marked region back to a diff line.
 *
 * Only host elements (lowercase names) are stamped: a component element renders
 * host elements of its own, and those carry the location the reviewer can act
 * on. Active only when the build sets MAGPIE_PREVIEW_ANNOTATE=1 — the
 * production build must emit none of this.
 */
export default function magpieSrc({ types: t }) {
  return {
    name: "magpie-src",
    visitor: {
      JSXOpeningElement(path, state) {
        const name = path.node.name;
        if (name.type !== "JSXIdentifier") return;
        if (!/^[a-z]/.test(name.name)) return;

        const already = path.node.attributes.some(
          (a) => a.type === "JSXAttribute" && a.name?.name === "data-magpie-src",
        );
        if (already) return;

        const line = path.node.loc?.start?.line;
        if (!line) return;

        const root = state.opts?.root ?? state.file.opts.root ?? process.cwd();
        const file = relative(root, state.filename ?? state.file.opts.filename ?? "");

        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-magpie-src"),
            t.stringLiteral(`${file}:${line}`),
          ),
        );
      },
    },
  };
}
