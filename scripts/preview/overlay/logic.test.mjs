import { test } from "node:test";
import assert from "node:assert/strict";
import { clampRegion, captionFor, targetUrl } from "./logic.mjs";

const viewport = { w: 1000, h: 800 };

test("clampRegion normalises a drag in any direction", () => {
  assert.deepEqual(clampRegion({ x1: 300, y1: 200, x2: 100, y2: 50 }, viewport), {
    x: 100, y: 50, w: 200, h: 150,
  });
});

test("clampRegion clips to the viewport", () => {
  assert.deepEqual(clampRegion({ x1: -50, y1: -20, x2: 1200, y2: 900 }, viewport), {
    x: 0, y: 0, w: 1000, h: 800,
  });
});

test("clampRegion rejects a region too small to be deliberate", () => {
  assert.equal(clampRegion({ x1: 10, y1: 10, x2: 14, y2: 14 }, viewport), null);
});

test("captionFor names the page, the source and the build", () => {
  const caption = captionFor({
    url: "https://magpie-pr180.staged.apache.org/tools",
    source: "src/components/landing/SiteFooter.tsx:72",
    region: { x: 240, y: 1150, w: 420, h: 180 },
    sha: "14fdc13",
  });

  assert.match(caption, /magpie-pr180\.staged\.apache\.org\/tools/);
  assert.match(caption, /SiteFooter\.tsx:72/);
  assert.match(caption, /420×180/);
  assert.match(caption, /14fdc13/);
});

test("captionFor says so when no source was resolved", () => {
  const caption = captionFor({
    url: "https://x/",
    source: null,
    region: { x: 0, y: 0, w: 10, h: 10 },
    sha: "abc1234",
  });
  assert.match(caption, /source not resolved/i);
});

test("targetUrl anchors on the diff line when the line is in the diff", () => {
  const anchors = { "a.tsx": { anchor: "diff-deadbeef", ranges: [[10, 20]] } };
  assert.equal(
    targetUrl({ repo: "apache/magpie-site", pr: 180, source: "a.tsx:12", anchors }),
    "https://github.com/apache/magpie-site/pull/180/files#diff-deadbeefR12",
  );
});

test("targetUrl falls back to the conversation for a line outside the diff", () => {
  const anchors = { "a.tsx": { anchor: "diff-deadbeef", ranges: [[10, 20]] } };
  assert.equal(
    targetUrl({ repo: "apache/magpie-site", pr: 180, source: "a.tsx:99", anchors }),
    "https://github.com/apache/magpie-site/pull/180",
  );
});

test("targetUrl falls back when the file, the manifest or the source is missing", () => {
  const base = { repo: "apache/magpie-site", pr: 180 };
  const conversation = "https://github.com/apache/magpie-site/pull/180";
  assert.equal(targetUrl({ ...base, source: "other.tsx:1", anchors: {} }), conversation);
  assert.equal(targetUrl({ ...base, source: "a.tsx:1", anchors: null }), conversation);
  assert.equal(targetUrl({ ...base, source: null, anchors: {} }), conversation);
});
