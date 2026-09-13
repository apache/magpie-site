"use client";

import { ArrowUpRight, Film, Layers, Package, Play } from "lucide-react";
import { BlurFade } from "@/ui/components/ui/blur-fade";
import { withBase } from "@/ui/lib/utils";

// ── Swapping the placeholder for the real animation ────────────────────────
//
// This section renders a placeholder until the demo is recorded. To wire the
// finished asset in, drop the files under `public/demo/` and fill in DEMO
// below — nothing else on the page changes.
//
//   const DEMO: DemoAsset | null = {
//     kind: "svg",                                  // "svg" | "video"
//     src: "/demo/magpie-marketplace-install.svg",
//     poster: "/demo/magpie-marketplace-install-poster.png", // "video" only
//     transcript: "/demo/magpie-marketplace-install.txt",    // a11y fallback
//     durationLabel: "1 min 20 s",
//   };
//
// The recording guide — what to show, which tool to use, terminal settings,
// encoding, and the accessibility requirements — lives next to this file:
//   src/components/landing/InstallDemo.README.md
//
type DemoAsset = {
  /** "svg" renders an animated SVG via <img>; "video" renders <video>. */
  kind: "svg" | "video";
  /** Site-relative path under `public/`, e.g. "/demo/magpie-marketplace-install.svg". */
  src: string;
  /** Still frame shown before a video plays. Ignored for "svg". */
  poster?: string;
  /** Plain-text transcript of the session — required, it is the a11y fallback. */
  transcript: string;
  /** Human-readable run length, shown next to the player. */
  durationLabel?: string;
};

const DEMO: DemoAsset | null = null;

// The three beats the recording has to hit, in order. They double as the
// shooting script for whoever records it (see InstallDemo.README.md § Script)
// and as chapter captions once the animation is in place — so keep the two in
// sync: if the recording changes, change these.
const STORYBOARD = [
  {
    n: "01",
    icon: Package,
    title: "Add the marketplace",
    cmd: "/plugin marketplace add apache/magpie",
    desc: "One command inside the agent you already use. The apache/magpie repository is the marketplace — no vendor directory, no account, and nothing written into your project.",
  },
  {
    n: "02",
    icon: Layers,
    title: "Install only the families you need",
    cmd: "/plugin install magpie-pr-management@apache-magpie",
    desc: "Ten families, one plugin each. Take magpie-setup plus whatever matches a problem you have today — every family you add costs context in every session, which is why there is no install-everything plugin.",
  },
  {
    n: "03",
    icon: Play,
    title: "Run a skill",
    cmd: "/magpie-pr-management:pr-management-triage",
    desc: "Every skill is called as <plugin>:<skill> — the family plugin you installed is the prefix. Ask in plain language or call one by name; the agent proposes, and you confirm before anything leaves the machine.",
  },
];

// One invocation per family, in the marketplace naming scheme
// `/<plugin>:<skill>`. These are real skill names from apache/magpie — check
// them against `skills/` there before editing, and keep the prefix equal to
// the family plugin that provides the skill.
const ACROSS_FAMILIES = [
  { family: "setup", cmd: "/magpie-setup:setup-isolated-setup-install" },
  { family: "pr-management", cmd: "/magpie-pr-management:pr-management-code-review" },
  { family: "issue", cmd: "/magpie-issue:issue-triage" },
  { family: "security", cmd: "/magpie-security:security-issue-triage" },
  { family: "release-management", cmd: "/magpie-release-management:release-rc-cut" },
  { family: "repo-health", cmd: "/magpie-repo-health:dependency-audit" },
];

const GUIDE_URL =
  "https://github.com/apache/magpie-site/blob/main/src/components/landing/InstallDemo.README.md";

function Placeholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-brand-200 bg-default-background px-8 py-10 text-center mobile:px-5 mobile:py-6">
      <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand-100 mobile:h-11 mobile:w-11">
        <Film className="text-heading-2 font-heading-2 text-brand-700" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-heading-3 font-heading-3 text-default-font">
          Demo animation — not recorded yet
        </span>
        <span className="max-w-[520px] text-body font-body text-subtext-color">
          This frame is reserved for a recording of the marketplace install —
          the three steps below, in one agent session. The storyboard, tooling,
          and encoding settings are written down; the recording is the only
          missing piece.
        </span>
      </div>
      <a
        href={GUIDE_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
      >
        Read the recording guide
        <ArrowUpRight className="size-3.5" />
      </a>
    </div>
  );
}

