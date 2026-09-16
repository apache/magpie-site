import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateMeta, findUnsafeEntries } from "./validate.mjs";

const expected = { number: 42, headSha: "a".repeat(40) };

test("accepts metadata matching the PR", () => {
  const meta = { pr: 42, headSha: "a".repeat(40) };
  assert.deepEqual(validateMeta(meta, expected), { ok: true });
});

test("accepts a PR number given as a digit string", () => {
  const meta = { pr: "42", headSha: "a".repeat(40) };
  assert.deepEqual(validateMeta(meta, expected), { ok: true });
});

test("rejects a PR number that is not digits", () => {
  const meta = { pr: "42; rm -rf /", headSha: "a".repeat(40) };
  assert.equal(validateMeta(meta, expected).ok, false);
});

test("rejects a PR number claiming a different PR", () => {
  const meta = { pr: 7, headSha: "a".repeat(40) };
  const result = validateMeta(meta, expected);
  assert.equal(result.ok, false);
  assert.match(result.reason, /pr/i);
});

test("rejects a head SHA that is not the PR's current head", () => {
  const meta = { pr: 42, headSha: "b".repeat(40) };
  const result = validateMeta(meta, expected);
  assert.equal(result.ok, false);
  assert.match(result.reason, /sha/i);
});

test("rejects a malformed or missing SHA", () => {
  assert.equal(validateMeta({ pr: 42, headSha: "abc" }, expected).ok, false);
  assert.equal(validateMeta({ pr: 42 }, expected).ok, false);
  assert.equal(validateMeta(null, expected).ok, false);
});

test("finds symlinks in an extracted tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "preview-"));
  await mkdir(join(root, "sub"), { recursive: true });
  await writeFile(join(root, "sub", "index.html"), "<h1>ok</h1>");
  await symlink("/etc/passwd", join(root, "sub", "leak"));

  const unsafe = await findUnsafeEntries(root);
  assert.deepEqual(unsafe, ["sub/leak"]);
});

test("flags a symlinked directory without walking into it", async () => {
  const outside = await mkdtemp(join(tmpdir(), "preview-outside-"));
  await writeFile(join(outside, "secret.txt"), "should never be walked");

  const root = await mkdtemp(join(tmpdir(), "preview-"));
  await writeFile(join(root, "index.html"), "<h1>ok</h1>");
  await symlink(outside, join(root, "escape"));

  const unsafe = await findUnsafeEntries(root);
  assert.deepEqual(unsafe, ["escape"]);
  assert.ok(
    !unsafe.some((p) => p.includes("secret.txt")),
    "the walk must not descend through a symlinked directory",
  );
});

test("reports nothing for a clean tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "preview-"));
  await writeFile(join(root, "index.html"), "<h1>ok</h1>");
  assert.deepEqual(await findUnsafeEntries(root), []);
});
