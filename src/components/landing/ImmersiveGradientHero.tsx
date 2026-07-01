"use client";

import React from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { BorderBeam } from "@/ui/components/ui/border-beam";
import { Particles } from "@/ui/components/ui/particles";
import { ShimmerButton } from "@/ui/components/ui/shimmer-button";
import { BlurFade } from "@/ui/components/ui/blur-fade";
import { withBase } from "@/ui/lib/utils";
import skillCounts from "@/data/skill-counts.json";
import toolsData from "@/data/tools.json";
import community from "@/data/community.json";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  Download,
  EyeOff,
  FileText,
  Filter,
  GitMerge,
  GitPullRequest,
  Globe,
  Heart,
  Key,
  Mail,
  Layers,
  Lock,
  Menu,
  PenTool,
  Shield,
  Users,
} from "lucide-react";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
  </svg>
);

const Slack = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M6 15a2 2 0 1 1-2-2h2v2Zm1 0a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0v-5Zm2-9a2 2 0 1 1 2-2v2H9Zm0 1a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4h5Zm9 2a2 2 0 1 1 2 2h-2V9Zm-1 0a2 2 0 1 1-4 0V4a2 2 0 1 1 4 0v5Zm-2 9a2 2 0 1 1-2 2v-2h2Zm0-1a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4h-5Z" />
  </svg>
);

// Skill counts are generated from the apache/magpie `skills/` directory at
// build time (scripts/gen-skill-counts.mjs, run by scripts/sync-docs.sh) so
// they never drift from the framework. Only `status` and copy live here.
const SKILL_COUNTS = (skillCounts as { counts: Record<string, number> }).counts;

// Which skill families are ASF-specific is derived from each family's
// docs/<family>/README.md `asf: true|false` scope marker by
// scripts/gen-tools.mjs — so the oak-leaf badge below is metadata-driven, not
// hardcoded. A family's docs directory is the 3rd path segment of its overview
// link (e.g. "/skills/release-management/readme" → "release-management").
const ASF_FAMILIES = new Set(
  (toolsData as { asfFamilies: string[] }).asfFamilies,
);
const isAsfFamily = (family: { overview: string }) =>
  ASF_FAMILIES.has(family.overview.split("/")[2] ?? "");

// Committer / PMC roster + locally-served GitHub avatars. Regenerated from the
// apache/magpie GitHub team by scripts/sync-community.mjs (the `sync-community`
// prek hook); members without a synced avatar fall back to their initials.
type CommunityMember = {
  name: string;
  github: string | null;
  url: string | null;
  avatar: string | null;
};
const COMMUNITY = (community as { members: CommunityMember[] }).members;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// The Apache Software Foundation's current "oak leaf" mark (apache.org).
const AsfOakLeaf = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 800 1231" fill="none" {...props}>
    <path d="M340.565 490.125C371.984 412.419 407.04 334.865 444.655 266.127C388.506 224.415 334.59 134.468 312.439 94.616C304.483 103.656 299.318 114.069 296.976 122.539C276.107 197.903 350.394 288.909 290.56 255.659C240.706 227.952 128.448 167.276 85.6282 227.583C133.585 289.214 259.016 444.273 340.565 490.125Z" fill="#DD552C" />
    <path d="M444.655 266.127C481.103 199.523 519.944 141.19 560.214 99.1643C560.214 99.1643 520.049 157.313 462.68 273.555C497.424 283.125 596.373 302.762 734.199 267.154C737.588 242.103 720.749 214.548 636.838 205.323C582.057 199.307 702.592 74.4897 615.272 15.4582C612.453 13.549 609.682 11.8645 606.967 10.3564C604.04 9.30555 600.948 8.34295 597.648 7.48463C495.667 -19.1313 481.532 153.824 440.837 116.644C375.076 56.5612 333.568 70.5992 312.439 94.616C334.59 134.468 388.506 224.415 444.655 266.127Z" fill="#F79A23" />
    <path d="M258.543 714.009C281.565 645.031 309.259 567.534 340.565 490.125C259.016 444.273 133.585 289.214 85.6282 227.583C77.0666 239.632 71.2159 256.437 69.267 279.419C58.8087 402.865 186.137 494.256 160.753 510.949C127.177 533.032 60.3486 457.902 34.0103 505.638C72.1864 554.691 149.95 643.322 258.543 714.009Z" fill="#D22128" />
    <path d="M611.342 447.778C546.872 424.78 678.712 363.101 721.523 297.669C727.001 289.302 732.663 278.489 734.199 267.154C596.373 302.762 497.424 283.125 462.68 273.555C432.982 333.742 398.687 409.587 362.922 501.034C400.171 516.965 552.266 575.812 767.094 576.117C803.213 482.023 672.528 469.597 611.342 447.778Z" fill="#DD552C" />
    <path d="M283.454 726.427C321.337 738.235 446.861 773.506 580.172 768.196C598.081 719.697 531.124 714.964 525.671 676.067C521.448 645.97 701.878 701.359 759.932 591.92C762.867 586.385 765.157 581.163 767.094 576.117C552.266 575.812 400.171 516.965 362.921 501.034C336.784 567.863 309.896 642.865 283.454 726.427Z" fill="#D22128" />
    <path d="M283.454 726.427C266.431 780.212 249.637 837.672 233.336 898.396C227.553 919.926 221.839 941.857 216.205 964.27C342.735 1006.05 459.248 964.366 463.198 912.706C463.23 912.297 463.154 911.992 463.178 911.599C466.189 856.883 384.195 887.213 386.136 854.317C388.085 821.179 529.284 854.124 572.95 783.076C576.298 777.629 578.48 772.792 580.172 768.196C446.861 773.506 321.337 738.235 283.454 726.427Z" fill="#7C297D" />
    <path d="M34.0104 505.638C32.1657 508.983 30.5015 512.85 29.082 517.47C4.56029 597.182 177.956 704.263 154.365 727.606C133.1 748.639 105.386 700.573 71.2119 720.427C67.4665 722.609 63.6649 725.36 59.7631 729.363C21.1139 768.966 59.1576 883.058 168.813 943.959C143.225 1029.89 117.749 1125.91 92.8102 1226.31C101.857 1223.14 112.684 1219.97 115.379 1211.43C119.425 1194.8 144.432 1093.56 185.034 956.224C185.034 956.224 192.445 928.092 206.011 881.743C218.554 838.883 236.379 780.429 258.543 714.009C149.95 643.322 72.1864 554.691 34.0104 505.638Z" fill="#7C297D" />
  </svg>
);

