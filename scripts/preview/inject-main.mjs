import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { overlayFiles, injectIntoTree } from "./overlay-files.mjs";

/**
 * Put the review overlay on the published site, built from main.
 *
 * Run by build.yml on main when MAIN_REVIEW_OVERLAY is on, after an annotated
 * build (MAGPIE_PREVIEW_ANNOTATE=1) so a marked region resolves to its source
 * line. In this mode the overlay shows no preview banner — this is the
 * published site — and a comment opens a new issue linking the source on main.
 *
 * `generated` lists source trees that are not in this repository: the docs
 * pages are synced from apache/magpie, so a line there cannot be linked here.
 */
export async function injectMain({ dir, repo, branch = "main", sha }) {
  const files = await overlayFiles({
    repo,
    mode: "main",
    branch,
    sha: String(sha ?? "").slice(0, 7),
    generated: ["src/content/docs/"],
  });
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
  await injectIntoTree(dir);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  const { GITHUB_REPOSITORY: repo, GITHUB_SHA: sha } = process.env;
  if (!dir || !repo) {
    console.error("usage: GITHUB_REPOSITORY=owner/repo node inject-main.mjs <site dir>");
    process.exit(1);
  }
  await injectMain({ dir, repo, sha });
  console.log(`review overlay injected into ${dir} for ${repo}`);
}
