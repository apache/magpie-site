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

test("previews are offered only for site changes, on both sides", async () => {
  // build.yml uploads a preview only when `changes` found a site change, and
  // the publisher explains previews only where one was uploaded. Either half
  // alone is wrong: the gate without the howto mode tells PRs with nothing to
  // preview how to preview it, and the mode without the gate changes nothing.
  const build = await workflow("build.yml");
  const publish = await workflow("preview-publish.yml");
  const upload = /- name: Upload the preview\n\s+if: (.*)\n\s+uses: apache\/infrastructure-actions\/website-comment\/preview-artifact@/.exec(build)?.[1];
  assert.equal(upload, "github.event_name == 'pull_request' && needs.changes.outputs.site == 'true'");
  assert.match(build, /^ {2}build:\n(?: *\n| {4}.*\n)*? {4}needs: \[changes, lint, browser\]$/m, "build waits for the decision");
  assert.match(publish, /^\s+howto: with-preview-artifact$/m);
});

test("the browser suites run on what `changes` decided, and on every other event", async () => {
  const build = await workflow("build.yml");
  const job = /^ {2}browser:\n((?: *\n| {4}.*\n)+)/m.exec(build)?.[1] ?? "";
  assert.match(job, /^ {4}needs: changes$/m);
  assert.match(
    job,
    /^ {4}if: \$\{\{ !cancelled\(\) && github\.event_name != 'push' && \(github\.event_name != 'pull_request' \|\| needs\.changes\.outputs\.browser == 'true'\) \}\}$/m,
    "skipped only on a pull request that changes neither the site nor the suites",
  );
});

test("ci-passed, the one required check, waits for every job and always runs", async () => {
  // A job left out of its needs could fail without blocking a merge.
  const build = await workflow("build.yml");
  const jobs = [...build.slice(build.indexOf("\njobs:\n")).matchAll(/^ {2}([a-z][\w-]*):$/gm)].map((m) => m[1]);
  const job = /^ {2}ci-passed:\n((?: *\n| {4}.*\n)+)/m.exec(build)?.[1] ?? "";
  const needs = /^ {4}needs: \[(.*)\]$/m.exec(job)?.[1].split(/,\s*/) ?? [];
  assert.deepEqual(needs.sort(), jobs.filter((j) => !["ci-passed", "deploy"].includes(j)).sort());
  assert.match(job, /^ {4}if: \$\{\{ always\(\) \}\}$/m);
  const asf = await readFile(new URL("../.asf.yaml", import.meta.url), "utf8");
  assert.match(asf, /^ {12}required_status_checks:\n {14}- context: ci-passed\n(?! {14}-)/m, ".asf.yaml requires ci-passed, and only it");
});
