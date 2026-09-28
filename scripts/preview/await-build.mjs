import { appendFile } from "node:fs/promises";
import { previewBranch } from "./files.mjs";

const TOMBSTONE_TAG = "[tombstone]";
const SHA_RE = /^[0-9a-f]{40}$/;

/**
 * Wait for the unprivileged build of a pull request's pushed commit, so its
 * preview can be republished as soon as the artifact exists rather than on the
 * next scheduled run.
 *
 * Only a pull request with a live preview is waited on. Arming is the
 * publisher's decision and it makes it again; this is only a cheap filter so
 * that every push to every unarmed pull request does not hold a runner for the
 * length of a build.
 *
 * Returns { ready, reason }. `ready` is true only when the newest build run for
 * `sha` completed successfully.
 */
export async function awaitBuild({
  gh,
  pr,
  sha,
  timeoutMs = 50 * 60 * 1000,
  intervalMs = 30 * 1000,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  now = () => Date.now(),
}) {
  if (!/^\d+$/.test(String(pr))) throw new TypeError(`bad PR number ${JSON.stringify(pr)}`);
  // Interpolated into an API query string.
  if (!SHA_RE.test(String(sha))) throw new TypeError(`bad head SHA ${JSON.stringify(sha)}`);

  const head = await gh.branchHeadMessage(previewBranch(pr));
  if (!head || head.includes(TOMBSTONE_TAG)) {
    return { ready: false, reason: `#${pr} has no live preview` };
  }

  const deadline = now() + timeoutMs;
  for (;;) {
    const run = await gh.latestBuild(sha);
    if (run?.status === "completed") {
      return run.conclusion === "success"
        ? { ready: true, reason: `build ${run.id} succeeded` }
        : { ready: false, reason: `build ${run.id} concluded ${run.conclusion}` };
    }
    if (now() >= deadline) {
      return { ready: false, reason: "timed out waiting for the build; the scheduled run will pick it up" };
    }
    await sleep(intervalMs);
  }
}

import { createClient } from "./github.mjs";

if (import.meta.url === `file://${process.argv[1]}`) {
  const { GITHUB_REPOSITORY: repo, GITHUB_TOKEN: token, PR, HEAD_SHA, GITHUB_OUTPUT } = process.env;
  if (!repo || !token) {
    console.error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");
    process.exit(1);
  }

  const { ready, reason } = await awaitBuild({
    gh: createClient({ repo, token }),
    pr: PR,
    sha: HEAD_SHA,
  });
  console.log(`preview: ${ready ? "ready" : "not publishing"} — ${reason}`);
  if (GITHUB_OUTPUT) await appendFile(GITHUB_OUTPUT, `ready=${ready}\n`);
}
