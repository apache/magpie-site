import { appendFile } from "node:fs/promises";

const SHA_RE = /^[0-9a-f]{40}$/;

/**
 * Wait for the unprivileged build of a pull request's current head commit, so
 * its preview can be published as soon as the artifact exists.
 *
 * The head SHA is read from the API, not from the triggering event: a newer
 * push may have landed since, and it keeps the event's payload out of this
 * step entirely. Whether the PR is armed is not decided here — the workflow
 * only starts this for a labelled PR or a maintainer's command, and the
 * publisher checks arming again with full rigour.
 *
 * Returns { ready, reason }. `ready` is true only when the newest build run for
 * the head commit completed successfully.
 */
export async function awaitBuild({
  gh,
  pr,
  timeoutMs = 50 * 60 * 1000,
  intervalMs = 30 * 1000,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  now = () => Date.now(),
}) {
  if (!/^\d+$/.test(String(pr))) throw new TypeError(`bad PR number ${JSON.stringify(pr)}`);

  const pull = await gh.getPull(pr);
  if (pull?.state !== "open") return { ready: false, reason: `#${pr} is not open` };
  const sha = pull?.head?.sha;
  // Interpolated into an API query string.
  if (!SHA_RE.test(String(sha))) throw new TypeError(`bad head SHA ${JSON.stringify(sha)}`);

  const deadline = now() + timeoutMs;
  for (;;) {
    const run = await gh.latestBuild(sha);
    if (run?.status === "completed") {
      return run.conclusion === "success"
        ? { ready: true, reason: `build ${run.id} succeeded` }
        : { ready: false, reason: `build ${run.id} concluded ${run.conclusion}` };
    }
    if (now() >= deadline) {
      return { ready: false, reason: "timed out waiting for the build; the next push, label or dispatch will retry" };
    }
    await sleep(intervalMs);
  }
}

import { createClient } from "./github.mjs";

if (import.meta.url === `file://${process.argv[1]}`) {
  const { GITHUB_REPOSITORY: repo, GITHUB_TOKEN: token, PR, GITHUB_OUTPUT } = process.env;
  if (!repo || !token) {
    console.error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");
    process.exit(1);
  }

  const { ready, reason } = await awaitBuild({
    gh: createClient({ repo, token }),
    pr: PR,
  });
  console.log(`preview: ${ready ? "ready" : "not publishing"} — ${reason}`);
  if (GITHUB_OUTPUT) await appendFile(GITHUB_OUTPUT, `ready=${ready}\n`);
}
