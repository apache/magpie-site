import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./publish.mjs";

const SHA = "c".repeat(40);
const pull = (number, sha = SHA) => ({ number, head: { sha } });

async function artifactDir({ withSymlink = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "preview-art-"));
  await writeFile(join(dir, "index.html"), "<h1>site</h1>");
  if (withSymlink) await symlink("/etc/passwd", join(dir, "leak"));
  return dir;
}

const bot = (body) => ({ user: { type: "Bot" }, body });
const human = (body, login = "drive-by") => ({ user: { type: "User", login }, body });
const armCmd = (login = "maintainer") => ({ user: { type: "User", login }, body: "/show-preview" });

function fakes({
  openPulls = [],
  comments = {},
  branches = [],
  headMessages = {},
  hasBuild = true,
  throwFor = [],
} = {}) {
  const pushed = [];
  const deleted = [];
  const posted = [];

  const gh = {
    listOpenPulls: async () => openPulls,
    listComments: async (n) => {
      if (throwFor.includes(n)) throw new Error("transient failure");
      return comments[n] ?? [];
    },
    hasWriteAccess: async (login) => login === "maintainer",
    upsertComment: async (n, marker, body) => {
      posted.push({ n, marker, body });
    },
    listPreviewBranches: async () => branches,
    deleteBranch: async (name) => {
      deleted.push(name);
    },
    latestSuccessfulBuild: async () => (hasBuild ? { id: 1 } : null),
  };

  const git = {
    pushTree: async (branch, files, message, contentDir) => {
      pushed.push({ branch, files, message, contentDir });
    },
    headMessage: async (branch) => headMessages[branch] ?? "",
  };

  return { gh, git, pushed, deleted, posted };
}

const go = (f, extra = {}) =>
  run({ gh: f.gh, git: f.git, repo: "apache/magpie-site", fetchArtifact: async () => null, ...extra });

test("announces on an open PR that has not been told about previews", async () => {
  const f = fakes({ openPulls: [pull(5)] });
  await go(f);

  const announce = f.posted.find((p) => p.marker === "magpie-preview-howto");
  assert.ok(announce, "expected an explainer comment");
  assert.match(announce.body, /magpie-pr5\.staged\.apache\.org/);
});

test("does not announce twice when its own explainer is already there", async () => {
  const f = fakes({
    openPulls: [pull(5)],
    comments: { 5: [bot("hi\n\n<!-- magpie-preview-howto -->")] },
  });
  await go(f);

  assert.equal(f.posted.filter((p) => p.marker === "magpie-preview-howto").length, 0);
});

test("still announces when a human plants the explainer marker", async () => {
  // A substring test on any author would let anyone suppress the explainer.
  const f = fakes({
    openPulls: [pull(5)],
    comments: { 5: [human("see <!-- magpie-preview-howto -->")] },
  });
  await go(f);

  assert.equal(f.posted.filter((p) => p.marker === "magpie-preview-howto").length, 1);
});

