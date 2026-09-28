import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * The review overlay's files, for any site tree: the screenshot library and
 * review.js with its configuration. Used by the PR preview publisher and by
 * the main build (inject-main.mjs), so both ship the same overlay.
 *
 * `config` becomes window.__MAGPIE_PREVIEW__: { repo, pr, sha, anchors } for a
 * pull request's preview, { repo, mode: "main", branch, sha, generated } for
 * the published site.
 */
export async function overlayFiles(config) {
  const logic = await readFile(new URL("./overlay/logic.mjs", import.meta.url), "utf8");
  const overlay = await readFile(new URL("./overlay/review.js", import.meta.url), "utf8");
  const vendor = await readFile(
    new URL("../../vendor/html2canvas-pro/html2canvas-pro.min.js", import.meta.url), "utf8",
  );
  return {
    "_preview/html2canvas-pro.min.js": vendor,
    // The overlay's pure logic is unit-tested as a module and inlined here; the
    // browser file has no build step and no imports.
    "_preview/review.js":
      logic.replace(/^export /gm, "") +
      `\nwindow.__MAGPIE_PREVIEW__ = ${JSON.stringify(config)};\n` + overlay,
  };
}

const OVERLAY_MARKER = "<!-- magpie-preview-overlay -->";
const OVERLAY_TAGS =
  OVERLAY_MARKER + "\n" +
  '<script src="/_preview/html2canvas-pro.min.js"></script>\n' +
  '<script src="/_preview/review.js"></script>\n';

/**
 * Add the overlay's script tags to a page, exactly once.
 *
 * Guarded on a marker comment rather than on the script path: a page whose
 * CONTENT mentions "/_preview/review.js" — this feature's own design document,
 * once published — would otherwise silently get no overlay. Injected at the
 * LAST </body>, because an earlier one can appear inside an inline script or a
 * serialised island prop, and injecting there corrupts the page.
 */
export function injectOverlay(html) {
  if (typeof html !== "string") return html;
  if (html.includes(OVERLAY_MARKER)) return html;

  const at = html.lastIndexOf("</body>");
  if (at === -1) return html;
  return html.slice(0, at) + OVERLAY_TAGS + html.slice(at);
}

export async function findHtmlFiles(root) {
  const out = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) out.push(...(await findHtmlFiles(full)));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Inject the overlay's script tags into every page under `root`. */
export async function injectIntoTree(root) {
  for (const page of await findHtmlFiles(root)) {
    await writeFile(page, injectOverlay(await readFile(page, "utf8")));
  }
}
