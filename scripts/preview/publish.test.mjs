import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "./publish.mjs";

function fakes({ openPulls = [], comments = {}, branches = [] } = {}) {
  const pushed = [];
  const deleted = [];
  const comments_ = [];

  const gh = {
    listOpenPulls: async () => openPulls,
    getPull: async (n) => openPulls.find((p) => p.number === n),
    listComments: async (n) => comments[n] ?? [],
    hasWriteAccess: async (login) => login === "maintainer",
    upsertComment: async (n, marker, body) => comments_.push({ n, body }),
    listPreviewBranches: async () => branches,
    deleteBranch: async (name) => deleted.push(name),
    latestSuccessfulBuild: async () => ({ id: 1 }),
  };

  const git = {
    pushTree: async (branch, files, message) => pushed.push({ branch, files, message }),
    headMessage: async () => "",
  };

  return { gh, git, pushed, deleted, comments: comments_ };
}

test("announces on an open PR that has never been told about previews", async () => {
  const f = fakes({ openPulls: [{ number: 5, head: { sha: "c".repeat(40) } }] });

  await run({ gh: f.gh, git: f.git, repo: "apache/magpie-site", fetchArtifact: async () => null });

  const announce = f.comments.find((c) => /show-preview/.test(c.body));
  assert.ok(announce, "expected an explainer comment");
  assert.match(announce.body, /magpie-pr5\.staged\.apache\.org/);
});

test("publishes an armed open PR", async () => {
  const f = fakes({
    openPulls: [{ number: 5, head: { sha: "c".repeat(40) } }],
    comments: { 5: [{ body: "/show-preview", user: { login: "maintainer" } }] },
  });

  await run({
    gh: f.gh,
    git: f.git,
    repo: "apache/magpie-site",
    fetchArtifact: async () => ({ dir: "/tmp/x", meta: { pr: 5, headSha: "c".repeat(40) } }),
  });

  assert.equal(f.pushed.length, 1);
  assert.equal(f.pushed[0].branch, "preview/pr5-staging");
  assert.ok(f.pushed[0].files[".asf.yaml"].includes("profile: pr5"));
  assert.ok(f.pushed[0].files["robots.txt"].includes("Disallow: /"));
});

test("does not publish an unarmed PR", async () => {
  const f = fakes({
    openPulls: [{ number: 5, head: { sha: "c".repeat(40) } }],
    comments: { 5: [{ body: "/show-preview", user: { login: "drive-by" } }] },
  });

  await run({
    gh: f.gh,
    git: f.git,
    repo: "apache/magpie-site",
    fetchArtifact: async () => { throw new Error("must not fetch"); },
  });

  assert.equal(f.pushed.length, 0);
});

test("refuses an artifact whose metadata claims another PR", async () => {
  const f = fakes({
    openPulls: [{ number: 5, head: { sha: "c".repeat(40) } }],
    comments: { 5: [{ body: "/show-preview", user: { login: "maintainer" } }] },
  });

  await run({
    gh: f.gh,
    git: f.git,
    repo: "apache/magpie-site",
    fetchArtifact: async () => ({ dir: "/tmp/x", meta: { pr: 6, headSha: "c".repeat(40) } }),
  });

  assert.equal(f.pushed.length, 0);
  assert.match(f.comments.at(-1).body, /could not be published/i);
});

test("tombstones the preview of a closed PR", async () => {
  const f = fakes({ openPulls: [], branches: ["preview/pr9-staging"] });

  await run({ gh: f.gh, git: f.git, repo: "apache/magpie-site", fetchArtifact: async () => null });

  assert.equal(f.pushed.length, 1);
  assert.match(f.pushed[0].files["index.html"], /retired/i);
  assert.equal(f.deleted.length, 0);
});

test("deletes a branch already carrying a tombstone", async () => {
  const f = fakes({ openPulls: [], branches: ["preview/pr9-staging"] });
  f.git.headMessage = async () => "Retire preview for #9 [tombstone]";

  await run({ gh: f.gh, git: f.git, repo: "apache/magpie-site", fetchArtifact: async () => null });

  assert.deepEqual(f.deleted, ["preview/pr9-staging"]);
});
