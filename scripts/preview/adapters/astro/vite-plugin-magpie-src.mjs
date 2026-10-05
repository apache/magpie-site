import { relative } from "node:path";
import { parseSync, Visitor } from "vite";

/**
 * Stamps every JSX host element with the source file and line it came from, so
 * a preview's overlay can resolve a marked region back to a diff line.
 *
 * Only host elements (lowercase names) are stamped: a component element renders
 * host elements of its own, and those carry the location the reviewer can act
 * on. Active only when the build sets MAGPIE_PREVIEW_ANNOTATE=1 — the
 * production build must emit none of this.
 *
 * This is a Vite plugin running before the JSX transform, so it only sees JSX:
 * `.tsx` and `.jsx` files. `.astro` templates and the synced markdown docs are
 * never annotated — that would need the Astro compiler.
 */
export default function magpieSrc({ root = process.cwd() } = {}) {
  return {
    name: "magpie-src",
    enforce: "pre",
    transform: {
      filter: { id: { include: /\.[jt]sx(?:$|\?)/, exclude: /[/\\]node_modules[/\\]/ } },
      handler(code, id) {
        const stamped = stampSource(code, id.split("?")[0], root);
        // Attributes are inserted within a line, so line mappings still hold.
        return stamped === code ? null : { code: stamped, map: null };
      },
    },
  };
}

export function stampSource(code, filename, root) {
  const lang = filename.endsWith(".jsx") ? "jsx" : "tsx";
  const { program, errors } = parseSync(filename, code, { lang });
  if (errors.length) return code;

  const lineStarts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") lineStarts.push(i + 1);
  const lineOf = (offset) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const file = relative(root, filename);
  const inserts = [];
  new Visitor({
    JSXOpeningElement(node) {
      if (node.name.type !== "JSXIdentifier") return;
      if (!/^[a-z]/.test(node.name.name)) return;
      const already = node.attributes.some(
        (a) => a.type === "JSXAttribute" && a.name.name === "data-magpie-src",
      );
      if (already) return;
      inserts.push([node.name.end, ` data-magpie-src="${file}:${lineOf(node.start)}"`]);
    },
  }).visit(program);

  let out = code;
  for (const [at, text] of inserts.sort((a, b) => b[0] - a[0])) {
    out = out.slice(0, at) + text + out.slice(at);
  }
  return out;
}
