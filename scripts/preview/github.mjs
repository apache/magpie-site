const API = "https://api.github.com";

export function createClient({ repo, token, fetchImpl = fetch }) {
  async function request(path, { method = "GET", body } = {}) {
    const res = await fetchImpl(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const err = new Error(`${method} ${path} -> ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  /**
   * Follows pages until a short page arrives. An incomplete read here is not
   * cosmetic: a /show-preview comment missed on page 2 makes a PR look unarmed,
   * and an unarmed PR with a live preview gets tombstoned.
   */
  async function paginate(path) {
    const out = [];
    for (let page = 1; ; page += 1) {
      const sep = path.includes("?") ? "&" : "?";
      const batch = await request(`${path}${sep}per_page=100&page=${page}`);
      if (!Array.isArray(batch) || batch.length === 0) break;
      out.push(...batch);
      if (batch.length < 100) break;
    }
    return out;
  }

  return {
    request,

    listOpenPulls: () => paginate(`/repos/${repo}/pulls?state=open`),
    getPull: (n) => request(`/repos/${repo}/pulls/${n}`),
    listComments: (n) => paginate(`/repos/${repo}/issues/${n}/comments`),

    async hasWriteAccess(login) {
      try {
        const r = await request(`/repos/${repo}/collaborators/${login}/permission`);
        return r.permission === "write" || r.permission === "admin";
      } catch (e) {
        if (e.status === 403 || e.status === 404) return false;
        throw e;
      }
    },

    async upsertComment(n, marker, body) {
      // Two conditions, both required. The marker must be the exact trailing
      // HTML comment — a substring test lets anyone plant it — and the author
      // must be a Bot, so a human comment can never be PATCHed out from under
      // its author while still showing their name.
      const tag = `<!-- ${marker} -->`;
      const withMarker = `${body}\n\n${tag}`;

      const existing = (await paginate(`/repos/${repo}/issues/${n}/comments`)).find(
        (c) =>
          c?.user?.type === "Bot" &&
          typeof c.body === "string" &&
          c.body.trimEnd().endsWith(tag),
      );

      if (existing) {
        return request(`/repos/${repo}/issues/comments/${existing.id}`, {
          method: "PATCH",
          body: { body: withMarker },
        });
      }
      return request(`/repos/${repo}/issues/${n}/comments`, {
        method: "POST",
        body: { body: withMarker },
      });
    },

    async listPreviewBranches() {
      const refs = await paginate(`/repos/${repo}/git/matching-refs/heads/preview/`);
      return refs.map((r) => r.ref.replace("refs/heads/", ""));
    },

    deleteBranch: (name) =>
      request(`/repos/${repo}/git/refs/heads/${name}`, { method: "DELETE" }),

    async latestSuccessfulBuild(headSha) {
      const runs = await request(
        `/repos/${repo}/actions/workflows/build.yml/runs?head_sha=${headSha}&status=success&per_page=1`,
      );
      return runs.workflow_runs?.[0] ?? null;
    },

    artifactZipUrl: (artifactId) =>
      `${API}/repos/${repo}/actions/artifacts/${artifactId}/zip`,
  };
}
