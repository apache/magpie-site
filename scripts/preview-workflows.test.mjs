/**
 * The privilege boundary of this repository's preview workflows, checked
 * deterministically.
 *
 * The publisher itself — its GitHub projections, endpoint allowlist and
 * artifact screening — is the preview-publish action from
 * apache/infrastructure-actions (website-comment), tested there. What stays
 * here is the wrapper that holds the write token: it must never use
 * pull_request_target, never check out or fetch anything, and hand the action
 * no event data beyond the dispatch input. The signal workflow must hold no
 * permissions and run nothing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = async (name) =>
  (await readFile(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8"))
    .split("\n")
    // Drop comment lines and trailing comments; the header prose names the
    // forbidden things on purpose.
    .map((line) => line.replace(/(^|\s)#.*$/, ""))
    .join("\n");

test("preview workflows never use pull_request_target", async () => {
  assert.doesNotMatch(await workflow("preview-publish.yml"), /pull_request_target/);
  assert.doesNotMatch(await workflow("preview-signal.yml"), /pull_request_target/);
});

test("preview-publish.yml triggers only on signals that run default-branch code", async () => {
  const text = await workflow("preview-publish.yml");
  const on = /\n"?on"?:\n((?: {2}.*\n)+)/.exec(text)?.[1] ?? "";
  const triggers = [...on.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]).sort();
  assert.deepEqual(triggers, ["issue_comment", "workflow_dispatch", "workflow_run"]);
});

test("preview-publish.yml runs only the pinned publisher, and fetches no code", async () => {
  const text = await workflow("preview-publish.yml");
  const uses = [...text.matchAll(/^\s+(?:-\s+)?uses:\s*(\S+)/gm)].map((m) => m[1]);
  assert.equal(uses.length, 1, "exactly one action");
  assert.match(
    uses[0],
    /^apache\/infrastructure-actions\/website-comment\/preview-publish@[0-9a-f]{40}$/,
    "the publisher, pinned to a full commit SHA",
  );
  assert.doesNotMatch(text, /actions\/checkout/, "the publisher needs no checkout");
  assert.doesNotMatch(text, /download-artifact/, "the artifact is fetched and screened by the action only");
  assert.doesNotMatch(text, /^\s+run:/m, "no inline scripts beside the action");
});

test("no step in the publisher receives event data", async () => {
  const text = await workflow("preview-publish.yml");

  // Every ${{ }} expression: the action may only see the dispatch input.
  const exprs = [...text.matchAll(/\$\{\{\s*(.*?)\s*\}\}/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(exprs)], ["inputs.pr"]);

  // Every github.* context read anywhere: only the job's bare `if:` gate.
  const contexts = new Set([...text.matchAll(/\bgithub\.[A-Za-z_.*]+/g)].map((m) => m[0]));
  assert.deepEqual([...contexts].sort(), [
    "github.event.issue.pull_request",
    "github.event.workflow_run.event",
    "github.event_name",
  ]);
});

test("preview-signal.yml has no permissions, no checkout and no expressions", async () => {
  const text = await workflow("preview-signal.yml");
  assert.match(text, /^permissions: \{\}$/m);
  assert.doesNotMatch(text, /uses:/, "the signal runs no action");
  assert.doesNotMatch(text, /\$\{\{/, "the signal reads nothing from the event");
});
