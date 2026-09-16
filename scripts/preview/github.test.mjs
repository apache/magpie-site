import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "./github.mjs";

function fakeFetch(routes) {
  const calls = [];
  const impl = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? "GET", body: options.body });
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
});

test("listPreviewBranches returns only preview refs", async () => {
  const { impl } = fakeFetch({
    "GET /repos/apache/magpie-site/git/matching-refs/heads/preview/": [
      { ref: "refs/heads/preview/pr1-staging" },
      { ref: "refs/heads/preview/pr2-staging" },
    ],
  });
  const gh = createClient({ repo: "apache/magpie-site", token: "t", fetchImpl: impl });
  assert.deepEqual(await gh.listPreviewBranches(), ["preview/pr1-staging", "preview/pr2-staging"]);
});
