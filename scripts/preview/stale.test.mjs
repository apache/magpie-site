import { test } from "node:test";
import assert from "node:assert/strict";
import { staleHeadBranches } from "./stale.mjs";

const REPO = "apache/magpie-site";
const TIP = "a".repeat(40);

const branch = (name, { sha = TIP, protectedBranch = false } = {}) => ({
  name,
  protected: protectedBranch,
  commit: { sha },
});
const pr = (ref, { state = "closed", sha = TIP, repo = REPO } = {}) => ({
  state,
  head: { ref, sha, repo: repo === null ? null : { full_name: repo } },
});

const decide = (branches, pulls) =>
  staleHeadBranches({ branches, pullsByBranch: new Map(Object.entries(pulls)), repo: REPO });

test("deletes the head branch of a closed pull request", () => {
  assert.deepEqual(decide([branch("fix-counts")], { "fix-counts": [pr("fix-counts")] }), [
    "fix-counts",
  ]);
});

test("keeps a branch while any of its pull requests is open", () => {
  const pulls = { topic: [pr("topic"), pr("topic", { state: "open" })] };
  assert.deepEqual(decide([branch("topic")], pulls), []);
});

test("keeps a branch that never had a pull request", () => {
  assert.deepEqual(decide([branch("wip")], { wip: [] }), []);
  assert.deepEqual(decide([branch("unlooked")], {}), []);
});

test("keeps a branch pushed to after its pull request closed", () => {
  const pulls = { topic: [pr("topic", { sha: "b".repeat(40) })] };
  assert.deepEqual(decide([branch("topic")], pulls), []);
});

test("ignores pull requests from a fork with the same branch name", () => {
  const pulls = { topic: [pr("topic", { repo: "someone/magpie-site" }), pr("topic", { repo: null })] };
  assert.deepEqual(decide([branch("topic")], pulls), []);
});

test("never deletes protected, serving, preview or ASF branches", () => {
  const names = ["main", "publish", "preview/pr9-staging", "asf-staging", "guarded"];
  const branches = names.map((n) => branch(n, { protectedBranch: n === "guarded" }));
  const pulls = Object.fromEntries(names.map((n) => [n, [pr(n)]]));
  assert.deepEqual(decide(branches, pulls), []);
});
