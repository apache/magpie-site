"use client";

import type { Beat, TerminalLine } from "../script";

/**
 * Lines reveal in order across the beat, the last one typing out character by
 * character. The scene holds no timers: how much is on screen is a function of
 * `progress` alone, so a chapter jump lands mid-sentence correctly.
 */
function reveal(lines: TerminalLine[], progress: number) {
  // Reserve the last slice of the beat for reading the final line.
  const scaled = Math.min(1, progress / 0.88) * lines.length;
  const complete = Math.floor(scaled);
  const typingFraction = scaled - complete;
  return { complete, typingFraction };
}

const TONE: Record<TerminalLine["kind"], string> = {
  cmd: "text-white",
  ask: "text-white",
  out: "text-neutral-400",
  note: "text-emerald-300",
  gate: "",
};

export function TerminalScene({
  beat,
  progress,
}: {
  beat: Extract<Beat, { scene: "terminal" }>;
  progress: number;
}) {
  const { complete, typingFraction } = reveal(beat.lines, progress);

  return (
    <div className="flex h-full w-full flex-col bg-neutral-900 px-6 py-5 font-mono mobile:px-3 mobile:py-3">
      <div className="mb-3 flex-none text-caption font-caption text-neutral-500">
        {beat.title}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden text-caption leading-relaxed">
        {beat.lines.map((line, i) => {
          if (i > complete) return null;
          const typing = i === complete;
          const text =
            typing && line.kind !== "gate"
              ? line.text.slice(0, Math.ceil(line.text.length * typingFraction))
              : line.text;

          if (line.kind === "gate") {
            // The confirmation gate is the point of the whole demo, so it is
            // the one thing that gets a box rather than a line.
            const answered = !typing || typingFraction > 0.55;
            return (
              <div
                key={i}
                className="mt-1 rounded-md border border-solid border-brand-400/60 bg-brand-600/15 px-3 py-2"
              >
                <div className="text-brand-200">{line.text}</div>
                <div className="text-neutral-400">
                  {answered ? (
                    <>
                      <span className="text-neutral-500">›</span>{" "}
                      <span className="text-white">{line.answer}</span>{" "}
                      <span className="text-emerald-300">— confirmed by a human</span>
                    </>
                  ) : (
                    <span className="text-neutral-500">› _</span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`whitespace-pre-wrap ${TONE[line.kind]}`}>
              {(line.kind === "cmd" || line.kind === "ask") && (
                <span className="text-brand-300">› </span>
              )}
              {text}
              {typing && <span className="text-brand-300">▌</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
