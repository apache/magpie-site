"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter } from "./script";
import { cursorAt } from "./timeline";

export { cursorAt, chapterStart, totalMs, BEAT_HOLD_MS } from "./timeline";
export type { Cursor } from "./timeline";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTimeline(script: Chapter[], totalMs: number) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  // Set once on mount rather than read during render, so the server-rendered
  // markup and the first client render agree.
  const [reduced, setReduced] = useState(false);

  // Inputs the rAF loop reads without wanting to restart when they change.
  const elapsedRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const pausedByUser = useRef(false);
  const inView = useRef(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  const apply = useCallback((ms: number) => {
    elapsedRef.current = ms;
    setElapsed(ms);
  }, []);

  // The clock. One loop for the whole component: scenes derive everything they
  // draw from `elapsed`, so nothing else needs a timer.
  useEffect(() => {
    if (!running || reduced) return undefined;
    const tick = (now: number) => {
      const last = lastRef.current;
      lastRef.current = now;
      if (last !== null) {
        const next = elapsedRef.current + (now - last);
        if (next >= totalMs) {
          apply(totalMs);
          setRunning(false);
          lastRef.current = null;
          return;
        }
        apply(next);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastRef.current = null;
    };
  }, [running, reduced, totalMs, apply]);

  // A hidden tab should not burn frames.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setRunning(false);
      else if (!pausedByUser.current && inView.current && elapsedRef.current < totalMs)
        setRunning(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [totalMs]);

  const setInView = useCallback(
    (visible: boolean) => {
      inView.current = visible;
      if (reduced) return;
      if (visible && !pausedByUser.current && elapsedRef.current < totalMs)
        setRunning(true);
      else if (!visible) setRunning(false);
    },
    [reduced, totalMs],
  );

  /** Hover and focus pause; leaving resumes, unless the reader paused on purpose. */
  const setHovered = useCallback(
    (hovered: boolean) => {
      if (reduced) return;
      if (hovered) setRunning(false);
      else if (!pausedByUser.current && inView.current && elapsedRef.current < totalMs)
        setRunning(true);
    },
    [reduced, totalMs],
  );

  const togglePaused = useCallback(() => {
    pausedByUser.current = !pausedByUser.current;
    setRunning(!pausedByUser.current && elapsedRef.current < totalMs);
  }, [totalMs]);

  const jumpTo = useCallback(
    (ms: number) => {
      pausedByUser.current = false;
      apply(Math.min(Math.max(0, ms), totalMs));
      if (!reduced) setRunning(true);
    },
    [apply, reduced, totalMs],
  );

  const replay = useCallback(() => jumpTo(0), [jumpTo]);

  return {
    cursor: cursorAt(script, elapsed),
    elapsed,
    running,
    reduced,
    finished: elapsed >= totalMs,
    pausedByUser: pausedByUser.current,
    setInView,
    setHovered,
    togglePaused,
    jumpTo,
    replay,
  };
}
