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
