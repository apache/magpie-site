import { test } from "node:test";
import assert from "node:assert/strict";
import { planActions } from "./plan.mjs";

test("publishes armed open PRs", () => {
  const result = planActions({
    openPulls: [1, 2],
    armedByPr: new Map([[1, true], [2, false]]),
    previewBranches: [],
    tombstoned: new Set(),
  });
  assert.deepEqual(result.publish, [1]);
});

test("tombstones a preview whose PR has closed", () => {
  const result = planActions({
    openPulls: [],
    armedByPr: new Map(),
    previewBranches: ["preview/pr9-staging"],
    tombstoned: new Set(),
  });
  assert.deepEqual(result.tombstone, [9]);
  assert.deepEqual(result.delete, []);
});

test("deletes only on the run after tombstoning", () => {
  const result = planActions({
    openPulls: [],
    armedByPr: new Map(),
    previewBranches: ["preview/pr9-staging"],
    tombstoned: new Set(["preview/pr9-staging"]),
  });
  assert.deepEqual(result.tombstone, []);
  assert.deepEqual(result.delete, ["preview/pr9-staging"]);
});

test("tombstones a preview whose PR is open but disarmed", () => {
  const result = planActions({
    openPulls: [3],
    armedByPr: new Map([[3, false]]),
    previewBranches: ["preview/pr3-staging"],
    tombstoned: new Set(),
  });
  assert.deepEqual(result.tombstone, [3]);
  assert.deepEqual(result.publish, []);
});

test("leaves an armed open PR's branch alone", () => {
  const result = planActions({
    openPulls: [4],
    armedByPr: new Map([[4, true]]),
    previewBranches: ["preview/pr4-staging"],
    tombstoned: new Set(),
  });
  assert.deepEqual(result.tombstone, []);
  assert.deepEqual(result.delete, []);
  assert.deepEqual(result.publish, [4]);
});

test("ignores branches that are not preview refs", () => {
  const result = planActions({
    openPulls: [],
    armedByPr: new Map(),
    previewBranches: ["preview/not-a-pr", "preview/prX-staging"],
    tombstoned: new Set(),
  });
  assert.deepEqual(result.tombstone, []);
  assert.deepEqual(result.delete, []);
});

test("leaves a preview alone when the PR's armed state is unknown", () => {
  // No entry for 5 at all — what an unresolved or errored lookup looks like.
  const result = planActions({
    openPulls: [5],
    armedByPr: new Map(),
    previewBranches: ["preview/pr5-staging"],
    tombstoned: new Set(),
  });
  assert.deepEqual(result.tombstone, [], "unknown must not tombstone a live preview");
  assert.deepEqual(result.delete, []);
  assert.deepEqual(result.publish, []);
});
