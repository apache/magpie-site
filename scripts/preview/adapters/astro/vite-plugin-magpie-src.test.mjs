import { test } from "node:test";
import assert from "node:assert/strict";
import { stampSource } from "./vite-plugin-magpie-src.mjs";

const run = (code, filename = "/repo/src/components/Thing.tsx") =>
  stampSource(code, filename, "/repo");

test("stamps a host element with its repo-relative path and line", () => {
  const out = run("const a = <div>hi</div>;");
  assert.match(out, /data-magpie-src="src\/components\/Thing\.tsx:1"/);
});

test("leaves component elements alone", () => {
  // A component renders host elements of its own, which get stamped there.
  const out = run("const a = <Thing prop={1} />;");
  assert.doesNotMatch(out, /data-magpie-src/);
});

test("does not overwrite an existing attribute", () => {
  const out = run('const a = <div data-magpie-src="kept" />;');
  assert.match(out, /data-magpie-src="kept"/);
  assert.equal(out.match(/data-magpie-src/g).length, 1);
});

test("records the line each element starts on", () => {
  const out = run("const a = (\n  <div>\n    <span>x</span>\n  </div>\n);");
  assert.match(out, /data-magpie-src="src\/components\/Thing\.tsx:2"/);
  assert.match(out, /data-magpie-src="src\/components\/Thing\.tsx:3"/);
});

test("parses TypeScript and inserts at the right place after non-ASCII text", () => {
  const out = run("const s: string = 'é—✓';\nconst a = <p title={s}>naïve</p>;");
  assert.ok(out.includes('<p data-magpie-src="src/components/Thing.tsx:2" title={s}>'), out);
});

test("leaves unparsable source untouched", () => {
  const code = "const a = <div>;";
  assert.equal(run(code), code);
});
