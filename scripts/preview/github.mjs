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

  return {
    request,

    listOpenPulls: () => request(`/repos/${repo}/pulls?state=open&per_page=100`),
    getPull: (n) => request(`/repos/${repo}/pulls/${n}`),
    listComments: (n) => request(`/repos/${repo}/issues/${n}/comments?per_page=100`),

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
      const withMarker = `${body}\n\n<!-- ${marker} -->`;
      const existing = (await request(`/repos/${repo}/issues/${n}/comments?per_page=100`))
        .find((c) => typeof c.body === "string" && c.body.includes(`<!-- ${marker} -->`));

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
      const refs = await request(`/repos/${repo}/git/matching-refs/heads/preview/`);
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
