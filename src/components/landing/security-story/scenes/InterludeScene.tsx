"use client";

import type { Beat } from "../script";
import { GenieMark } from "../Genie";

/**
 * The interlude: the genie centre stage instead of in the corner. Used where
 * Magpie produces a whole artefact on its own — the fix PR — so the board pauses
 * and the thing it made materialises.
 */
export function InterludeScene({
  beat,
  progress,
}: {
  beat: Extract<Beat, { scene: "interlude" }>;
  progress: number;
}) {
  const genieIn = Math.min(1, progress / 0.18);
  const cardIn = Math.min(1, Math.max(0, (progress - 0.22) / 0.25));
  const linesShown = Math.ceil(
    beat.card.lines.length * Math.min(1, Math.max(0, (progress - 0.4) / 0.3)),
  );
  const savedIn = progress > 0.72;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-50 to-default-background px-6 py-5 mobile:px-3 mobile:py-3">
      <div
        className="flex flex-col items-center gap-1"
        style={{
          opacity: genieIn,
          transform: `translateY(${(1 - genieIn) * 12}px) scale(${0.8 + 0.2 * genieIn})`,
        }}
      >
        <GenieMark className="size-14 text-brand-600" />
        <span className="text-center text-caption font-caption text-brand-700">
          {beat.title}
        </span>
      </div>

      <div
        className="w-[min(30rem,100%)] rounded-xl border border-solid border-brand-200 bg-default-background p-3 shadow-md transition-none"
        style={{
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 10}px)`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-caption font-caption text-brand-700">
            {beat.card.kind}
          </span>
          <span className="truncate font-mono text-caption text-subtext-color">
            {beat.card.id}
          </span>
        </div>
        <div className="mt-1 text-body font-body text-default-font">
          {beat.card.title}
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          {beat.card.lines.slice(0, linesShown).map((line, i) => (
            <div key={i} className="truncate font-mono text-caption text-subtext-color">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`flex flex-col items-center gap-0.5 text-center transition-opacity duration-500 ${
          savedIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-caption font-caption text-subtext-color">
          {beat.did}
        </span>
        <span className="text-body-bold font-body-bold text-brand-700">
          {beat.month} last month
        </span>
      </div>
    </div>
  );
}
