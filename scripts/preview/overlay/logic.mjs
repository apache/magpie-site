const MIN_SIDE = 12;

/** Normalise a drag into a viewport-clipped rectangle, or null if it is a stray click. */
export function clampRegion({ x1, y1, x2, y2 }, viewport) {
  // Clamp both corners into the viewport before measuring, so an off-screen
  // drag yields a zero-size region rather than a negative one. Relying on the
  // minimum-size check to reject negatives works, but only by coincidence.
  const left = Math.min(Math.max(0, Math.min(x1, x2)), viewport.w);
  const top = Math.min(Math.max(0, Math.min(y1, y2)), viewport.h);
  const right = Math.min(Math.max(0, Math.max(x1, x2)), viewport.w);
  const bottom = Math.min(Math.max(0, Math.max(y1, y2)), viewport.h);

  const x = left;
  const y = top;
  const w = right - left;
  const h = bottom - top;

  if (w < MIN_SIDE || h < MIN_SIDE) return null;
  return { x, y, w, h };
}

/**
 * Burned into the image rather than written beside it: a caption survives being
 * dragged into a comment, quoted or downloaded, where a separate line would not.
 */
export function captionFor({ url, source, region, sha }) {
  const where = source ?? "source not resolved";
  return `${url} — ${where} — ${region.w}×${region.h} at (${region.x},${region.y}) — built from ${sha}`;
}

/**
 * The Files tab anchored at the marked line when that line is part of the diff,
 * and the Conversation tab otherwise. It never guesses a line.
 */
export function targetUrl({ repo, pr, source, anchors }) {
  const conversation = `https://github.com/${repo}/pull/${pr}`;
  if (!source || !anchors) return conversation;

  const match = /^(.*):(\d+)$/.exec(source);
  if (!match) return conversation;

  const [, file, lineText] = match;
  const line = Number(lineText);
  const entry = anchors[file];
  if (!entry?.anchor) return conversation;

  const inDiff = (entry.ranges ?? []).some(([from, to]) => line >= from && line <= to);
  if (!inDiff) return conversation;

  return `https://github.com/${repo}/pull/${pr}/files#${entry.anchor}R${line}`;
}

/**
 * The marked source line on the branch it was built from, or null when the
 * source is unresolved or lives in a generated tree whose files are not in
 * this repository (the docs pages are synced from apache/magpie).
 */
export function sourceUrl({ repo, branch, source, generated = [] }) {
  const match = /^(.*):(\d+)$/.exec(String(source ?? ""));
  if (!match) return null;
  const [, file, line] = match;
  if (generated.some((prefix) => file.startsWith(prefix))) return null;
  return `https://github.com/${repo}/blob/${branch}/${file}#L${line}`;
}

/**
 * A new issue about the marked region, prefilled with where it is. The
 * screenshot is on the clipboard (or downloaded): GitHub cannot take it in a
 * URL, so the body asks for it to be pasted.
 */
export function issueUrl({ repo, branch, pageUrl, source, generated = [], sha }) {
  const page = new URL(pageUrl);
  const link = sourceUrl({ repo, branch, source, generated });
  const body = [
    `**Page:** ${pageUrl}`,
    link ? `**Source:** ${link}` : null,
    sha ? `**Built from:** \`${sha}\`` : null,
    "",
    "<!-- The screenshot of the marked region is on your clipboard: paste it here. -->",
    "",
    "",
    "**What should change?**",
    "",
  ].filter((line) => line !== null).join("\n");
  const title = `Feedback on ${page.pathname}`;
  return `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
