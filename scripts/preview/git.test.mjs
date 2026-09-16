import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareTree, redactToken } from "./git.mjs";

const missing = async (p) => {
  try {
    await access(p);
    return false;
  } catch {
    return true;
  }
};

test("redactToken removes every occurrence", () => {
  const msg = "Command failed: git push https://x-access-token:SEKRET@github.com/x SEKRET";
  assert.equal(redactToken(msg, "SEKRET").includes("SEKRET"), false);
  assert.match(redactToken(msg, "SEKRET"), /\*\*\*/);
});

test("redactToken tolerates an empty token and null text", () => {
  assert.equal(redactToken("plain", ""), "plain");
  assert.equal(redactToken(null, "t"), "");
});

test("prepareTree deletes a .git directory shipped inside the artifact", async () => {
  // git init would REINITIALISE this, keeping its hooks, and the commit would
  // then run them in the job holding the push token.
  const content = await mkdtemp(join(tmpdir(), "preview-content-"));
  await mkdir(join(content, ".git", "hooks"), { recursive: true });
  await writeFile(join(content, ".git", "hooks", "pre-commit"), "#!/bin/sh\necho pwned\n");
  await writeFile(join(content, "index.html"), "<h1>site</h1>");

  const dir = await mkdtemp(join(tmpdir(), "preview-tree-"));
  await prepareTree({ dir, files: { "robots.txt": "User-agent: *\nDisallow: /\n" }, contentDir: content });

  assert.ok(await missing(join(dir, ".git")), ".git must not survive into the commit");
  assert.deepEqual((await readdir(dir)).sort(), ["index.html", "robots.txt"]);
});

test("prepareTree deletes a .gitignore shipped inside the artifact", async () => {
  // Otherwise `git add` would silently drop our generated files.
  const content = await mkdtemp(join(tmpdir(), "preview-content-"));
  await writeFile(join(content, ".gitignore"), "robots.txt\n.asf.yaml\n");
  await writeFile(join(content, "index.html"), "<h1>site</h1>");

  const dir = await mkdtemp(join(tmpdir(), "preview-tree-"));
  await prepareTree({ dir, files: { "robots.txt": "Disallow: /\n" }, contentDir: content });

  assert.ok(await missing(join(dir, ".gitignore")));
  assert.equal(await readFile(join(dir, "robots.txt"), "utf8"), "Disallow: /\n");
});

test("generated files win over files of the same name in the artifact", async () => {
  const content = await mkdtemp(join(tmpdir(), "preview-content-"));
  await writeFile(join(content, ".asf.yaml"), "staging:\n  profile: attacker\n");

  const dir = await mkdtemp(join(tmpdir(), "preview-tree-"));
  await prepareTree({ dir, files: { ".asf.yaml": "staging:\n  profile: pr5\n" }, contentDir: content });

  assert.match(await readFile(join(dir, ".asf.yaml"), "utf8"), /profile: pr5/);
});

test("prepareTree strips preview-meta.json", async () => {
  const content = await mkdtemp(join(tmpdir(), "preview-content-"));
  await writeFile(join(content, "preview-meta.json"), '{"pr":5}');
  await writeFile(join(content, "index.html"), "<h1>site</h1>");

  const dir = await mkdtemp(join(tmpdir(), "preview-tree-"));
  await prepareTree({ dir, files: {}, contentDir: content });

  assert.ok(await missing(join(dir, "preview-meta.json")));
});
