"use client";

import { Check, Mail } from "lucide-react";
import { PROJECT, type Beat } from "../script";
import { Ribbon } from "./MailScene";

/** The closing frame: the advisory entry beside the announcement that went out. */
export function PublishedScene({
  beat,
  progress,
}: {
  beat: Extract<Beat, { scene: "published" }>;
  progress: number;
}) {
  const advisoryIn = progress > 0.1;
  const mailIn = progress > 0.35;
  const summaryIn = progress > 0.6;

  return (
    <div className="relative flex h-full w-full flex-col bg-neutral-50 px-6 py-5 mobile:px-3 mobile:py-3">
      <Ribbon />
      <div className="mb-3 flex-none text-caption font-caption text-subtext-color">
        {beat.title}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 mobile:grid-cols-1">
        <div
          className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-solid border-neutral-200 bg-default-background transition-all duration-500 ${
            advisoryIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex-none border-b border-solid border-neutral-200 px-3 py-2 text-caption font-caption text-default-font">
            Advisory database entry
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3">
            {beat.advisory.map((field) => (
              <div key={field.label} className="flex gap-2">
                <span className="w-20 flex-none text-caption font-caption text-subtext-color">
                  {field.label}
                </span>
                <span className="truncate font-mono text-caption text-default-font">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-solid border-neutral-200 bg-default-background transition-all duration-500 ${
            mailIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-none items-center gap-2 border-b border-solid border-neutral-200 px-3 py-2">
            <Mail className="size-3.5 text-subtext-color" />
            <span className="truncate text-caption font-caption text-default-font">
              {PROJECT.announceList}
            </span>
            <span className="ml-auto inline-flex flex-none items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-caption font-caption text-emerald-700">
              <Check className="size-3" /> Sent
            </span>
          </div>
          <div className="min-h-0 flex-1 p-3 font-mono text-caption leading-relaxed text-default-font">
            <div className="truncate">[{PROJECT.cve}] Path traversal in</div>
            <div className="truncate">{PROJECT.name} archive extractor</div>
            <div className="mt-2 text-subtext-color">
              Fixed in {PROJECT.fixVersion} · credit R. Chen
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mt-3 flex-none text-center text-caption font-caption text-default-font transition-opacity duration-500 ${
          summaryIn ? "opacity-100" : "opacity-0"
        }`}
      >
        {beat.summary}
      </div>
    </div>
  );
}
