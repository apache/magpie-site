// Link a path in the apache/magpie checkout to its GitHub source page.
//
// GitHub serves a file or directory only at its real location. The framework's
// skills/<name> entries are symlinks into plugins/<family>/skills/<skill>, and a
// URL through one (skills/<name>/SKILL.md) is a 404. The path is resolved in the
// checkout first so the URL names the real file. A path the checkout does not
// hold (outside the sparse set) is linked as written.
import fs from "node:fs";
import path from "node:path";

const GITHUB = "https://github.com/apache/magpie";

/**
 * @param {string} root  the apache/magpie checkout
 * @param {string} repoPath  a normalized repo-relative path
 * @param {string} [hash]  a fragment to keep, including its leading "#"
 */
export function githubSourceUrl(root, repoPath, hash = "") {
  let real = repoPath;
  let isFile = /\.[a-z0-9]+$/i.test(repoPath.replace(/\/$/, ""));
  try {
    const top = fs.realpathSync(root);
    const resolved = fs.realpathSync(path.join(top, repoPath));
    const rel = path.relative(top, resolved);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      real = rel.split(path.sep).join("/");
      isFile = fs.statSync(resolved).isFile();
    }
  } catch {
    // Not in the checkout: keep the path and guess blob/tree from its extension.
  }
  return `${GITHUB}/${isFile ? "blob" : "tree"}/main/${real}${hash}`;
}