test("publishes an armed open PR", async () => {
  const dir = await artifactDir();
  const f = fakes({ openPulls: [pull(5)], comments: { 5: [armCmd()] } });

  await go(f, { fetchArtifact: async () => ({ dir, meta: { pr: 5, headSha: SHA } }) });

  assert.equal(f.pushed.length, 1);
  assert.equal(f.pushed[0].branch, "preview/pr5-staging");
  assert.equal(f.pushed[0].contentDir, dir, "the artifact's content must be published");
  assert.match(f.pushed[0].files[".asf.yaml"], /profile: pr5/);
  assert.match(f.pushed[0].files["robots.txt"], /Disallow: \//);
  assert.ok(f.posted.some((p) => p.marker === "magpie-preview-status" && /published/i.test(p.body)));
});

test("does not publish an unarmed PR", async () => {
  const f = fakes({ openPulls: [pull(5)], comments: { 5: [human("/show-preview")] } });
  await go(f, {
    fetchArtifact: async () => {
      throw new Error("must not fetch an artifact for an unarmed PR");
    },
  });
  assert.equal(f.pushed.length, 0);
});

test("refuses an artifact whose metadata claims another PR", async () => {
  const dir = await artifactDir();
  const f = fakes({ openPulls: [pull(5)], comments: { 5: [armCmd()] } });

  await go(f, { fetchArtifact: async () => ({ dir, meta: { pr: 6, headSha: SHA } }) });

  assert.equal(f.pushed.length, 0);
  assert.match(f.posted.at(-1).body, /could not be published/i);
});

test("refuses to publish when the unsafe-entry screen cannot run", async () => {
  // Fail closed: an error in the screen must never read as "nothing found".
  const f = fakes({ openPulls: [pull(5)], comments: { 5: [armCmd()] } });

  await go(f, {
    fetchArtifact: async () => ({ dir: "/nonexistent-preview-dir", meta: { pr: 5, headSha: SHA } }),
  });

  assert.equal(f.pushed.length, 0, "must not publish an artifact it could not screen");
  assert.match(f.posted.at(-1).body, /could not screen/i);
});

test("refuses an artifact containing a symlink", async () => {
  const dir = await artifactDir({ withSymlink: true });
  const f = fakes({ openPulls: [pull(5)], comments: { 5: [armCmd()] } });

  await go(f, { fetchArtifact: async () => ({ dir, meta: { pr: 5, headSha: SHA } }) });

  assert.equal(f.pushed.length, 0);
  assert.match(f.posted.at(-1).body, /unsafe entries/i);
});

test("says it is waiting when there is no successful build", async () => {
  const f = fakes({ openPulls: [pull(5)], comments: { 5: [armCmd()] }, hasBuild: false });
  await go(f);

  assert.equal(f.pushed.length, 0);
  assert.match(f.posted.at(-1).body, /waiting on a build/i);
});

test("tombstones a closed PR's preview and corrects its status comment", async () => {
  const f = fakes({ openPulls: [], branches: ["preview/pr9-staging"] });
  await go(f);

  assert.equal(f.pushed.length, 1);
  assert.match(f.pushed[0].files["index.html"], /retired/i);
  assert.match(f.pushed[0].message, /\[tombstone\]/);
  assert.equal(f.deleted.length, 0, "delete waits for a later run");
  assert.ok(
    f.posted.some((p) => p.n === 9 && /retired/i.test(p.body)),
    "the status comment must stop claiming the preview is live",
  );
});

test("deletes a branch that already carries a tombstone", async () => {
  const f = fakes({
    openPulls: [],
    branches: ["preview/pr9-staging"],
    headMessages: { "preview/pr9-staging": "Retire preview for #9 [tombstone]" },
  });
  await go(f);

  assert.deepEqual(f.deleted, ["preview/pr9-staging"]);
});

test("a manual dispatch leaves a durable arming record", async () => {
  const dir = await artifactDir();
  const f = fakes({ openPulls: [pull(42)] });

  await go(f, {
    only: 42,
    dispatchedBy: "maintainer",
    fetchArtifact: async () => ({ dir, meta: { pr: 42, headSha: SHA } }),
  });

  const armed = f.posted.find((p) => p.marker === "magpie-preview-armed");
  assert.ok(armed, "a dispatch must record arming so the next run does not reap it");
  assert.match(armed.body, /maintainer/);
});

test("a PR armed only by the dispatch record survives a later scheduled run", async () => {
  const dir = await artifactDir();
  const f = fakes({
    openPulls: [pull(42)],
    comments: { 42: [bot("armed\n\n<!-- magpie-preview-armed -->")] },
    branches: ["preview/pr42-staging"],
  });

  await go(f, { fetchArtifact: async () => ({ dir, meta: { pr: 42, headSha: SHA } }) });

  assert.equal(f.pushed.filter((p) => /tombstone/.test(p.message)).length, 0,
    "a dispatched preview must not be reaped on the next scheduled run");
  assert.deepEqual(f.deleted, []);
});

test("one PR's failure does not abort the reap", async () => {
  const f = fakes({
    openPulls: [pull(5)],
    throwFor: [5],
    branches: ["preview/pr9-staging"],
  });

  await go(f);

  assert.ok(
    f.pushed.some((p) => /tombstone/.test(p.message)),
    "a transient failure on one PR must not block teardown of unrelated previews",
  );
});
