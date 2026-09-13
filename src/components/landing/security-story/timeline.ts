// The cursor maths, kept free of React so it is a plain module: importable by a
// test runner (this repo has none yet) and runnable directly by node's type
// stripping. See useTimeline.ts for the clock that drives it.
import type { Beat, Chapter } from "./script";

/**
 * A beat's content plays over its own `ms`; then every beat holds this long on
 * its finished state before the story moves on. Kept out of `ms` so the hold is
 * a beat of silence rather than a slower performance — folding it into `ms`
 * would just stretch the typing.
 */
export const BEAT_HOLD_MS = 1_000;

/** Total run length of a script, holds included. */
export function totalMs(script: Chapter[]): number {
  return script.reduce(
    (sum, chapter) =>
      sum + chapter.beats.reduce((s, b) => s + b.ms + BEAT_HOLD_MS, 0),
    0,
  );
}

export type Cursor = {
  chapterIndex: number;
  beatIndex: number;
  /** 0→1 through the current beat. */
  progress: number;
  beat: Beat;
};

/**
 * Where the story is at `elapsed` milliseconds.
 *
 * Pure, and the reason the rest of this component is simple: because any
 * elapsed value maps straight onto a renderable cursor, jumping to a chapter is
 * just assigning `elapsed`. No scene needs to know how to fast-forward itself.
 *
 * Exported on its own so it can be unit-tested the moment this repo grows a
 * test runner; it has none today.
 */
export function cursorAt(script: Chapter[], elapsed: number): Cursor {
  let remaining = Math.max(0, elapsed);
  for (let c = 0; c < script.length; c += 1) {
    const beats = script[c].beats;
    for (let b = 0; b < beats.length; b += 1) {
      const beat = beats[b];
      const span = beat.ms + BEAT_HOLD_MS;
      if (remaining < span) {
        return {
          chapterIndex: c,
          beatIndex: b,
          // Clamped, so the trailing hold sits on the finished frame rather
          // than running the scene past its end.
          progress: beat.ms === 0 ? 1 : Math.min(1, remaining / beat.ms),
          beat,
        };
      }
      remaining -= span;
    }
  }
  // Past the end: hold the final frame.
  const c = script.length - 1;
  const b = script[c].beats.length - 1;
  return { chapterIndex: c, beatIndex: b, progress: 1, beat: script[c].beats[b] };
}

/** Elapsed time at which a chapter starts — what a chapter jump assigns. */
export function chapterStart(script: Chapter[], chapterIndex: number): number {
  let ms = 0;
  for (let c = 0; c < chapterIndex; c += 1)
    for (const beat of script[c].beats) ms += beat.ms + BEAT_HOLD_MS;
  return ms;
}
