import { test } from "node:test";
import assert from "node:assert/strict";
import { awaitBuild } from "./await-build.mjs";

const SHA = "a".repeat(40);

function fakeGh({ pull = { state: "open", head: { sha: SHA } }, runs = [] } = {}) {
  let i = 0;
  const shas = [];
  return {
    calls: () => i,
    shas,
    getPull: async () => pull,
    latestBuild: async (sha) => {
      shas.push(sha);
      return runs[Math.min(i++, runs.length - 1)] ?? null;
    },
  };
}

const clock = () => {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; } };
};

test("does not wait for a closed pull request", async () => {
  const gh = fakeGh({ pull: { state: "closed", head: { sha: SHA } } });
  const r = await awaitBuild({ gh, pr: 5, ...clock() });
  assert.equal(r.ready, false);
  assert.equal(gh.calls(), 0);
});

test("waits through a missing and an in-progress build until it succeeds", async () => {
  const gh = fakeGh({
    runs: [null, { id: 1, status: "in_progress" }, { id: 1, status: "completed", conclusion: "success" }],
  });
  const r = await awaitBuild({ gh, pr: 5, ...clock() });
  assert.equal(r.ready, true);
  assert.equal(gh.calls(), 3);
  assert.deepEqual(new Set(gh.shas), new Set([SHA]), "waits on the head SHA the API reports");
});

test("a failed build is not ready", async () => {
  const gh = fakeGh({ runs: [{ id: 1, status: "completed", conclusion: "failure" }] });
  assert.equal((await awaitBuild({ gh, pr: 5, ...clock() })).ready, false);
});

test("gives up at the deadline", async () => {
  const gh = fakeGh({ runs: [{ id: 1, status: "queued" }] });
  const r = await awaitBuild({ gh, pr: 5, timeoutMs: 100, intervalMs: 30, ...clock() });
  assert.equal(r.ready, false);
  assert.match(r.reason, /timed out/);
});

test("rejects a PR number or head SHA that is not plain", async () => {
  await assert.rejects(awaitBuild({ gh: fakeGh(), pr: "5\n", ...clock() }), /bad PR number/);
  const gh = fakeGh({ pull: { state: "open", head: { sha: "abc&status=success" } } });
  await assert.rejects(awaitBuild({ gh, pr: 5, ...clock() }), /bad head SHA/);
});
