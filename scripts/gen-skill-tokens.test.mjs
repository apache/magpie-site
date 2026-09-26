import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readMeasuredTokens, renderTable, fillMarker, collectRows, MARKER_RE } from "./gen-skill-tokens.mjs";

const skill = (stamp) =>
  `---\nname: x\nsurface_hash: sha256:0123456789abcdef\nlicense: Apache-2.0\n${stamp}---\nbody\n`;

test("reads the measured_tokens stamp from frontmatter", () => {
  assert.equal(readMeasuredTokens(skill("measured_tokens: 4820\n")), 4820);
});

test("returns null when the stamp is missing or malformed", () => {
  assert.equal(readMeasuredTokens(skill("")), null);
  assert.equal(readMeasuredTokens(skill("measured_tokens: 1,234\n")), null);
  assert.equal(readMeasuredTokens(skill("measured_tokens: 0\n")), null);
  assert.equal(readMeasuredTokens("no frontmatter"), null);
});

test("ignores a measured_tokens line in the body", () => {
  assert.equal(readMeasuredTokens(`---\nname: x\n---\nmeasured_tokens: 99\n`), null);
});

test("renders rows with thousands separators and framework-relative links", () => {
  const table = renderTable([{ name: "audit-finding-fix", tokens: 6148 }]);
  assert.match(table, /\| \[audit-finding-fix\]\(\.\.\/skills\/audit-finding-fix\/SKILL\.md\) \| 6,148 \|/);
});

test("matches the marker apache/magpie ships", () => {
  const marker =
    "<!-- SKILL TOKEN TABLE — the website build replaces this marker with the output of `skill-token-count --table`. -->";
  assert.ok(MARKER_RE.test(`before\n${marker}\nafter`));
});

test("fills the marker and leaves the rest of the page alone", () => {
  const doc = "before\n<!-- SKILL TOKEN TABLE x -->\nafter\n";
  assert.equal(fillMarker(doc, "TABLE"), "before\nTABLE\nafter\n");
});

test("leaves a page without the marker untouched", () => {
  assert.equal(fillMarker("an older page with its own table", "TABLE"), "an older page with its own table");
});

test("a table containing $-patterns is inserted literally", () => {
  assert.equal(fillMarker("<!-- SKILL TOKEN TABLE -->", "$& $1"), "$& $1");
});

test("collects stamped skills in order and reports unstamped ones", () => {
  const dir = mkdtempSync(join(tmpdir(), "skills-"));
  for (const [name, stamp] of [["b-skill", "measured_tokens: 20\n"], ["a-skill", "measured_tokens: 10\n"], ["c-skill", ""]]) {
    mkdirSync(join(dir, name));
    writeFileSync(join(dir, name, "SKILL.md"), skill(stamp));
  }
  mkdirSync(join(dir, "not-a-skill"));
  const { rows, unstamped } = collectRows(dir);
  assert.deepEqual(rows, [{ name: "a-skill", tokens: 10 }, { name: "b-skill", tokens: 20 }]);
  assert.deepEqual(unstamped, ["c-skill"]);
});