const SKILL_FAMILIES = [
  {
    name: "setup",
    icon: Layers,
    modes: "Infrastructure",
    overview: "/skills/setup/readme",
    cta: "Worried an agent will leak your credentials or wreck your machine?",
    desc: "Isolated agent setup, framework adoption & maintenance, shared-config sync. The prerequisite every adopter starts from.",
  },
  {
    name: "security",
    icon: Shield,
    modes: "Triage · Drafting",
    overview: "/skills/security/readme",
    cta: "Security reports pile up and every step needs an audit trail?",
    desc: "The 16-step security-issue lifecycle — from security@ import through CVE allocation and publication, with state sync. Maintainer-only.",
  },
  {
    name: "pr-management",
    icon: GitPullRequest,
    modes: "Triage",
    overview: "/skills/pr-management/readme",
    cta: "Your PR queue is out of control?",
    desc: "Maintainer-facing PR-queue management — triage, queue stats, and deep code review.",
  },
  {
    name: "issue",
    icon: Filter,
    modes: "Triage · Drafting",
    overview: "/skills/issue-management/readme",
    cta: "Issue backlog is a mess of duplicates and stale reports?",
    desc: "Issue lifecycle — triage, bug reproduction, fix drafting, and backlog re-assessment against the current branch.",
  },
  {
    name: "repo-health",
    icon: Activity,
    modes: "Triage",
    status: "experimental",
    overview: "/skills/repo-health/readme",
    cta: "Repo hygiene quietly slipping — CI, deps, licenses, flaky tests?",
    desc: "Read-only maintenance audits — CI runner obsolescence, workflow security, stale or vulnerable dependencies, license/NOTICE drift, and flaky tests. Each proposes remedies for the maintainer to apply.",
  },
  {
    name: "release-management",
    icon: GitMerge,
    modes: "Triage · Drafting",
    overview: "/skills/release-management/readme",
    cta: "Cutting a release is a manual, error-prone slog?",
    desc: "The 14-step ASF release lifecycle — planning, RC cut & sign, [VOTE], tally, promote, [ANNOUNCE], archive, audit. The agent never holds the signing key or publishes.",
  },
  {
    name: "mentoring",
    icon: BookOpen,
    modes: "Mentoring",
    status: "experimental",
    overview: "/skills/mentoring/readme",
    cta: "New contributors get stuck and quietly drift away?",
    desc: "Contributor mentoring — spec and tone guide in place; first skill (pr-management-mentor) shipping.",
  },
  {
    name: "contributor-growth",
    icon: Users,
    modes: "Mentoring · Triage",
    overview: "/skills/contributor-growth/readme",
    cta: "Hard to grow contributors into committers?",
    desc: "The contributor-to-committer path — welcome first-timers, keep the backlog newcomer-ready, track activity, assemble nomination evidence, and run post-vote onboarding.",
  },
  {
    name: "utilities",
    icon: PenTool,
    modes: "Meta",
    overview: "/skills/utilities/readme",
    cta: "Want to build or maintain your own skills?",
    desc: "Framework meta-skills — author or update skills (write-skill) and print a live index of every skill (list-skills).",
  },
];

const skillCountLabel = (family: { name: string; status?: string }) => {
  const n = SKILL_COUNTS[family.name] ?? 0;
  const base = `${n} skill${n === 1 ? "" : "s"}`;
  return family.status ? `${base} · ${family.status}` : base;
};

// In-page sections, in document order. Drives both the floating scroll-spy
// SectionNav (desktop) and the collapsible menu (smaller screens). Keep the
// ids in sync with the matching `id="…"` on each section below.
const SECTIONS: { id: string; label: string }[] = [
  { id: "why-magpie", label: "Why Magpie?" },
  { id: "maintainer-first", label: "Maintainers first" },
  { id: "agentic-automations", label: "Agentic automations" },
  { id: "skill-families", label: "Skill Families" },
  { id: "privacy-security", label: "Privacy & Security" },
  { id: "vendor-neutrality", label: "Vendor Neutrality" },
  { id: "organisation-agnostic", label: "Organisations" },
  { id: "community", label: "Community" },
];

