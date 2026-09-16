import { readdir, lstat, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const SHA_RE = /^[0-9a-f]{40}$/;

/**
 * The artifact was produced by a job that ran pull-request code, so its
 * metadata is attacker-controlled. Without the SHA equality check below, a
 * fork could claim another PR's number and publish content under it.
 */
export function validateMeta(meta, expected) {
  if (!meta || typeof meta !== "object") {
    return { ok: false, reason: "metadata is missing or not an object" };
  }

  const pr = String(meta.pr ?? "");
  if (!/^\d+$/.test(pr)) {
    return { ok: false, reason: `pr is not a plain number: ${JSON.stringify(meta.pr)}` };
  }
  if (Number(pr) !== expected.number) {
    return { ok: false, reason: `pr ${pr} does not match the PR being published (${expected.number})` };
  }

  const sha = String(meta.headSha ?? "");
  if (!SHA_RE.test(sha)) {
    return { ok: false, reason: "headSha is not a 40-character hex sha" };
  }
  if (sha !== expected.headSha) {
    return { ok: false, reason: `headSha ${sha} is not the PR's current head (${expected.headSha})` };
  }

  return { ok: true };
}

/**
 * Paths in an extracted tree that must never be published: symlinks.
 *
 * This walks an already-extracted tree, so it cannot see an archive entry that
 * escaped the root during extraction — such an entry lands outside the tree and
 * no walk of it would find it. Screening archive entry names before extraction
 * is the defence for that, and it lives in the extraction step.
 */
export async function findUnsafeEntries(root) {
  const rootReal = await realpath(root);
  const unsafe = [];

  async function walk(dir) {
    for (const name of await readdir(dir)) {
      const full = join(dir, name);
      const stat = await lstat(full);

      if (stat.isSymbolicLink()) {
        unsafe.push(relative(rootReal, full).split(sep).join("/"));
        continue;
      }
      if (stat.isDirectory()) await walk(full);
    }
  }

  await walk(rootReal);
  return unsafe.sort();
}
