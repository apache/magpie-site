import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveArmed } from "./armed.mjs";

const comment = (body, login) => ({ body, user: { login } });
const writers = (...logins) => async (login) => logins.includes(login);

test("arms when a writer posts the command", async () => {
  const result = await resolveArmed({
    comments: [comment("/show-preview", "maintainer")],
    hasWriteAccess: writers("maintainer"),
  });
  assert.deepEqual(result, { armed: true, by: "maintainer" });
});

test("does not arm when a non-writer posts the command", async () => {
  const result = await resolveArmed({
    comments: [comment("/show-preview", "drive-by")],
    hasWriteAccess: writers("maintainer"),
  });
  assert.deepEqual(result, { armed: false, by: null });
});

test("reports the first writer who armed it", async () => {
  const result = await resolveArmed({
    comments: [
      comment("looks good", "maintainer"),
      comment("/show-preview", "second"),
      comment("/show-preview", "maintainer"),
    ],
    hasWriteAccess: writers("maintainer", "second"),
  });
  assert.equal(result.by, "second");
});

test("checks each author at most once", async () => {
  let calls = 0;
  const result = await resolveArmed({
    comments: [
      comment("/show-preview", "drive-by"),
      comment("/show-preview", "drive-by"),
      comment("/show-preview", "drive-by"),
    ],
    hasWriteAccess: async () => {
      calls += 1;
      return false;
    },
  });
  assert.equal(result.armed, false);
  assert.equal(calls, 1);
});

test("is unarmed with no comments", async () => {
  const result = await resolveArmed({ comments: [], hasWriteAccess: writers("x") });
  assert.deepEqual(result, { armed: false, by: null });
});
