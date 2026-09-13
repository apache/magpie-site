"use client";

import { Check, Send } from "lucide-react";
import type { Beat } from "../script";

/**
 * Deliberately the visual opposite of the terminal: light paper, and a
 * plain-text monospace body with literal URLs — no rewritten links, no tracking
 * pixel — which is what the project asks of reporter-facing mail. The contrast
 * is what makes the two "a human pressed Send" beats land.
 *
 * The body is NOT typed out. It arrives whole, in one flash, because that is
 * the actual claim: the maintainer did not write this. Typing it would sell the
 * opposite story — a machine at a keyboard, taking just as long.
 */
export function MailScene({
  beat,
  progress,
}: {
  beat: Extract<Beat, { scene: "mail" }>;
  progress: number;
}) {
  // The whole draft lands at once, just after the genie: a brief flash, then it
  // is simply there. Send lands at 80%, and the rest of the beat holds on
  // "Sent" so the reader can take it in.
  const arrived = progress > 0.1;
  const flash = arrived && progress < 0.22;
  const pressing = progress > 0.78 && progress <= 0.84;
  const sent = progress > 0.84;

  return (
    <div className="relative flex h-full w-full flex-col bg-neutral-50 px-6 py-5 mobile:px-3 mobile:py-3">
      <Ribbon />
      <div className="mb-3 flex-none text-caption font-caption text-subtext-color">
        {beat.title}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-solid border-neutral-200 bg-default-background">
        <div className="flex-none border-b border-solid border-neutral-200 px-4 py-2">
          {beat.fields.map((f) => (
            <div key={f.label} className="flex gap-2 text-caption font-caption">
              <span className="w-16 flex-none text-subtext-color">{f.label}</span>
              <span className="truncate font-mono text-default-font">{f.value}</span>
            </div>
          ))}
        </div>

        <div
          className={`min-h-0 flex-1 overflow-hidden px-4 py-3 font-mono text-caption leading-relaxed text-default-font transition-all duration-200 ${
            arrived ? "opacity-100" : "opacity-0"
          } ${flash ? "bg-brand-50" : "bg-transparent"}`}
        >
          {(arrived ? beat.body : []).map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line === "" ? " " : line}
            </div>
          ))}
        </div>

        <div className="flex flex-none items-center gap-3 border-t border-solid border-neutral-200 px-4 py-2">
          {sent ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-caption font-caption text-emerald-700">
              <Check className="size-3.5" /> Sent
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-caption font-caption text-white transition-transform ${
                pressing ? "scale-95 brightness-90" : ""
              }`}
            >
              <Send className="size-3.5" /> Send
            </span>
          )}
          <span className="truncate text-caption font-caption text-subtext-color">
            {beat.gate}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Marks the fabricated scenes, so a screenshot cannot read as a real advisory. */
export function Ribbon() {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-solid border-neutral-300 bg-neutral-100/90 px-2 py-0.5 text-caption font-caption text-subtext-color">
      Illustration · fictional project
    </div>
  );
}
