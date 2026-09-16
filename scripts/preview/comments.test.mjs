import { test } from "node:test";
import assert from "node:assert/strict";
import { isShowPreviewComment } from "./comments.mjs";

test("matches the bare command", () => {
  assert.equal(isShowPreviewComment("/show-preview"), true);
});

test("tolerates surrounding whitespace and a trailing newline", () => {
  assert.equal(isShowPreviewComment("  /show-preview  \n"), true);
});

test("rejects the command quoted inside a sentence", () => {
  assert.equal(isShowPreviewComment("you can run /show-preview here"), false);
  assert.equal(isShowPreviewComment("`/show-preview`"), false);
  assert.equal(isShowPreviewComment("> /show-preview"), false);
});

test("rejects a command with trailing arguments", () => {
  assert.equal(isShowPreviewComment("/show-preview now"), false);
});

test("rejects multi-line bodies that merely contain it", () => {
  assert.equal(isShowPreviewComment("please:\n/show-preview"), false);
});

test("rejects empty and non-string input", () => {
  assert.equal(isShowPreviewComment(""), false);
  assert.equal(isShowPreviewComment(undefined), false);
  assert.equal(isShowPreviewComment(null), false);
});
