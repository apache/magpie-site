import { test } from "node:test";
import assert from "node:assert/strict";
import { unsafeArchiveEntries } from "./artifact.mjs";

test("flags an absolute path entry", () => {
  assert.deepEqual(unsafeArchiveEntries("/etc/passwd"), ["/etc/passwd"]);
});

test("flags a traversing path entry", () => {
  assert.deepEqual(unsafeArchiveEntries("../../evil.html"), ["../../evil.html"]);
});

test("flags a traversal nested mid-path", () => {
  assert.deepEqual(unsafeArchiveEntries("assets/../../evil.html"), ["assets/../../evil.html"]);
});

test("flags a backslash path", () => {
  assert.deepEqual(unsafeArchiveEntries("..\\evil"), ["..\\evil"]);
});

test("flags a tilde-rooted path", () => {
  assert.deepEqual(unsafeArchiveEntries("~/evil"), ["~/evil"]);
});

test("allows a clean listing", () => {
  assert.deepEqual(unsafeArchiveEntries("index.html\nassets/app.js"), []);
});

test("returns empty for empty input", () => {
  assert.deepEqual(unsafeArchiveEntries(""), []);
});

test("returns empty for null input", () => {
  assert.deepEqual(unsafeArchiveEntries(null), []);
});

test("returns empty for undefined input", () => {
  assert.deepEqual(unsafeArchiveEntries(undefined), []);
});

test("ignores blank lines between entries", () => {
  assert.deepEqual(unsafeArchiveEntries("index.html\n\nassets/app.js\n"), []);
});

test("collects multiple unsafe entries from a mixed listing", () => {
  const listing = "index.html\n/etc/passwd\nassets/app.js\n../evil.html";
  assert.deepEqual(unsafeArchiveEntries(listing), ["/etc/passwd", "../evil.html"]);
});
