import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderAsfYaml,
  renderRobots,
  renderTombstone,
  previewBranch,
  previewUrl,
} from "./files.mjs";

test("branch and url agree on the profile", () => {
  assert.equal(previewBranch(176), "preview/pr176-staging");
  assert.equal(previewUrl(176), "https://magpie-pr176.staged.apache.org/");
});

test("asf.yaml declares the profile and a whoami matching the branch", () => {
  const yaml = renderAsfYaml(176);
  assert.match(yaml, /profile: pr176/);
  assert.match(yaml, /whoami: preview\/pr176-staging/);
});

test("asf.yaml never contains a publish block", () => {
  // A publish block on a preview branch would target magpie.apache.org.
  assert.doesNotMatch(renderAsfYaml(176), /publish:/);
});

test("robots.txt disallows everything", () => {
  assert.match(renderRobots(), /User-agent: \*/);
  assert.match(renderRobots(), /Disallow: \//);
});

test("the tombstone names the PR and links to it", () => {
  const html = renderTombstone({ pr: 176, repo: "apache/magpie-site" });
  assert.match(html, /176/);
  assert.match(html, /https:\/\/github\.com\/apache\/magpie-site\/pull\/176/);
  assert.match(html, /<meta name="robots" content="noindex">/);
});
