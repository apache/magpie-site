import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { decide, matches, parsePaths, readPaths, touches } from "./pr-changes.mjs";

const files = (...names) => names.map((filename) => ({ filename }));
const lists = { site: ["src/", "package.json"], tests: ["tests/", "playwright.config.mjs"] };

test("paths files hold one entry per line, without blanks or comments", () => {
  assert.deepEqual(parsePaths("# about\n\nsrc/\n  package.json  \n"), ["src/", "package.json"]);
});

test("a directory entry covers everything under it, a file entry only itself", () => {
  assert.ok(matches("src/pages/index.astro", ["src/"]));
  assert.ok(!matches("srcs/x", ["src/"]));
  assert.ok(!matches("docs/src/x", ["src/"]));
  assert.ok(matches("package.json", ["package.json"]));
  assert.ok(!matches("scripts/package.json", ["package.json"]));
  assert.ok(!matches("package.json.bak", ["package.json"]));
});

test("a rename counts under its old name too", () => {
  assert.ok(touches([{ filename: "attic/a.astro", previous_filename: "src/a.astro" }], ["src/"]));
});

test("a site change gets a preview and runs the browser suites", () => {
  assert.deepEqual(decide(files(".asf.yaml", "src/a.astro"), lists), { site: true, browser: true });
});

test("a test-only change runs the browser suites without a preview", () => {
  assert.deepEqual(decide(files("tests/browser/site.spec.mjs"), lists), { site: false, browser: true });
});

test("a change to neither gets neither", () => {
  assert.deepEqual(decide(files(".github/workflows/build.yml", ".asf.yaml", "AGENTS.md"), lists), { site: false, browser: false });
});

test("when the files could not be listed, everything runs", () => {
  assert.deepEqual(decide(null, lists), { site: true, browser: true });
});

test("every listed path exists, and directories are written as dir/", async () => {
  // A path renamed or deleted without updating the list would silently stop
  // previewing, or testing, whatever it named.
  for (const name of ["site-paths.txt", "browser-test-paths.txt"]) {
    const entries = await readPaths(name);
    assert.ok(entries.length > 0, `${name} lists something`);
    for (const entry of entries) {
      const path = new URL(`../${entry}`, import.meta.url);
      assert.ok(existsSync(path), `${name}: ${entry} exists`);
      assert.equal(statSync(path).isDirectory(), entry.endsWith("/"), `${name}: ${entry} is written as ${statSync(path).isDirectory() ? "a directory" : "a file"}`);
    }
  }
});

test("the site, the suites and their wiring are all covered", async () => {
  const site = await readPaths("site-paths.txt");
  const tests = await readPaths("browser-test-paths.txt");
  for (const file of ["src/pages/index.astro", "public/favicon.svg", "package-lock.json", "astro.config.mjs", "docs/designs/x.md"]) {
    assert.ok(matches(file, site), `${file} is a site path`);
  }
  for (const file of ["tests/browser/site.spec.mjs", "playwright.config.mjs", ".github/workflows/browser-tests.yml", ".github/actions/playwright-chromium/action.yml", ".github/site-paths.txt"]) {
    assert.ok(matches(file, [...site, ...tests]), `${file} runs the browser suites`);
  }
  assert.ok(!matches(".github/workflows/build.yml", [...site, ...tests]), "a workflow-only change is not a site change");
});
