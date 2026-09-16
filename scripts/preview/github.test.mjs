import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "./github.mjs";

function fakeFetch(routes) {
  const calls = [];
  const impl = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? "GET", body: options.body, headers: options.headers });
    const key = `${options.method ?? "GET"} ${url.replace("https://api.github.com", "")}`;
    if (!(key in routes)) throw new Error(`unexpected request: ${key}`);
    const value = routes[key];
    return { ok: true, status: 200, json: async () => value, text: async () => JSON.stringify(value) };
  };
  return { impl, calls };
}

test("hasWriteAccess is true for write and admin", async () => {
  const { impl } = fakeFetch({
    "GET /repos/apache/magpie-site/collaborators/alice/permission": { permission: "write" },
    "GET /repos/apache/magpie-site/collaborators/bob/permission": { permission: "admin" },
    "GET /repos/apache/magpie-site/collaborators/carol/permission": { permission: "read" },
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });

  assert.equal(await gh.hasWriteAccess("alice"), true);
  assert.equal(await gh.hasWriteAccess("bob"), true);
  assert.equal(await gh.hasWriteAccess("carol"), false);
});

test("hasWriteAccess is false when the lookup 404s", async () => {
  const impl = async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => "" });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });
  assert.equal(await gh.hasWriteAccess("stranger"), false);
});

test("sends the token and the api version header", async () => {
  const { impl, calls } = fakeFetch({
    "GET /repos/apache/magpie-site/pulls/1": { number: 1 },
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "secret", fetchImpl: impl });
  await gh.getPull(1);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.authorization, "Bearer secret");
  assert.equal(calls[0].headers["x-github-api-version"], "2022-11-28");
});

test("listPreviewBranches returns only preview refs", async () => {
  const { impl } = fakeFetch({
    "GET /repos/apache/magpie-site/git/matching-refs/heads/preview/?per_page=100&page=1": [
      { ref: "refs/heads/preview/pr1-staging" },
      { ref: "refs/heads/preview/pr2-staging" },
    ],
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });
  assert.deepEqual(await gh.listPreviewBranches(), ["preview/pr1-staging", "preview/pr2-staging"]);
});

test("listComments follows pagination past the first page", async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i, body: "x" }));
  const { impl } = fakeFetch({
    "GET /repos/apache/magpie-site/issues/7/comments?per_page=100&page=1": page1,
    "GET /repos/apache/magpie-site/issues/7/comments?per_page=100&page=2": [{ id: 100, body: "/show-preview" }],
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });

  const all = await gh.listComments(7);
  assert.equal(all.length, 101);
  assert.equal(all.at(-1).body, "/show-preview");
});

test("upsertComment never edits a human comment that contains the marker", async () => {
  const planted = { id: 1, user: { type: "User" }, body: "look: <!-- magpie-preview-status -->" };
  const { impl, calls } = fakeFetch({
    "GET /repos/apache/magpie-site/issues/7/comments?per_page=100&page=1": [planted],
    "POST /repos/apache/magpie-site/issues/7/comments": { id: 2 },
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });

  await gh.upsertComment(7, "magpie-preview-status", "status");

  assert.ok(
    calls.every((c) => c.method !== "PATCH"),
    "must not PATCH a comment authored by a human",
  );
});

test("upsertComment edits the bot's own marked comment in place", async () => {
  const mine = { id: 9, user: { type: "Bot" }, body: "old\n\n<!-- magpie-preview-status -->" };
  const { impl, calls } = fakeFetch({
    "GET /repos/apache/magpie-site/issues/7/comments?per_page=100&page=1": [mine],
    "PATCH /repos/apache/magpie-site/issues/comments/9": { id: 9 },
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });

  await gh.upsertComment(7, "magpie-preview-status", "new status");

  const patch = calls.find((c) => c.method === "PATCH");
  assert.ok(patch, "expected a PATCH to the existing bot comment");
  assert.match(JSON.parse(patch.body).body, /new status/);
});
