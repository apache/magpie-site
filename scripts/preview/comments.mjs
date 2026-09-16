/**
 * A PR is armed by a comment whose entire body is the command.
 *
 * Anchored deliberately: a substring search would arm a PR from any comment
 * that merely mentions the command while discussing it.
 */
export function isShowPreviewComment(body) {
  if (typeof body !== "string") return false;
  return /^\s*\/show-preview\s*$/.test(body);
}
