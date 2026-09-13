"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import { BlurFade } from "@/ui/components/ui/blur-fade";
import { withBase } from "@/ui/lib/utils";
import { SCRIPT, transcript } from "./script";
import { chapterStart, totalMs, useTimeline } from "./useTimeline";

const TOTAL_MS = totalMs(SCRIPT);
import { TerminalScene } from "./scenes/TerminalScene";
import { MailScene } from "./scenes/MailScene";
import { BoardScene } from "./scenes/BoardScene";
import { VulnogramScene } from "./scenes/VulnogramScene";
import { PublishedScene } from "./scenes/PublishedScene";
import { InterludeScene } from "./scenes/InterludeScene";
import { GenieBadge } from "./Genie";
import type { Beat } from "./script";

function Scene({ beat, progress }: { beat: Beat; progress: number }) {
  switch (beat.scene) {
    case "terminal":
      return <TerminalScene beat={beat} progress={progress} />;
    case "mail":
      return <MailScene beat={beat} progress={progress} />;
    case "board":
      return <BoardScene beat={beat} progress={progress} />;
    case "interlude":
      return <InterludeScene beat={beat} progress={progress} />;
    case "vulnogram":
      return <VulnogramScene beat={beat} progress={progress} />;
    case "published":
      return <PublishedScene beat={beat} progress={progress} />;
  }
}

function SecurityStoryDemo() {
  const {
    cursor,
    elapsed,
    running,
    reduced,
    finished,
    setInView,
    setHovered,
    togglePaused,
    jumpTo,
    replay,
  } = useTimeline(SCRIPT, TOTAL_MS);

  const frameRef = useRef<HTMLDivElement | null>(null);

  // Start when the band is actually on screen, stop when it is not: an
  // animation nobody is looking at should not be running.
  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [setInView]);

  const story = transcript();

  return (
    <div
      id="see-it-in-action"
      className="flex w-full scroll-mt-16 flex-col items-center bg-default-background px-8 pt-20 pb-16 mobile:px-4 mobile:pt-12"
    >
      <BlurFade inView className="flex max-w-[760px] flex-col items-center gap-4 pb-8">
        <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] -tracking-[0.035em] text-default-font text-center mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
          See it in action
        </span>
        <span className="text-body font-body text-subtext-color text-center">
          One security report, start to finish: installed from the marketplace,
          triaged against the project's history, fixed, released, and published as
          a CVE. Every message that leaves the project is drafted by the agent and
          sent by a person.
        </span>
      </BlurFade>

      {/* Reduced motion gets the whole story as stills rather than nothing. */}
      {reduced ? (
        <StaticStory />
      ) : (
        <div
          ref={frameRef}
          className="flex w-full max-w-[960px] flex-col gap-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-solid border-neutral-200 shadow-sm mobile:aspect-[4/3]">
            <Scene beat={cursor.beat} progress={cursor.progress} />
            <GenieMoment beat={cursor.beat} progress={cursor.progress} />
          </div>

          <div className="flex items-center gap-2 mobile:flex-wrap">
            <button
              type="button"
              onClick={finished ? replay : togglePaused}
              aria-label={finished ? "Replay" : running ? "Pause" : "Play"}
              className="inline-flex flex-none items-center gap-1.5 rounded-md border border-solid border-neutral-200 bg-default-background px-2.5 py-1.5 text-caption font-caption text-default-font hover:bg-neutral-100"
            >
              {finished ? (
                <RotateCcw className="size-3.5" />
              ) : running ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              {/* All three labels share one grid cell, so the button is always
                  as wide as the longest ("Replay") and never resizes when
                  hovering the frame flips Pause to Play. */}
              <span className="grid justify-items-start">
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1"
                >
                  Replay
                </span>
                <span className="col-start-1 row-start-1">
                  {finished ? "Replay" : running ? "Pause" : "Play"}
                </span>
              </span>
            </button>

            <ol className="flex min-w-0 flex-1 items-center gap-1 mobile:flex-wrap">
              {SCRIPT.map((chapter, i) => {
                const active = i === cursor.chapterIndex;
                const seen = i < cursor.chapterIndex;
                return (
                  <li key={chapter.id} className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => jumpTo(chapterStart(SCRIPT, i))}
                      aria-current={active ? "step" : undefined}
                      className={`w-full truncate rounded-md px-2 py-1.5 text-caption font-caption transition-colors ${
                        active
                          ? "bg-brand-600 text-white"
                          : seen
                            ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                            : "text-subtext-color hover:bg-neutral-100"
                      }`}
                    >
                      {i + 1}. {chapter.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            className="h-0.5 w-full overflow-hidden rounded-full bg-neutral-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((elapsed / TOTAL_MS) * 100)}
          >
            <div
              className="h-full bg-brand-600"
              style={{ width: `${(elapsed / TOTAL_MS) * 100}%` }}
            />
          </div>
        </div>
      )}

      <details className="mt-6 w-full max-w-[960px] rounded-lg border border-solid border-neutral-200 bg-default-background px-4 py-3">
        <summary className="cursor-pointer text-caption font-caption text-brand-700">
          Read the whole thing as text
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          {story.map((chapter) => (
            <section key={chapter.chapter}>
              <h3 className="text-body-bold font-body-bold text-default-font">
                {chapter.chapter}
              </h3>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-caption text-subtext-color">
                {chapter.lines.join("\n")}
              </pre>
            </section>
          ))}
        </div>
      </details>

      <a
        href={withBase("/docs/security/readme")}
        className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-default-background px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
      >
        How the security family actually works
        <ArrowUpRight className="size-3.5" />
      </a>

      <p className="mt-3 max-w-[760px] text-center text-caption font-caption text-subtext-color">
        Example App is a fictional project, and the CVE identifier is a
        placeholder. The workflow is real; the vulnerability is not.
      </p>
    </div>
  );
}

/**
 * Shows the genie for a window around `genie.at`. Derived from beat progress
 * like everything else, so jumping into the middle of a beat gets it right.
 */
function GenieMoment({ beat, progress }: { beat: Beat; progress: number }) {
  const genie = beat.genie;
  if (!genie) return null;
  // Half the beat. The genie is the argument the demo is making, so it gets
  // read-it-twice time rather than a glimpse. Every `at` is <= 0.5 so the full
  // window fits inside its beat and the fade-out is never cut off by the scene
  // change — asserted in the checks.
  const window = 0.5;
  const phase = (progress - genie.at) / window;
  if (phase < 0 || phase > 1) return null;
  return (
<GenieBadge did={genie.did} month={genie.month} phase={phase} />
  );
}

/** The story as stills — what a reader with reduced motion gets. */
function StaticStory() {
  return (
    <div className="flex w-full max-w-[960px] flex-col gap-3">
      {SCRIPT.map((chapter) => {
        const beat = chapter.beats[chapter.beats.length - 1];
        return (
          <div key={chapter.id} className="flex flex-col gap-1">
            <span className="text-caption font-caption text-subtext-color">
              {chapter.label}
            </span>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-solid border-neutral-200 mobile:aspect-[4/3]">
              <Scene beat={beat} progress={1} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { SecurityStoryDemo };
export default SecurityStoryDemo;
