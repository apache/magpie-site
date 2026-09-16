import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = promisify(execFile);

/**
 * Archive entry names that must never be extracted.
 *
 * This runs BEFORE extraction on purpose. An entry that escapes the root lands
 * outside the extracted tree, where the post-extraction symlink walk can never
 * see it — so a pre-extraction name screen is the only place this defence can
 * exist.
 */
export function unsafeArchiveEntries(listing) {
  return String(listing ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (name) =>
        name.startsWith("/") ||
        name.startsWith("~") ||
        name.split("/").includes("..") ||
        name.includes("\\"),
    );
}

export function createArtifactFetcher({ gh, repo, token }) {
  return async function fetchArtifact(runId) {
    const list = await gh.request(`/repos/${repo}/actions/runs/${runId}/artifacts`);
    const artifact = list.artifacts?.find((a) => a.name === "preview-site");
    if (!artifact || artifact.expired) return null;

    const dir = await mkdtemp(join(tmpdir(), "preview-artifact-"));
    const zip = join(dir, "artifact.zip");

    await run("curl", [
      "-sSL", "-H", `Authorization: Bearer ${token}`,
      "-H", "X-GitHub-Api-Version: 2022-11-28",
      "-o", zip, gh.artifactZipUrl(artifact.id),
    ]);

    const { stdout: listing } = await run("unzip", ["-Z1", zip]);
    const unsafe = unsafeArchiveEntries(listing);
    if (unsafe.length) {
      await rm(dir, { recursive: true, force: true });
      throw new Error(`archive contains unsafe entry names: ${unsafe.slice(0, 5).join(", ")}`);
    }

    const out = join(dir, "site");
    await run("unzip", ["-q", "-o", zip, "-d", out]);
    await rm(zip, { force: true });

    let meta = null;
    try {
      meta = JSON.parse(await readFile(join(out, "preview-meta.json"), "utf8"));
    } catch {
      return { dir: out, meta: null };
    }
    return { dir: out, meta };
  };
}
