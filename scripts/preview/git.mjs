import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = promisify(execFile);

export function createGit({ repo, token }) {
  const remote = `https://x-access-token:${token}@github.com/${repo}.git`;

  return {
    async headMessage(branch) {
      try {
        const { stdout } = await run("git", ["ls-remote", remote, `refs/heads/${branch}`]);
        if (!stdout.trim()) return "";
        const dir = await mkdtemp(join(tmpdir(), "preview-head-"));
        await run("git", ["init", "-q", dir]);
        await run("git", ["-C", dir, "fetch", "-q", "--depth", "1", remote, branch]);
        const { stdout: msg } = await run("git", ["-C", dir, "log", "-1", "--format=%s", "FETCH_HEAD"]);
        await rm(dir, { recursive: true, force: true });
        return msg.trim();
      } catch {
        return "";
      }
    },

    /** Force-push an orphan commit containing contentDir plus generated files. */
    async pushTree(branch, files, message, contentDir = null) {
      const dir = await mkdtemp(join(tmpdir(), "preview-push-"));
      if (contentDir) await cp(contentDir, dir, { recursive: true });

      for (const [name, body] of Object.entries(files)) {
        await writeFile(join(dir, name), body);
      }
      await rm(join(dir, "preview-meta.json"), { force: true });

      await run("git", ["init", "-q", dir]);
      await run("git", ["-C", dir, "checkout", "-q", "-b", branch]);
      await run("git", ["-C", dir, "config", "user.name", "github-actions[bot]"]);
      await run("git", ["-C", dir, "config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
      await run("git", ["-C", dir, "add", "-A"]);
      await run("git", ["-C", dir, "commit", "-q", "-m", `${message}\n\nGenerated-by: preview-publish\n`]);
      await run("git", ["-C", dir, "push", "-f", remote, branch]);
      await rm(dir, { recursive: true, force: true });
    },
  };
}