// Floating scroll-spy section navigation. Shown in the lg–2xl band: wide
// enough for a side rail, but where the full inline section menu does not fit
// in the top bar. Below lg the sections live in the hamburger menu; at 2xl+
// the inline top menu takes over and this is hidden. Tracks the section
// currently in view via an IntersectionObserver and highlights it.
function SectionNav() {
  const [active, setActive] = React.useState<string>(SECTIONS[0].id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the viewport centre that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A tall band centred on the viewport: a section counts as "active"
      // roughly when it occupies the middle of the screen.
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-1.5 lg:flex 2xl:hidden"
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={isActive ? "true" : undefined}
            className="group flex items-center justify-end gap-2.5"
          >
            <span
              className={`whitespace-nowrap rounded-md bg-default-background/90 px-2 py-0.5 text-caption font-caption shadow-sm ring-1 ring-neutral-200 transition-opacity ${
                isActive
                  ? "text-brand-700 opacity-100"
                  : "text-subtext-color opacity-0 group-hover:opacity-100"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`h-2.5 w-2.5 flex-none rounded-full border transition-all ${
                isActive
                  ? "scale-125 border-brand-600 bg-brand-600"
                  : "border-neutral-300 bg-neutral-200 group-hover:border-brand-400 group-hover:bg-brand-300"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}

function ImmersiveGradientHero() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="flex h-full w-full flex-col items-center bg-default-background">
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-solid border-neutral-100 bg-default-background/95 px-8 py-4 shadow-sm backdrop-blur-md mobile:px-4">
          <a href={withBase("/")} aria-label="Apache Magpie home" className="flex items-end justify-end gap-2 px-2 py-2">
            <img
              className="h-10 w-10 flex-none object-cover"
              src={withBase("/subframe-mark.svg")}
              alt="Apache Magpie"
            />
            <img
              className="h-10 flex-none object-contain"
              src={withBase("/subframe-wordmark.png")}
              alt="Magpie"
            />
          </a>
          {/* Inline section menu — shown only on screens wide enough to fit the
              full list (2xl+). Compact (caption-size, tight gaps, no wrap) so
              eight labels plus the actions fit without overflowing. Below 2xl
              the same links live in the hamburger menu, so the bar always offers
              either this menu or the hamburger. */}
          <div className="hidden items-center gap-4 2xl:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                className="whitespace-nowrap text-caption font-caption text-brand-600 hover:text-brand-700"
                href={`#${s.id}`}
              >
                {s.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a
              className="hidden items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1 text-body-bold font-body-bold text-brand-700 hover:border-brand-300 hover:bg-brand-100 2xl:inline-flex"
              href={withBase("/skills")}
              target="_blank"
              rel="noreferrer"
              title="Open the skill documentation in a new tab"
            >
              Skills
              <ArrowUpRight className="size-3.5" />
            </a>
            <a
              className="hidden items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1 text-body-bold font-body-bold text-brand-700 hover:border-brand-300 hover:bg-brand-100 2xl:inline-flex"
              href={withBase("/tools")}
              target="_blank"
              rel="noreferrer"
              title="Open the Tools page in a new tab"
            >
              Tools
              <ArrowUpRight className="size-3.5" />
            </a>
            <a
              href={withBase("/downloads")}
              aria-label="Downloads"
              title="Downloads"
            >
              <IconButton icon={<Download />} aria-label="Downloads" />
            </a>
            <a
              href="https://github.com/apache/magpie"
              target="_blank"
              rel="noreferrer"
              aria-label="Star Apache Magpie on GitHub"
              title="Star Apache Magpie on GitHub"
            >
              <IconButton icon={<Github />} aria-label="Star Apache Magpie on GitHub" />
            </a>
            <a href={withBase("/skills")}>
              <Button icon={<ArrowRight />}>Get Started</Button>
            </a>
            <IconButton
              className="2xl:hidden"
              icon={<Menu />}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            />
          </div>
          {menuOpen && (
            <div className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b border-solid border-neutral-100 bg-default-background px-6 py-4 shadow-md 2xl:hidden">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  className="rounded-md px-2 py-2 text-body font-body text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                  href={`#${s.id}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {s.label}
                </a>
              ))}
              <div className="mt-1 flex flex-wrap gap-2 border-t border-solid border-neutral-100 pt-3">
                <a
                  className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-body-bold font-body-bold text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  href={withBase("/skills")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                >
                  Skills
                  <ArrowUpRight className="size-3.5" />
                </a>
                <a
                  className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-body-bold font-body-bold text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  href={withBase("/tools")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                >
                  Tools
                  <ArrowUpRight className="size-3.5" />
                </a>
                <a
                  className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-body-bold font-body-bold text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  href={withBase("/downloads")}
                  onClick={() => setMenuOpen(false)}
                >
                  <Download className="size-3.5" />
                  Downloads
                </a>
              </div>
            </div>
          )}
      </nav>
      <SectionNav />
      <div className="relative flex w-full flex-col items-center bg-gradient-to-b from-brand-900 via-brand-800 to-brand-600 overflow-hidden">
        <Particles
          className="absolute inset-0 pointer-events-none"
          quantity={80}
          ease={70}
          color="#ffffff"
          refresh={false}
        />
        <div className="relative z-10 flex w-full max-w-[1280px] items-center gap-16 px-8 pt-16 pb-24 mobile:flex-col mobile:gap-10 mobile:px-4 mobile:pt-10 mobile:pb-16">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-7 max-w-[540px] mobile:max-w-none">
            <div className="flex items-center gap-2 rounded-full px-4 py-1.5 border border-brand-400/40 bg-brand-700/60">
              <AsfOakLeaf className="h-4 w-auto" aria-hidden="true" />
              <span className="text-caption font-caption text-brand-200">
                Apache Top Level Project
              </span>
            </div>
            <div className="flex flex-col items-start gap-5">
              <h1 className="font-['Inter'] text-[52px] font-[700] leading-[56px] text-white -tracking-[0.04em] mobile:font-['Jost'] mobile:text-[34px] mobile:font-[400] mobile:leading-[40px] mobile:tracking-normal">
                Get back your time,{" "}
                <span className="text-brand-200">maintainer</span>.
              </h1>
              <BlurFade delay={0.4} inView>
                <span className="font-['Inter'] text-[17px] font-[400] leading-[27px] text-brand-200 -tracking-[0.01em]">
                  Apache Magpie is a carefully curated set of AI agent recipes,
                  specially designed to handle the repetitive parts of running an
                  open-source project — triaging issues and PRs, mentoring
                  contributors, drafting fixes, managing security reports — so
                  maintainers can spend their time on design, relationships, and
                  the work that needs a human. The agent proposes; the human
                  decides.
                </span>
              </BlurFade>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href={withBase("/skills/setup/install-recipes")} target="_blank" rel="noreferrer">
                <ShimmerButton
                  shimmerColor="#ffffff"
                  background="rgb(0 74 173)"
                  borderRadius="8px"
                  className="!text-white px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 [&_svg]:size-4"
                >
                  <span className="!text-white">Start Using Magpie</span>
                  <ArrowUpRight className="!text-white" />
                </ShimmerButton>
              </a>
              <a href={withBase("/skills")} target="_blank" rel="noreferrer">
                <Button
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  size="large"
                  icon={<BookOpen />}
                  iconRight={<ArrowUpRight />}
                >
                  Read the Docs
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-body font-body text-brand-200" />
                <span className="text-caption font-caption text-brand-200">
                  Free &amp; open-source
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-body font-body text-brand-200" />
                <span className="text-caption font-caption text-brand-200">
                  Vendor neutral
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-body font-body text-brand-200" />
                <span className="text-caption font-caption text-brand-200">
                  ASF governed
                </span>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center self-stretch rounded-2xl border border-solid border-[#b3d1ff] bg-[#f0f5ff] px-6 py-8 min-w-[300px] max-w-[400px]">
            <div className="flex w-full flex-col items-center py-4">
              <div className="flex w-full flex-col items-center">
                <a
                  href={withBase("/skills/modes")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="How a PR flows through the agentic modes"
                  className="flex min-h-[76px] w-full max-w-[340px] items-center gap-3 rounded-xl border border-solid border-[#80b3ff] bg-white px-5 py-3 shadow-md transition-all hover:border-[#004aad] hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <GitPullRequest className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      PR Submitted
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Contributor opens a pull request
                    </span>
                  </div>
                  <Badge variant="success" icon={<Check />} className="xnarrow:hidden">
                    Done
                  </Badge>
                </a>
                <div className="flex flex-col items-center py-1">
                  <ArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <a
                  href={withBase("/skills/modes#triage")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Agentic Triage Mode docs"
                  className="flex min-h-[76px] w-full max-w-[340px] items-center gap-3 rounded-xl border border-solid border-[#80b3ff] bg-white px-5 py-3 shadow-md transition-all hover:border-[#004aad] hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <Filter className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Magpie Triages
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Auto-label, categorize &amp; prioritize
                    </span>
                  </div>
                  <Badge variant="success" icon={<Check />} className="xnarrow:hidden">
                    Stable
                  </Badge>
                </a>
                <div className="flex flex-col items-center py-1">
                  <ArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <a
                  href={withBase("/skills/modes#mentoring")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Agentic Mentoring Mode docs"
                  className="flex min-h-[76px] w-full max-w-[340px] items-center gap-3 rounded-xl border border-solid border-[#80b3ff] bg-white px-5 py-3 shadow-md transition-all hover:border-[#004aad] hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <BookOpen className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Mentor Suggestions
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Guide contributors with feedback
                    </span>
                  </div>
                  <Badge variant="warning" icon={<Clock />} className="xnarrow:hidden">
                    Experimental
                  </Badge>
                </a>
                <div className="flex flex-col items-center py-1">
                  <ArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <a
                  href={withBase("/skills/modes#drafting")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Agentic Drafting Mode docs"
                  className="flex min-h-[76px] w-full max-w-[340px] items-center gap-3 rounded-xl border border-solid border-[#b3d1ff] bg-white px-5 py-3 shadow-md transition-all hover:border-[#004aad] hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <PenTool className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Draft Review
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Generate review comments &amp; notes
                    </span>
                  </div>
                  <Badge variant="success" icon={<Check />} className="xnarrow:hidden">
                    Stable
                  </Badge>
                </a>
                <div className="flex flex-col items-center py-1">
                  <ArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <a
                  href={withBase("/skills/modes#auto-merge")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Agentic Autonomous Mode docs"
                  className="relative flex min-h-[76px] w-full max-w-[340px] items-center gap-3 overflow-hidden rounded-xl border border-solid border-[#004aad] px-5 py-3 shadow-md bg-gradient-to-br from-[#e6f0ff] to-[#b3d1ff] transition-all hover:shadow-lg"
                >
                  <BorderBeam size={120} duration={6} colorFrom="#004aad" colorTo="#80b3ff" />
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#004aad] shadow-sm">
                    <GitMerge className="text-heading-3 font-heading-3 text-white" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-[#002654]">
                      Autonomous
                    </span>
                    <span className="text-caption font-caption text-[#004aad]">
                      Off by design until earlier modes prove out
                    </span>
                  </div>
                  <Badge variant="neutral" icon={<Lock />} className="xnarrow:hidden">
                    Off
                  </Badge>
                </a>
              </div>
            </div>
            <a
              href={withBase("/skills/modes")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            >
              Explore the agentic modes
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
      <div className="flex h-24 w-full flex-none items-start bg-gradient-to-b from-brand-600 to-brand-50" />
      <div id="why-magpie" className="flex w-full flex-col items-center bg-default-background px-8 pt-20 pb-4 mobile:px-4 mobile:pt-12">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[660px] pb-12 mobile:pb-8">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Why would you like to use Magpie?
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Pick the pain you feel today — each one maps to a family of skills
            you can adopt on its own. The agent proposes; you decide.
          </span>
        </BlurFade>
        <div className="w-full items-stretch gap-4 grid grid-cols-3 auto-rows-fr max-w-[1100px] mobile:grid-cols-1">
          {SKILL_FAMILIES.map((family) => (
            <a
              key={family.name}
              href={withBase(family.overview)}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            >
              <span className="text-body-bold font-body-bold text-default-font">
                {family.cta}
              </span>
              <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
                Adopt the <span className="font-mono">{family.name}</span> family
                <ArrowUpRight className="size-3.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
      <div id="maintainer-first" className="flex w-full flex-col items-center bg-warning-50 px-8 py-24 mobile:px-4 mobile:py-14">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[640px] pb-12 mobile:pb-8">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Maintainers first
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Hard guarantees behind every mode, drawn straight from our design
            principles.<br />The agent proposes; you stay in control.
          </span>
        </BlurFade>
        <div className="w-full items-stretch gap-4 grid grid-cols-3 auto-rows-fr max-w-[1100px] mobile:grid-cols-1">
          <a
            href={withBase("/skills/principles#6-the-human-is-always-in-the-loop-until-they-choose-otherwise")}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <CheckCircle className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Human-in-the-Loop
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Every outward action needs explicit maintainer confirmation.
              External content is treated as data, never instructions.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              Principle
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
          <a
            href={withBase("/skills/principles#16-audit-every-agent-authored-action-reverse-it-where-possible")}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <FileText className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Full Audit Log
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Every agent-authored action — comment, label, draft, PR — is
              logged and reversible where possible.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              Principle
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
          <a
            href={withBase("/skills/principles#1-privacy-security-and-supply-chain-integrity-ship-before-features")}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Key className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Controlled Maintainer Development Environment
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Every system tool is pinned and aged through a cooldown window.
              Version bumps are reviewed PRs, not silent updates.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              Principle
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
        </div>
      </div>
      <div id="agentic-automations" className="flex w-full flex-col items-center gap-16 bg-default-background px-8 py-24 mobile:gap-10 mobile:px-4 mobile:py-14">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[600px]">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Progressive Agentic Modes
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Agentic automations that adapt to your project. Start simple — each
            mode builds on the previous one, evolving as trust grows.
          </span>
        </BlurFade>
        <div className="flex w-full flex-col items-start gap-3 max-w-[1100px]">
          <div className="flex w-full items-start gap-3 mobile:flex-col">
            <div className="group relative flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <a className="absolute inset-0 z-0 rounded-2xl" href={withBase("/skills/modes#triage")} target="_blank" rel="noreferrer" aria-label="Agentic Triage Mode docs" />
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-600 text-white font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                  1
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Agentic Triage Mode
                  </span>
                  <Badge variant="success" icon={<Check />}>
                    Stable
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Auto-label, categorize, and route incoming PRs and issues to
                  the right reviewers instantly.
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="neutral">Auto-labeling</Badge>
                  <Badge variant="neutral">Priority scoring</Badge>
                  <a
                    href={withBase("/skills/modes#triage")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2 py-0.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  >
                    Docs
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="group relative flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <a className="absolute inset-0 z-0 rounded-2xl" href={withBase("/skills/modes#drafting")} target="_blank" rel="noreferrer" aria-label="Agentic Drafting Mode docs" />
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500 text-white font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                  2
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Agentic Drafting Mode
                  </span>
                  <Badge variant="success" icon={<Check />}>
                    Stable (security)
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Draft a fix for a well-scoped problem and open a PR — every PR
                  reviewed and merged by a human committer, never the agent.
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="neutral">Fix PRs</Badge>
                  <Badge variant="neutral">Human-merged</Badge>
                  <a
                    href={withBase("/skills/modes#drafting")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2 py-0.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  >
                    Docs
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full items-start gap-3 mobile:flex-col">
            <div className="group relative flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <a className="absolute inset-0 z-0 rounded-2xl" href={withBase("/skills/modes#mentoring")} target="_blank" rel="noreferrer" aria-label="Agentic Mentoring Mode docs" />
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-400 text-white font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                  3
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Agentic Mentoring Mode
                  </span>
                  <Badge variant="warning" icon={<Clock />}>
                    Experimental
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Joins issue and PR threads in a teaching register — clarifying
                  questions, pointers to conventions, examples from prior PRs.
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="neutral">Conventions</Badge>
                  <Badge variant="neutral">Prior PRs</Badge>
                  <a
                    href={withBase("/skills/modes#mentoring")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2 py-0.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  >
                    Docs
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="group relative flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <a className="absolute inset-0 z-0 rounded-2xl" href={withBase("/skills/modes#pairing")} target="_blank" rel="noreferrer" aria-label="Agentic Pairing Mode docs" />
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-300 text-brand-900 font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-brand-900">
                  4
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Agentic Pairing Mode
                  </span>
                  <Badge variant="warning" icon={<Clock />}>
                    Experimental
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Developer-side skills you run in your own dev loop — multi-agent
                  review pipelines and self-review before you open a PR.
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="neutral">Self-review</Badge>
                  <Badge variant="neutral">Pre-flight</Badge>
                  <a
                    href={withBase("/skills/modes#pairing")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2 py-0.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                  >
                    Docs
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="group relative flex w-full items-start gap-5 rounded-2xl border-2 border-solid border-brand-200 px-6 py-6 shadow-sm bg-gradient-to-r from-brand-50 to-brand-100/60 overflow-hidden">
            <BorderBeam size={150} duration={8} colorFrom="#004aad" colorTo="#80b3ff" />
            <a className="absolute inset-0 z-0 rounded-2xl" href={withBase("/skills/modes#auto-merge")} target="_blank" rel="noreferrer" aria-label="Agentic Autonomous Mode docs" />
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-600 text-white font-['Inter'] text-[16px] font-[700]">
              <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                5
              </span>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-heading-3 font-heading-3 text-default-font">
                  Agentic Autonomous Mode
                </span>
                <Badge variant="neutral" icon={<Lock />}>
                  Off
                </Badge>
              </div>
              <span className="text-body font-body text-subtext-color max-w-[640px]">
                Limited fix-and-merge for objectively boring changes —
                lint, allow-listed dependency bumps, formatting. Deliberately
                off until the earlier modes have proven out, and never for
                security-class changes.
              </span>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="brand">Auto-approve</Badge>
                <Badge variant="brand">Audit trail</Badge>
                <Badge variant="brand">Rollback</Badge>
                <a
                  href={withBase("/skills/modes#auto-merge")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-300 bg-white/70 px-2 py-0.5 text-caption font-caption text-brand-700 hover:border-brand-400 hover:bg-white"
                >
                  Docs
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
            <GitMerge className="text-heading-2 font-heading-2 text-brand-400 mobile:hidden" />
          </div>
        </div>
      </div>
      <div id="skill-families" className="flex w-full flex-col items-center bg-warning-50 px-8 py-24 mobile:px-4 mobile:py-14">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[640px] pb-12 mobile:pb-8">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Pick the skill families you need
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Modes describe how agents are used; skill families are how those
            capabilities ship. Adopt only the families that fit — symlinks for
            the picked families land in your skill directory.
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Most families work on any project, inside or outside the Apache
            Software Foundation. The ones marked with the Apache oak leaf
            (<AsfOakLeaf className="inline-block h-3.5 w-auto align-[-0.15em]" aria-hidden="true" />)
            are ASF-specific — they encode Foundation processes like the release
            lifecycle and the contributor-to-committer path. We&apos;d love to
            support other maintainership and governance models too; contributions
            are welcome.
          </span>
        </BlurFade>
        <div className="w-full items-stretch gap-4 grid grid-cols-3 auto-rows-fr max-w-[1100px] mobile:grid-cols-1">
          {SKILL_FAMILIES.map((family) => {
            const Icon = family.icon;
            return (
              <a
                key={family.name}
                href={withBase(family.overview)}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                    <Icon className="text-body-bold font-body-bold text-brand-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isAsfFamily(family) && (
                      <span
                        title="ASF-specific — built around the Apache Way"
                        aria-label="ASF-specific skill family"
                        className="inline-flex items-center"
                      >
                        <AsfOakLeaf className="h-4 w-auto" />
                      </span>
                    )}
                    <Badge variant="neutral">{skillCountLabel(family)}</Badge>
                  </div>
                </div>
                <span className="font-mono text-body-bold font-body-bold text-default-font">
                  {family.name}
                </span>
                <Badge variant="brand">{family.modes}</Badge>
                <span className="text-caption font-caption text-subtext-color">
                  {family.desc}
                </span>
                <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
                  Read the overview
                  <ArrowUpRight className="size-3.5" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
      <div id="privacy-security" className="flex w-full flex-col items-center bg-default-background">
        <div className="flex w-full flex-col items-center gap-14 px-8 py-24 max-w-[1100px] mobile:gap-8 mobile:px-4 mobile:py-14">
          <div className="flex flex-col items-center gap-4 max-w-[600px]">
            <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
              Privacy and Security at every level
            </span>
            <span className="text-body font-body text-subtext-color text-center">
              Every interaction is auditable, every decision is transparent, and
              every action respects the principle of least privilege.
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a
                href={withBase("/skills/security/readme")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
              >
                Security docs
                <ArrowUpRight className="size-3.5" />
              </a>
              <a
                href={withBase("/skills/setup/privacy-llm")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
              >
                Privacy docs
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
          <div className="w-full items-stretch gap-4 grid grid-cols-3 auto-rows-fr mobile:grid mobile:grid-cols-1">
            <a
              href={withBase("/skills/setup/secure-agent-setup")}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <Shield className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
                Sandboxed by Default
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Filesystem, network, and tool-permission rules enforced at the
                harness layer. Sandbox bypasses warn loudly, never silently.
              </span>
              <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
                Docs
                <ArrowUpRight className="size-3.5" />
              </span>
            </a>
            <a
              href={withBase("/skills/security/forwarder-routing-policy")}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <Lock className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
                Privacy-Aware Routing
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Private content flows only to LLMs your PMC has explicitly
                approved, with a recorded data-residency contract.
              </span>
              <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
                Docs
                <ArrowUpRight className="size-3.5" />
              </span>
            </a>
            <a
              href={withBase("/skills/confidentiality")}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <EyeOff className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
                PII Redaction
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Third-party PII is redacted to stable identifiers before any
                content reaches an LLM context.
              </span>
              <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
                Docs
                <ArrowUpRight className="size-3.5" />
              </span>
            </a>
          </div>
        </div>
      </div>
      <div id="vendor-neutrality" className="flex w-full flex-col items-center bg-warning-50">
        <div className="flex w-full items-center gap-16 px-8 py-24 max-w-[1100px] mobile:flex-col mobile:gap-10 mobile:px-4 mobile:py-14">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Vendor neutral
            <sup className="text-[0.5em] font-[700] text-brand-600 align-super">*</sup>
          </span>
          <span className="text-body font-body text-subtext-color">
            Magpie&apos;s workflows never name a vendor.{" "}
            <span className="font-body-bold text-default-font">Skills</span>{" "}
            declare a{" "}
            <span className="font-body-bold text-default-font">capability</span>;
            a <span className="font-body-bold text-default-font">tool</span>{" "}
            fulfils it; every vendor binding lives in a tool behind a contract —
            across six independent axes: LLM backend, agentic runtime,
            forge/tracker, communication channels, source control, and project
            governance. Swapping a backend is a config change, never a rewrite of
            the workflows.
          </span>
          <span className="text-caption font-caption italic text-subtext-color">
            <span className="not-italic text-brand-600">*</span> Aspirationally,
            Magpie is truly vendor neutral and truly organisation agnostic. We are
            working on the tools, and with other organisations, to make sure that
            every tool and organisational capability — already implemented in our
            architecture and design — has multiple implementations and supports
            multiple organisations.
          </span>
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
              href={withBase("/skills/vendor-neutrality")}
              target="_blank"
              rel="noreferrer"
            >
              How Magpie achieves vendor neutrality
              <ArrowUpRight className="size-3.5" />
            </a>
            <a
              className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
              href={withBase("/tools")}
              target="_blank"
              rel="noreferrer"
            >
              Browse tools &amp; capabilities
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
          <div className="flex flex-col items-start gap-5 pt-2">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-100">
                <Check className="text-caption font-caption text-brand-700" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Swap LLM providers freely
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Anthropic, OpenAI, Bedrock, or local Ollama/vLLM — skills target
                  a capability floor, not a provider SDK. No lock-in.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-100">
                <Check className="text-caption font-caption text-brand-700" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Works across agent CLIs &amp; ecosystems
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Skills follow the open AGENTS.md standard, so they run across
                  agent CLIs and ecosystems — Claude Code, Codex, and others —
                  rather than being tied to one vendor&apos;s tool.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-100">
                <Check className="text-caption font-caption text-brand-700" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Forge, tracker &amp; VCS behind contracts
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  GitHub and Jira today; GitLab, Gitea, Bugzilla, and non-Git VCS
                  (SVN, Mercurial, …) are documented, labelled extension points —
                  each one adapter, not a fork.
                </span>
              </div>
            </div>
          </div>
        </div>
        <img
          className="w-80 flex-none"
          src="https://www.apache.org/foundation/press/kit/img/the-apache-way-badge/ASF_Badge_apacheway-blue.png"
        />
        </div>
      </div>
      <div id="organisation-agnostic" className="flex w-full flex-col items-center bg-default-background px-8 py-24 mobile:px-4 mobile:py-14">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[760px] pb-12 mobile:pb-8">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            All organisations
            <sup className="text-[0.5em] font-[700] text-brand-600 align-super">*</sup>{" "}
            are welcome
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Magpie isn&apos;t hardwired to the Apache Software Foundation. A
            governing body — a foundation, a company, or an informal maintainer
            collective — is an{" "}
            <span className="font-body-bold text-default-font">organization</span>{" "}
            that bundles its governance vocabulary, backend defaults, and identity
            (logo included). A project declares{" "}
            <span className="font-mono text-default-font">organization: ASF</span>{" "}
            (or <span className="font-mono text-default-font">independent</span>,
            or your own) once and inherits the rest — so the{" "}
            <span className="font-body-bold text-default-font">same skill</span>{" "}
            runs unchanged for an ASF project and a non-ASF one.
          </span>
          <span className="text-caption font-caption italic text-subtext-color text-center">
            <span className="not-italic text-brand-600">*</span> Aspirationally,
            Magpie is truly vendor neutral and truly organisation agnostic. We are
            working on the tools, and with other organisations, to make sure that
            every tool and organisational capability — already implemented in our
            architecture and design — has multiple implementations and supports
            multiple organisations.
          </span>
        </BlurFade>
        <div className="grid w-full grid-cols-2 gap-4 max-w-[1000px] mobile:grid-cols-1">
          <a
            className="group flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            href={withBase("/tools")}
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Globe className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Organizations, not a hardcoded ASF
            </span>
            <span className="text-caption font-caption text-subtext-color">
              <span className="font-mono">ASF</span> and{" "}
              <span className="font-mono">independent</span> ship in-tree; author
              your own for your foundation or company. Governance vocabulary,
              backend choices, and identity live once and every project inherits
              them.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              See the organizations
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
          <a
            className="group flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            href={withBase("/skills/vendor-neutrality")}
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Heart className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Non-ASF adopters are first-class
            </span>
            <span className="text-caption font-caption text-subtext-color">
              The <span className="font-mono">independent</span> baseline needs no
              foundation: DCO sign-off, GitHub-native security and releases, no
              mailing-list backends. It&apos;s a starting point, not an
              afterthought.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              How neutrality works
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
          <a
            className="group flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            href={withBase("/skills/extending")}
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Layers className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Three homes for every extension
            </span>
            <span className="text-caption font-caption text-subtext-color">
              A skill, adapter, or whole organization can live in-tree (upstreamed
              to everyone), in your adopter repo, or in an external repo you
              reference — wired in deliberately, never auto-installed.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              The three homes
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
          <a
            className="group flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
            href={withBase("/skills/extending")}
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <PenTool className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Extend by project, org, or individual
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Add a backend by writing one adapter against a documented contract;
              the workflows never change. Keep it private or contribute it back
              under Apache-2.0 — one PR away.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 group-hover:border-brand-300 group-hover:bg-brand-100">
              Who extends what
              <ArrowUpRight className="size-3.5" />
            </span>
          </a>
        </div>
        <div className="mt-12 flex w-full max-w-[760px] flex-col items-center gap-3 rounded-2xl border border-solid border-brand-200 bg-brand-50 px-6 py-6 text-center">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Add your organization
          </span>
          <span className="text-body font-body text-subtext-color">
            Running Magpie under a different foundation or company? Propose an
            organization bundle so every project under it inherits your defaults
            — start the conversation on the developer mailing list.
          </span>
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-300 bg-default-background px-4 py-2 text-body-bold font-body-bold text-brand-700 hover:border-brand-400 hover:bg-brand-100"
            href="mailto:dev@magpie.apache.org?subject=Adding%20my%20organization%20to%20Apache%20Magpie"
          >
            <Mail className="size-4" />
            Email the dev list
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-10">
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            href={withBase("/skills/extending")}
            target="_blank"
            rel="noreferrer"
          >
            Extending Magpie (project / org / individual)
            <ArrowUpRight className="size-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-solid border-brand-200 bg-brand-50 px-3 py-1.5 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            href={withBase("/tools")}
            target="_blank"
            rel="noreferrer"
          >
            Organizations, tools &amp; capabilities
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </div>
      <div id="community" className="flex w-full flex-col items-center gap-14 bg-warning-50 px-8 py-24 mobile:gap-10 mobile:px-4 mobile:py-14">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[680px]">
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Built in the open, the Apache Way
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Apache Magpie is a project of{" "}
            <a
              className="font-body-bold text-brand-600 hover:text-brand-700"
              href="https://www.apache.org/"
              target="_blank"
              rel="noreferrer"
            >
              The Apache Software Foundation
            </a>
            , built in public and run by its community following{" "}
            <a
              className="font-body-bold text-brand-600 hover:text-brand-700"
              href="https://www.apache.org/theapacheway/"
              target="_blank"
              rel="noreferrer"
            >
              the Apache Way
            </a>{" "}
            — consensus-driven, vendor-neutral, and earned on merit.<br />
            Decisions happen on open channels, and everyone is welcome to take
            part.
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Day-to-day work happens on GitHub (issues &amp; pull requests) and in
            Slack for quick questions — but every significant discussion and
            decision also lands on the developer mailing list. Prefer not to use
            GitHub or Slack? You can follow along and take part fully over email
            alone: the dev list is the one channel that reaches everyone.
          </span>
        </BlurFade>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 -mt-4 max-w-[760px]">
          <span className="text-caption font-caption text-subtext-color">
            New to Apache?
          </span>
          <a
            className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            href="https://www.apache.org/foundation/how-it-works/"
            target="_blank"
            rel="noreferrer"
          >
            How the Foundation works
            <ArrowRight className="size-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            href="https://community.apache.org/committers/"
            target="_blank"
            rel="noreferrer"
          >
            Becoming a committer
            <ArrowRight className="size-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            href="https://community.apache.org/contributors/etiquette.html"
            target="_blank"
            rel="noreferrer"
          >
            Communication &amp; etiquette
            <ArrowRight className="size-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            href="https://community.apache.org/"
            target="_blank"
            rel="noreferrer"
          >
            Community Development (ComDev)
            <ArrowRight className="size-3.5" />
          </a>
        </div>
        <div className="w-full items-stretch gap-4 grid grid-cols-3 auto-rows-fr max-w-[1100px] mobile:grid-cols-1">
          <div className="group relative flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all">
            <a
              className="absolute inset-0 z-0 rounded-2xl"
              href="https://lists.apache.org/list.html?dev@magpie.apache.org"
              target="_blank"
              rel="noreferrer"
              aria-label="Browse the developer mailing list archive"
            />
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Mail className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Developer mailing list
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Design discussion, proposals, and the formal [VOTE]s that reach
              consensus all happen on dev@magpie.apache.org. If it didn&apos;t
              happen on the list, it didn&apos;t happen.
            </span>
            <div className="relative z-10 mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
              <a
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                href="mailto:dev-subscribe@magpie.apache.org"
              >
                Subscribe
                <ArrowRight className="size-3.5" />
              </a>
              <a
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                href="https://lists.apache.org/list.html?dev@magpie.apache.org"
                target="_blank"
                rel="noreferrer"
              >
                Browse the archive
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
          <div className="group relative flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all">
            <a
              className="absolute inset-0 z-0 rounded-2xl"
              href="https://the-asf.slack.com/archives/C0BD1EBMVEJ"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the #magpie channel on the ASF Slack"
            />
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Slack className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Slack — #magpie
            </span>
            <span className="text-caption font-caption text-subtext-color">
              Real-time chat with maintainers and contributors in the #magpie
              channel on the ASF Slack — questions, pairing, and quick design
              back-and-forth.
            </span>
            <div className="relative z-10 mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
              <a
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                href="https://s.apache.org/slack-invite"
                target="_blank"
                rel="noreferrer"
              >
                Join the ASF Slack
                <ArrowRight className="size-3.5" />
              </a>
              <a
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                href="https://the-asf.slack.com/archives/C0BD1EBMVEJ"
                target="_blank"
                rel="noreferrer"
              >
                Open #magpie
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
          <div className="group relative flex h-full flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all">
            <a
              className="absolute inset-0 z-0 rounded-2xl"
              href="https://github.com/apache/magpie/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              aria-label="Read the contributing guide"
            />
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
              <Heart className="text-body-bold font-body-bold text-brand-700" />
            </div>
            <span className="text-body-bold font-body-bold text-default-font group-hover:text-brand-700">
              Start contributing
            </span>
            <span className="text-caption font-caption text-subtext-color">
              New here? The contributing guide walks through setup, conventions,
              and your first pull request. The agent proposes; humans review and
              merge — and we mentor newcomers along the way.
            </span>
            <div className="relative z-10 mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
              <a
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                href="https://github.com/apache/magpie/issues"
                target="_blank"
                rel="noreferrer"
              >
                Browse issues
                <ArrowRight className="size-3.5" />
              </a>
              <a
                className="inline-flex items-center gap-1 rounded-md border border-solid border-brand-200 bg-brand-50 px-2.5 py-1 text-caption font-caption text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                href="https://github.com/apache/magpie/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
              >
                Contributing guide
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-6 max-w-[900px]">
          <div className="flex flex-col items-center gap-2">
            <span className="text-heading-3 font-heading-3 text-default-font text-center">
              The people behind Magpie
            </span>
            <span className="text-caption font-caption text-subtext-color text-center">
              {COMMUNITY.length}{" "}
              <a
                className="font-body-bold text-brand-600 hover:text-brand-700"
                href="https://www.apache.org/foundation/how-it-works/"
                target="_blank"
                rel="noreferrer"
              >
                committers &amp; PMC members
              </a>{" "}
              steering the project.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {COMMUNITY.map((member) => {
              const avatar = member.avatar ? (
                <img
                  src={withBase(member.avatar)}
                  alt={member.name}
                  loading="lazy"
                  className="h-14 w-14 rounded-full border-2 border-solid border-white object-cover shadow-sm transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-solid border-white bg-brand-100 text-body-bold font-body-bold text-brand-700 shadow-sm transition-transform group-hover:scale-110">
                  {initials(member.name)}
                </div>
              );
              return member.url ? (
                <a
                  key={member.name}
                  href={member.url}
                  target="_blank"
                  rel="noreferrer"
                  title={member.name}
                  aria-label={member.name}
                  className="group"
                >
                  {avatar}
                </a>
              ) : (
                <div key={member.name} title={member.name} className="group">
                  {avatar}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center px-8 py-24 bg-gradient-to-br from-brand-900 to-brand-700 mobile:px-4 mobile:py-14">
        <div className="flex flex-col items-center gap-8 max-w-[600px]">
          <div className="flex flex-col items-center gap-4">
            <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-white text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
              Hey maintainer …<br />
              <br />Want to get your time back?
            </span>
            <span className="text-body font-body text-brand-200 text-center">
              Join the growing community of open-source projects using Apache
              Magpie to scale their review processes without burning out their
              maintainers.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={withBase("/skills")}>
              <Button size="large" icon={<ArrowRight />}>
                Get Started
              </Button>
            </a>
            <a href="https://github.com/apache/magpie" target="_blank" rel="noreferrer">
              <Button
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                size="large"
                icon={<Github />}
              >
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>
      <footer className="flex w-full flex-col items-center gap-6 border-t border-solid border-neutral-100 bg-default-background px-8 py-12 mobile:px-4 mobile:py-8">
        <div className="flex w-full flex-wrap items-start gap-8 max-w-[1100px]">
          <div className="flex min-w-[240px] flex-col items-start gap-4">
            <img
              className="h-10 flex-none object-contain"
              src={withBase("/wordmark.svg")}
              alt="Apache Magpie"
            />
            <span className="text-caption font-caption text-subtext-color max-w-[260px]">
              An Apache Software Foundation Top Level Project<br />
              <br />AI-powered assistance for open-source maintainers.
            </span>
            <div className="flex items-center gap-2">
              <a href="https://github.com/apache/magpie" target="_blank" rel="noreferrer" aria-label="GitHub">
                <IconButton icon={<Github />} />
              </a>
              <a href="https://twitter.com/TheASF" target="_blank" rel="noreferrer" aria-label="Twitter">
                <IconButton icon={<Twitter />} />
              </a>
              <a href="https://the-asf.slack.com/archives/C0BD1EBMVEJ" target="_blank" rel="noreferrer" aria-label="Slack">
                <IconButton icon={<Slack />} />
              </a>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-wrap items-start gap-8">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 min-w-[130px]">
              <span className="text-body-bold font-body-bold text-default-font">Project</span>
              <a className="inline-flex items-center gap-1 text-body font-body text-subtext-color hover:text-brand-600" href={withBase("/skills")} target="_blank" rel="noreferrer">Documentation<ArrowUpRight className="size-3.5" /></a>
              <a className="inline-flex items-center gap-1 text-body font-body text-subtext-color hover:text-brand-600" href={withBase("/tools")} target="_blank" rel="noreferrer">Tools<ArrowUpRight className="size-3.5" /></a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href={withBase("/downloads")}>Downloads</a>
              <a className="inline-flex items-center gap-1 text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/magpie/issues" target="_blank" rel="noreferrer">Roadmap<ArrowUpRight className="size-3.5" /></a>
              <a className="inline-flex items-center gap-1 text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/magpie/releases" target="_blank" rel="noreferrer">Changelog<ArrowUpRight className="size-3.5" /></a>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 min-w-[130px]">
              <span className="text-body-bold font-body-bold text-default-font">Community</span>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/magpie/blob/main/CONTRIBUTING.md">Contributing</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://lists.apache.org/list.html?dev@magpie.apache.org">Mailing Lists</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://the-asf.slack.com/archives/C0BD1EBMVEJ">Slack Channel</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/magpie/issues">Issue Tracker</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/magpie-site/issues/new">Report a site issue</a>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 min-w-[130px]">
              <span className="text-body-bold font-body-bold text-default-font">Foundation</span>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/">Apache Home</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/licenses/">License</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/events/current-event">Events</a>
              <div className="flex items-center gap-2">
                <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/foundation/sponsorship.html">Sponsorship</a>
                <span className="text-body font-body text-subtext-color">·</span>
                <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/foundation/thanks.html">Thanks</a>
              </div>
              <div className="flex items-center gap-2">
                <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/security/">Security</a>
                <span className="text-body font-body text-subtext-color">·</span>
                <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://privacy.apache.org/policies/privacy-policy-public.html">Privacy</a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-3 border-t border-solid border-neutral-100 pt-6 max-w-[1100px]">
          <span className="text-caption font-caption text-subtext-color text-center">
            Copyright © 2026 The Apache Software Foundation, Licensed under the
            Apache License, Version 2.0.
          </span>
          <span className="text-caption font-caption text-subtext-color text-center max-w-[860px]">
            Apache Magpie, Magpie, and Apache are either registered trademarks or
            trademarks of The Apache Software Foundation in the United States
            and other countries. All other marks mentioned may be trademarks or
            registered trademarks of their respective owners.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default ImmersiveGradientHero;
