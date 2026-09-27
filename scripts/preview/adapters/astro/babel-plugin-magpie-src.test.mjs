import { test } from "node:test";
import assert from "node:assert/strict";
import { transformSync } from "@babel/core";
import plugin from "./babel-plugin-magpie-src.mjs";

const run = (code, filename = "/repo/src/components/Thing.tsx") =>
  transformSync(code, {
    filename,
    root: "/repo",
    plugins: [[plugin, { root: "/repo" }]],
    parserOpts: { plugins: ["jsx", "typescript"] },
    configFile: false,
    babelrc: false,
  }).code;

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
