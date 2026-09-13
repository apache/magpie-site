"use client";

import { Send } from "lucide-react";
import type { Beat } from "../script";
import { Ribbon } from "./MailScene";

/**
 * The CVE record. Like the mail, it is NOT filled in field by field: the whole
 * record lands at once, because the claim is that nobody sat and typed it. The
 * JSON preview appears with it, to say this is a structured record going to a
 * registry rather than a form for its own sake.
 */
export function VulnogramScene({
  beat,
  progress,
}: {
  beat: Extract<Beat, { scene: "vulnogram" }>;
  progress: number;
}) {
  const arrived = progress > 0.12;
  const flash = arrived && progress < 0.24;
  const pressing = progress > 0.8 && progress <= 0.86;
  const submitted = progress > 0.86;

  return (
    <div className="relative flex h-full w-full flex-col bg-neutral-50 px-6 py-5 mobile:px-3 mobile:py-3">
      <Ribbon />
      <div className="mb-3 flex-none text-caption font-caption text-subtext-color">
        {beat.title}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 mobile:grid-cols-1">
        <div
          className={`flex min-h-0 flex-col gap-1.5 overflow-hidden rounded-lg border border-solid p-3 transition-all duration-200 ${
            flash
              ? "border-brand-300 bg-brand-50"
              : "border-neutral-200 bg-default-background"
          }`}
        >
          {beat.fields.map((field) => (
            <div
              key={field.label}
              className={`flex gap-2 transition-opacity duration-200 ${
                arrived ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="w-24 flex-none text-caption font-caption text-subtext-color">
                {field.label}
              </span>
              <span className="truncate font-mono text-caption text-default-font">
                {field.value}
              </span>
            </div>
          ))}
        </div>

        <div className="min-h-0 overflow-hidden rounded-lg bg-neutral-900 p-3 font-mono text-caption leading-relaxed text-neutral-400 mobile:hidden">
          <div className="text-neutral-500">{"{"}</div>
          {(arrived ? beat.fields : []).map((field) => (
            <div key={field.label} className="truncate pl-3">
              <span className="text-brand-300">
                "{field.label.toLowerCase().replace(/\s+/g, "_")}"
              </span>
              <span className="text-neutral-500">: </span>
              <span className="text-emerald-300">"{field.value}"</span>
              <span className="text-neutral-500">,</span>
            </div>
          ))}
          <div className="text-neutral-500">{"}"}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-none items-center gap-3">
        {submitted ? (
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-caption font-caption text-emerald-700">
            Submitted to the CVE program
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
  );
}
