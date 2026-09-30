import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { githubSourceUrl } from "./github-source.mjs";

const BLOB = "https://github.com/apache/magpie/blob/main";
const TREE = "https://github.com/apache/magpie/tree/main";

// The framework layout: skills/<name> is a symlink into the owning plugin.
function checkout() {
  const root = mkdtempSync(join(tmpdir(), "magpie-checkout-"));
  mkdirSync(join(root, "plugins/magpie-security/skills/issue-triage"), { recursive: true });
  writeFileSync(join(root, "plugins/magpie-security/skills/issue-triage/SKILL.md"), "---\n");
  mkdirSync(join(root, "skills"));
  symlinkSync("../plugins/magpie-security/skills/issue-triage", join(root, "skills/security-issue-triage"));
  writeFileSync(join(root, "README.md"), "# Magpie\n");
  return root;
}

test("a link through a symlinked skill directory names the real file", () => {
  assert.equal(
    githubSourceUrl(checkout(), "skills/security-issue-triage/SKILL.md", "#inputs"),
    `${BLOB}/plugins/magpie-security/skills/issue-triage/SKILL.md#inputs`,
  );
});

test("the symlinked skill directory itself is linked as its real tree", () => {
  assert.equal(
    githubSourceUrl(checkout(), "skills/security-issue-triage/"),
    `${TREE}/plugins/magpie-security/skills/issue-triage`,
  );
});

test("real paths are linked as blob or tree by what they are", () => {
  const root = checkout();
  assert.equal(githubSourceUrl(root, "README.md", "#install"), `${BLOB}/README.md#install`);
  assert.equal(githubSourceUrl(root, "plugins/magpie-security"), `${TREE}/plugins/magpie-security`);
});

test("a path outside the checkout keeps its spelling and is typed by extension", () => {
  const root = checkout();
  assert.equal(githubSourceUrl(root, ".github/workflows/ci.yml"), `${BLOB}/.github/workflows/ci.yml`);
  assert.equal(githubSourceUrl(root, "projects/airflow/"), `${TREE}/projects/airflow/`);
});
