import { isShowPreviewComment } from "./comments.mjs";

/**
 * Armed means a maintainer said so, in a comment.
 *
 * Write access is resolved per author rather than read from
 * author_association, which is a weaker signal. Results are memoised so a PR
 * spammed with the command costs one permission lookup per distinct author.
 */
export async function resolveArmed({ comments, hasWriteAccess }) {
  const seen = new Map();

  for (const c of comments) {
    if (!isShowPreviewComment(c?.body)) continue;
    const login = c?.user?.login;
    if (!login) continue;

    if (!seen.has(login)) seen.set(login, await hasWriteAccess(login));
    if (seen.get(login)) return { armed: true, by: login };
  }

  return { armed: false, by: null };
}
