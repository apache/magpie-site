// Decide, from a pull request's changed files, what its CI run needs.
//
// `site`: it changes what the site is built from (.github/site-paths.txt), so
// it gets a preview. `browser`: it changes the site or what the browser suites
// are made of (.github/browser-test-paths.txt), so the suites run. A pull
// request touching only workflows, repository settings or docs for agents
// gets neither. Runs in build.yml's unprivileged `changes` job, and writes
// both answers to $GITHUB_OUTPUT.
import { appendFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);

/** The entries of a paths file: one per line, without blanks or `#` comments. */
export function parsePaths(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

/** Whether a repository path is one of `entries`: `dir/` covers everything under it. */
export function matches(file, entries) {
  return entries.some((entry) => (entry.endsWith("/") ? file.startsWith(entry) : file === entry));
}

/**
 * Whether any changed file is one of `entries`. A rename counts under its old
 * name too: moving a file out of the site changes the site.
 */
export function touches(files, entries) {
  return files.some((f) => [f?.filename, f?.previous_filename].some((name) => typeof name === "string" && matches(name, entries)));
}

/**
 * Both decisions for these changed files. `files` is null when they could not
 * be listed, and then everything runs: a preview or a test run nobody needed
 * costs less than a site change that went untested.
 */
export function decide(files, { site, tests }) {
  if (files === null) return { site: true, browser: true };
  const changesSite = touches(files, site);
  return { site: changesSite, browser: changesSite || touches(files, tests) };
}

export async function readPaths(name) {
  return parsePaths(await readFile(new URL(`.github/${name}`, ROOT), "utf8"));
}

async function listFiles({ repo, pr, token }) {
  const files = [];
  for (let page = 1; ; page += 1) {
    const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${pr}/files?per_page=100&page=${page}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
    });
    if (!res.ok) throw new Error(`listing the pull request's files failed with ${res.status}`);
    const batch = await res.json();
    files.push(...batch);
    if (batch.length < 100) return files;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { GITHUB_REPOSITORY: repo, GITHUB_TOKEN: token, PR_NUMBER: pr, GITHUB_OUTPUT: out } = process.env;
  if (!/^\d+$/.test(String(pr)) || !out) {
    console.error("PR_NUMBER and GITHUB_OUTPUT are required");
    process.exit(1);
  }
  let files = null;
  try {
    files = await listFiles({ repo, pr, token });
  } catch (err) {
    console.error(`::warning::${err.message}; running everything`);
  }
  const result = decide(files, { site: await readPaths("site-paths.txt"), tests: await readPaths("browser-test-paths.txt") });
  console.log(`preview: ${result.site ? "yes" : "no"}; browser suites: ${result.browser ? "yes" : "no"}`);
  await appendFile(out, `site=${result.site}\nbrowser=${result.browser}\n`);
}
