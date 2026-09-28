import { test } from "node:test";
import assert from "node:assert/strict";
import { awaitBuild } from "./await-build.mjs";

const SHA = "a".repeat(40);

function fakeGh({ head = "Publish preview for #5 (aaaaaaa)", runs = [] } = {}) {
  let i = 0;
  return {
    calls: () => i,
    branchHeadMessage: async () => head,
    latestBuild: async () => runs[Math.min(i++, runs.length - 1)] ?? null,
  };
}

const clock = () => {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; } };
};

test("does not wait for a pull request without a live preview", async () => {
  const gh = fakeGh({ head: "" });
  const r = await awaitBuild({ gh, pr: 5, sha: SHA, ...clock() });
  assert.equal(r.ready, false);
  assert.equal(gh.calls(), 0, "no build lookups for an unarmed PR");
});

test("does not wait for a tombstoned preview", async () => {
  const gh = fakeGh({ head: "Retire preview for #5 [tombstone]" });
  assert.equal((await awaitBuild({ gh, pr: 5, sha: SHA, ...clock() })).ready, false);
});

test("waits through a missing and an in-progress build until it succeeds", async () => {
  const gh = fakeGh({
    runs: [null, { id: 1, status: "in_progress" }, { id: 1, status: "completed", conclusion: "success" }],
  });
  const r = await awaitBuild({ gh, pr: 5, sha: SHA, ...clock() });
  assert.equal(r.ready, true);
  assert.equal(gh.calls(), 3);
});

test("a failed build is not ready", async () => {
  const gh = fakeGh({ runs: [{ id: 1, status: "completed", conclusion: "failure" }] });
  assert.equal((await awaitBuild({ gh, pr: 5, sha: SHA, ...clock() })).ready, false);
});

test("gives up at the deadline", async () => {
  const gh = fakeGh({ runs: [{ id: 1, status: "queued" }] });
  const r = await awaitBuild({ gh, pr: 5, sha: SHA, timeoutMs: 100, intervalMs: 30, ...clock() });
  assert.equal(r.ready, false);
  assert.match(r.reason, /timed out/);
});

test("rejects a SHA or PR number that is not plain", async () => {
  const gh = fakeGh();
  await assert.rejects(awaitBuild({ gh, pr: 5, sha: "abc&status=success", ...clock() }), /bad head SHA/);
  await assert.rejects(awaitBuild({ gh, pr: "5\n", sha: SHA, ...clock() }), /bad PR number/);
});