function Player({ demo }: { demo: DemoAsset }) {
  const label =
    "Screen recording: installing Apache Magpie from the apache/magpie marketplace and running a skill from an installed family";
  return (
    <figure className="m-0 flex h-full w-full flex-col">
      {demo.kind === "svg" ? (
        <img
          src={withBase(demo.src)}
          alt={label}
          className="h-full w-full rounded-2xl border border-solid border-neutral-200 bg-[#0f1117] object-contain shadow-md"
        />
      ) : (
        // Muted + playsInline so it can autoplay on mobile Safari; controls
        // stay on so the animation can be paused and scrubbed.
        <video
          className="h-full w-full rounded-2xl border border-solid border-neutral-200 bg-[#0f1117] object-contain shadow-md"
          src={withBase(demo.src)}
          poster={demo.poster ? withBase(demo.poster) : undefined}
          aria-label={label}
          controls
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <figcaption className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-3 text-caption font-caption text-subtext-color">
        {demo.durationLabel ? <span>{demo.durationLabel}</span> : null}
        {demo.durationLabel ? <span aria-hidden="true">·</span> : null}
        <a
          href={withBase(demo.transcript)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800"
        >
          Read the transcript
          <ArrowUpRight className="size-3.5" />
        </a>
      </figcaption>
    </figure>
  );
}

/**
 * "See it in action" — the install-and-use demo band, directly under the hero.
 *
 * Renders the recorded animation when DEMO is set, and a placeholder with the
 * shooting script when it is not. The storyboard below the frame is shown in
 * both states, so the section still explains the install → families → skill
 * flow to a reader who never presses play.
 */
export function InstallDemo() {
  return (
    <div
      id="see-it-in-action"
      className="flex w-full flex-col items-center border-b border-solid border-brand-100 bg-brand-50 px-8 py-24 mobile:px-4 mobile:py-14"
    >
      <BlurFade
        inView
        className="flex flex-col items-center gap-4 max-w-[680px] pb-10 mobile:pb-8"
      >
        <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
          See it in action
        </span>
        <span className="text-body font-body text-subtext-color text-center">
          Install Magpie from your agent's own marketplace, switch on only the
          skill families you need, and run one. Two commands, and nothing is
          committed to your repository.
        </span>
      </BlurFade>
      <div className="flex w-full max-w-[980px] flex-col items-center gap-10 mobile:gap-8">
        <div className="aspect-[16/9] w-full">
          {DEMO ? <Player demo={DEMO} /> : <Placeholder />}
        </div>
        <ol className="m-0 grid w-full list-none auto-rows-fr grid-cols-3 items-stretch gap-4 p-0 mobile:grid-cols-1">
          {STORYBOARD.map((step) => (
            <li
              key={step.n}
              className="flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm"
            >
              <div className="flex w-full items-center gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                  <step.icon className="text-body-bold font-body-bold text-brand-700" />
                </div>
                <span className="text-body-bold font-body-bold text-default-font">
                  {step.title}
                </span>
                <span className="ml-auto text-caption font-caption text-neutral-400">
                  {step.n}
                </span>
              </div>
              <code className="w-full overflow-x-auto rounded-md border border-solid border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-caption text-brand-700">
                {step.cmd}
              </code>
              <span className="text-caption font-caption text-subtext-color">
                {step.desc}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-solid border-brand-100 bg-default-background px-6 py-6 mobile:px-4 mobile:py-5">
          <div className="flex flex-col gap-1">
            <span className="text-body-bold font-body-bold text-default-font">
              One install, every family you took
            </span>
            <span className="text-caption font-caption text-subtext-color">
              The prefix is the family plugin that provides the skill, so what
              you can call is exactly what you chose to install.{" "}
              <span className="font-mono">/magpie-utilities:list-skills</span>{" "}
              prints the live list.
            </span>
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-2 p-0 mobile:grid-cols-1">
            {ACROSS_FAMILIES.map((item) => (
              <li
                key={item.cmd}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-solid border-neutral-100 py-1.5"
              >
                <code className="font-mono text-caption text-brand-700">
                  {item.cmd}
                </code>
                <span className="text-caption font-caption text-subtext-color">
                  {item.family}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="m-0 max-w-[720px] text-center text-caption font-caption text-subtext-color">
          Every agent adds the same marketplace — the{" "}
          <span className="font-mono">apache/magpie</span> repository. Codex
          CLI, VS&nbsp;Code / Copilot and Gemini CLI install the same
          per-family plugins as Claude Code; only the command to add the
          marketplace differs.
        </p>
        <a
          href={withBase("/docs/quick-start")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-default-background px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
        >
          Follow the written install guide instead
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

export default InstallDemo;
