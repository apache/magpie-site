import { test } from "node:test";
import assert from "node:assert/strict";
import { previewMeta } from "./write-meta.mjs";
import { diffAnchor } from "./anchors.mjs";

test("the build's metadata carries the PR, the head SHA and the anchor manifest", async () => {
  const meta = await previewMeta({
    pr: 5,
    headSha: "a".repeat(40),
    files: [{ filename: "src/x.astro", patch: "@@ -1,1 +1,2 @@\n a\n+b" }],
  });
  assert.deepEqual(meta, {
    pr: 5,
    headSha: "a".repeat(40),
    anchors: { "src/x.astro": { anchor: diffAnchor("src/x.astro"), ranges: [[2, 2]] } },
  });
});
