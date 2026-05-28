"use client";

import React from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { BorderBeam } from "@/ui/components/ui/border-beam";
import { Particles } from "@/ui/components/ui/particles";
import { ShimmerButton } from "@/ui/components/ui/shimmer-button";
import { BlurFade } from "@/ui/components/ui/blur-fade";
import { TextAnimate } from "@/ui/components/ui/text-animate";
import {
  ArrowDown as FeatherArrowDown,
  ArrowRight as FeatherArrowRight,
  BookOpen as FeatherBookOpen,
  Check as FeatherCheck,
  CheckCircle as FeatherCheckCircle,
  Clock as FeatherClock,
  EyeOff as FeatherEyeOff,
  Feather as FeatherFeather,
  FileText as FeatherFileText,
  Filter as FeatherFilter,
  GitMerge as FeatherGitMerge,
  GitPullRequest as FeatherGitPullRequest,
  Globe as FeatherGlobe,
  Key as FeatherKey,
  Layers as FeatherLayers,
  Lock as FeatherLock,
  Menu as FeatherMenu,
  PenTool as FeatherPenTool,
  RefreshCw as FeatherRefreshCw,
  Shield as FeatherShield,
  Users as FeatherUsers,
} from "lucide-react";

const FeatherGithub = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const FeatherTwitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
  </svg>
);

const FeatherSlack = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M6 15a2 2 0 1 1-2-2h2v2Zm1 0a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0v-5Zm2-9a2 2 0 1 1 2-2v2H9Zm0 1a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4h5Zm9 2a2 2 0 1 1 2 2h-2V9Zm-1 0a2 2 0 1 1-4 0V4a2 2 0 1 1 4 0v5Zm-2 9a2 2 0 1 1-2 2v-2h2Zm0-1a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4h-5Z" />
  </svg>
);

function ImmersiveGradientHero() {
  return (
    <div className="flex h-full w-full flex-col items-center bg-default-background">
      <div className="relative flex w-full flex-col items-center bg-gradient-to-b from-brand-900 via-brand-800 to-brand-600 overflow-hidden">
        <Particles
          className="absolute inset-0 pointer-events-none"
          quantity={80}
          ease={70}
          color="#ffffff"
          refresh={false}
        />
        <nav className="relative z-10 flex w-full items-center justify-between bg-default-background px-8 py-5 mobile:px-4">
          <a href="/" aria-label="Apache Magpie home" className="flex items-end justify-end gap-2 px-2 py-2">
            <img
              className="h-10 w-10 flex-none object-cover"
              src="/subframe-mark.svg"
              alt="Apache Magpie"
            />
            <img
              className="h-10 flex-none object-contain"
              src="/subframe-wordmark.png"
              alt="Magpie"
            />
          </a>
          <div className="flex items-center gap-7 mobile:hidden">
            <a className="text-body font-body text-brand-600 hover:text-brand-700" href="#features">Features</a>
            <a className="text-body font-body text-brand-600 hover:text-brand-700" href="/docs">Docs</a>
            <a className="text-body font-body text-brand-600 hover:text-brand-700" href="https://lists.apache.org/list.html?dev-magpie@airflow.apache.org">Community</a>
            <a className="text-body font-body text-brand-600 hover:text-brand-700" href="https://github.com/apache/airflow-steward">GitHub</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/apache/airflow-steward" target="_blank" rel="noreferrer" className="mobile:hidden">
              <Button
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                variant="neutral-secondary"
                icon={<FeatherGithub />}
              >
                Star on GitHub
              </Button>
            </a>
            <a href="/docs">
              <Button icon={<FeatherArrowRight />}>Get Started</Button>
            </a>
            <IconButton
              className="hidden text-white mobile:flex"
              icon={<FeatherMenu />}
              aria-label="Open menu"
            />
          </div>
        </nav>
        <div className="relative z-10 flex w-full max-w-[1280px] items-center gap-16 px-8 pt-16 pb-24 mobile:flex-col mobile:gap-10 mobile:px-4 mobile:pt-10 mobile:pb-16">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-7 max-w-[540px] mobile:max-w-none">
            <div className="flex items-center gap-2 rounded-full px-4 py-1.5 border border-brand-400/40 bg-brand-700/60">
              <FeatherFeather className="text-caption font-caption text-brand-200" />
              <span className="text-caption font-caption text-brand-200">
                Apache Software Foundation Incubating
              </span>
            </div>
            <div className="flex flex-col items-start gap-5">
              <TextAnimate
                as="h1"
                animation="blurInUp"
                by="word"
                duration={0.6}
                className="font-['Inter'] text-[52px] font-[700] leading-[56px] text-white -tracking-[0.04em] mobile:font-['Jost'] mobile:text-[34px] mobile:font-[400] mobile:leading-[40px] mobile:tracking-normal"
              >
                Give maintainers time back.
              </TextAnimate>
              <BlurFade delay={0.4} inView>
                <span className="font-['Inter'] text-[17px] font-[400] leading-[27px] text-brand-200 -tracking-[0.01em]">
                  Apache Magpie is an AI-powered assistant that helps open-source
                  maintainers manage contributions more efficiently. From triage
                  to auto-merge, Magpie learns your project and scales your review
                  capacity.
                </span>
              </BlurFade>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/docs">
                <ShimmerButton
                  shimmerColor="#ffffff"
                  background="rgb(0 74 173)"
                  borderRadius="8px"
                  className="!text-white px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 [&_svg]:size-4"
                >
                  <span className="!text-white">Start Using Magpie</span>
                  <FeatherArrowRight className="!text-white" />
                </ShimmerButton>
              </a>
              <a href="/docs">
                <Button
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  size="large"
                  icon={<FeatherBookOpen />}
                >
                  Read the Docs
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div className="flex items-center gap-2">
                <FeatherCheckCircle className="text-body font-body text-brand-200" />
                <span className="text-caption font-caption text-brand-200">
                  Free &amp; open-source
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FeatherCheckCircle className="text-body font-body text-brand-200" />
                <span className="text-caption font-caption text-brand-200">
                  Vendor neutral
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FeatherCheckCircle className="text-body font-body text-brand-200" />
                <span className="text-caption font-caption text-brand-200">
                  ASF governed
                </span>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center self-stretch rounded-2xl border border-solid border-[#b3d1ff] bg-[#f0f5ff] px-8 py-8 min-w-[380px]">
            <div className="flex w-full flex-col items-center py-4">
              <div className="flex w-full flex-col items-center">
                <div className="flex w-full items-center gap-3 rounded-xl border border-solid border-[#80b3ff] bg-white px-5 py-3 shadow-md max-w-[360px]">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <FeatherGitPullRequest className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      PR Submitted
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Contributor opens a pull request
                    </span>
                  </div>
                  <Badge variant="success" icon={<FeatherCheck />}>
                    Done
                  </Badge>
                </div>
                <div className="flex flex-col items-center py-1">
                  <FeatherArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <div className="flex w-full items-center gap-3 rounded-xl border border-solid border-[#80b3ff] bg-white px-5 py-3 shadow-md max-w-[360px]">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <FeatherFilter className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Magpie Triages
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Auto-label, categorize &amp; prioritize
                    </span>
                  </div>
                  <Badge variant="success" icon={<FeatherCheck />}>
                    Active
                  </Badge>
                </div>
                <div className="flex flex-col items-center py-1">
                  <FeatherArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <div className="flex w-full items-center gap-3 rounded-xl border border-solid border-[#80b3ff] bg-white px-5 py-3 shadow-md max-w-[360px]">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <FeatherBookOpen className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Mentor Suggestions
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Guide contributors with feedback
                    </span>
                  </div>
                  <Badge variant="success" icon={<FeatherCheck />}>
                    Active
                  </Badge>
                </div>
                <div className="flex flex-col items-center py-1">
                  <FeatherArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <div className="flex w-full items-center gap-3 rounded-xl border border-solid border-[#b3d1ff] bg-white px-5 py-3 shadow-md max-w-[360px]">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#e6f0ff]">
                    <FeatherPenTool className="text-heading-3 font-heading-3 text-[#004aad]" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Draft Review
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Generate review comments &amp; notes
                    </span>
                  </div>
                  <Badge variant="warning" icon={<FeatherClock />}>
                    Beta
                  </Badge>
                </div>
                <div className="flex flex-col items-center py-1">
                  <FeatherArrowDown className="text-body font-body text-[#80b3ff]" />
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <div className="relative flex w-full items-center gap-3 rounded-xl border-2 border-solid border-[#004aad] px-5 py-4 shadow-lg bg-gradient-to-br from-[#e6f0ff] to-[#b3d1ff] max-w-[360px] overflow-hidden">
                  <BorderBeam size={120} duration={6} colorFrom="#004aad" colorTo="#80b3ff" />
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#004aad] shadow-sm">
                    <FeatherGitMerge className="text-heading-2 font-heading-2 text-white" />
                  </div>
                  <div className="flex grow shrink-0 basis-0 flex-col items-start">
                    <span className="text-body-bold font-body-bold text-[#002654]">
                      Auto-merge
                    </span>
                    <span className="text-caption font-caption text-[#004aad]">
                      Merge when all checks pass
                    </span>
                  </div>
                  <Badge variant="neutral" icon={<FeatherLock />}>
                    Planned
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-24 w-full flex-none items-start bg-gradient-to-b from-brand-600 to-brand-50" />
      <div id="features" className="flex w-full flex-col items-center gap-16 bg-default-background px-8 py-24 mobile:gap-10 mobile:px-4 mobile:py-14">
        <BlurFade inView className="flex flex-col items-center gap-4 max-w-[600px]">
          <div className="flex items-center gap-2 rounded-full border border-solid border-brand-200 bg-brand-50 px-4 py-1.5">
            <FeatherLayers className="text-caption font-caption text-brand-600" />
            <span className="text-caption font-caption text-brand-600">
              5 Operating Modes
            </span>
          </div>
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Progressive automation that adapts to your project
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Start simple. Each mode builds on the previous one, evolving as
            trust grows.
          </span>
        </BlurFade>
        <div className="flex w-full flex-col items-start gap-3 max-w-[1100px]">
          <div className="flex w-full items-start gap-3 mobile:flex-col">
            <div className="flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-600 text-white font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                  1
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Triage Mode
                  </span>
                  <Badge variant="success" icon={<FeatherCheck />}>
                    Active
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Auto-label, categorize, and route incoming PRs and issues to
                  the right reviewers instantly.
                </span>
                <div className="flex flex-wrap items-start gap-2 pt-1">
                  <Badge variant="neutral">Auto-labeling</Badge>
                  <Badge variant="neutral">Priority scoring</Badge>
                </div>
              </div>
            </div>
            <div className="flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500 text-white font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                  2
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Mentoring Mode
                  </span>
                  <Badge variant="warning" icon={<FeatherClock />}>
                    Beta
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Guide first-time contributors with contextual suggestions and
                  code style feedback.
                </span>
                <div className="flex flex-wrap items-start gap-2 pt-1">
                  <Badge variant="neutral">Style guides</Badge>
                  <Badge variant="neutral">Doc links</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full items-start gap-3 mobile:flex-col">
            <div className="flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-400 text-white font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                  3
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Drafting Mode
                  </span>
                  <Badge variant="success" icon={<FeatherCheck />}>
                    Active
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Generate review comments, changelogs, and release notes from
                  PR context and commit history.
                </span>
                <div className="flex flex-wrap items-start gap-2 pt-1">
                  <Badge variant="neutral">Review drafts</Badge>
                  <Badge variant="neutral">Changelogs</Badge>
                </div>
              </div>
            </div>
            <div className="flex grow shrink-0 basis-0 items-start gap-5 rounded-2xl border border-solid border-neutral-200 bg-default-background px-6 py-6 hover:border-brand-200 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-300 text-brand-900 font-['Inter'] text-[16px] font-[700]">
                <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-brand-900">
                  4
                </span>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Pairing Mode
                  </span>
                  <Badge variant="warning" icon={<FeatherClock />}>
                    Beta
                  </Badge>
                </div>
                <span className="text-body font-body text-subtext-color">
                  Work alongside maintainers in real-time, suggesting fixes and
                  identifying edge cases before review.
                </span>
                <div className="flex flex-wrap items-start gap-2 pt-1">
                  <Badge variant="neutral">Real-time assist</Badge>
                  <Badge variant="neutral">Pre-checks</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex w-full items-start gap-5 rounded-2xl border-2 border-solid border-brand-200 px-6 py-6 shadow-sm bg-gradient-to-r from-brand-50 to-brand-100/60 overflow-hidden">
            <BorderBeam size={150} duration={8} colorFrom="#004aad" colorTo="#80b3ff" />
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-600 text-white font-['Inter'] text-[16px] font-[700]">
              <span className="font-['Inter'] text-[16px] font-[700] leading-[24px] text-white">
                5
              </span>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-heading-3 font-heading-3 text-default-font">
                  Auto-merge Mode
                </span>
                <Badge variant="neutral" icon={<FeatherLock />}>
                  Planned
                </Badge>
              </div>
              <span className="text-body font-body text-subtext-color max-w-[640px]">
                For trusted, well-tested contributions that pass all checks,
                Magpie can autonomously approve and merge with full audit trails
                and rollback capability.
              </span>
              <div className="flex flex-wrap items-start gap-2 pt-1">
                <Badge variant="brand">Auto-approve</Badge>
                <Badge variant="brand">Audit trail</Badge>
                <Badge variant="brand">Rollback</Badge>
              </div>
            </div>
            <FeatherGitMerge className="text-heading-2 font-heading-2 text-brand-400 mobile:hidden" />
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center border-y border-solid border-neutral-100 bg-neutral-50">
        <div className="flex w-full flex-col items-center gap-14 px-8 py-24 max-w-[1100px] mobile:gap-8 mobile:px-4 mobile:py-14">
          <div className="flex flex-col items-center gap-4 max-w-[600px]">
            <div className="flex items-center gap-2 rounded-full border border-solid border-brand-200 bg-brand-50 px-4 py-1.5">
              <FeatherShield className="text-caption font-caption text-brand-600" />
              <span className="text-caption font-caption text-brand-600">
                Security First
              </span>
            </div>
            <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
              Built with security at every layer
            </span>
            <span className="text-body font-body text-subtext-color text-center">
              Every interaction is auditable, every decision is transparent, and
              every action respects the principle of least privilege.
            </span>
          </div>
          <div className="w-full items-start gap-4 grid grid-cols-3 mobile:grid mobile:grid-cols-1">
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <FeatherKey className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font">
                Token Scoping
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Minimal permissions per operation. Magpie never requests more
                access than needed.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <FeatherFileText className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font">
                Full Audit Logs
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Every AI decision logged with reasoning, context, and
                timestamps. Full traceability.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <FeatherEyeOff className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font">
                No Data Retention
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Code processed in-memory, never stored. Your intellectual
                property stays yours.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <FeatherRefreshCw className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font">
                Rollback Support
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Any automated action can be instantly reversed. Humans always
                retain the final say.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <FeatherUsers className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font">
                Role-Based Access
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Granular permissions aligned with project governance. Distinct
                access for PMC and contributors.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-solid border-neutral-200 bg-default-background px-5 py-5 shadow-sm">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-100">
                <FeatherShield className="text-body-bold font-body-bold text-brand-700" />
              </div>
              <span className="text-body-bold font-body-bold text-default-font">
                ASF Compliance
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Built to meet Apache Software Foundation standards for security
                and governance.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center gap-16 px-8 py-24 max-w-[1100px] mobile:flex-col mobile:gap-10 mobile:px-4 mobile:py-14">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6">
          <div className="flex items-center gap-2 rounded-full border border-solid border-brand-200 bg-brand-50 px-4 py-1.5">
            <FeatherGlobe className="text-caption font-caption text-brand-600" />
            <span className="text-caption font-caption text-brand-600">
              Open Governance
            </span>
          </div>
          <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-default-font -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
            Truly vendor neutral
          </span>
          <span className="text-body font-body text-subtext-color">
            Apache Magpie is developed under the Apache Software Foundation
            umbrella, ensuring no single company controls the project direction.
            Decisions are made by the community, for the community.
          </span>
          <div className="flex flex-col items-start gap-5 pt-2">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-100">
                <FeatherCheck className="text-caption font-caption text-brand-700" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Swap LLM providers freely
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Use OpenAI, Anthropic, local models, or any provider. No
                  lock-in.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-100">
                <FeatherCheck className="text-caption font-caption text-brand-700" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Community-driven roadmap
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Every feature is proposed, discussed, and voted on in the
                  open.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-100">
                <FeatherCheck className="text-caption font-caption text-brand-700" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Apache 2.0 Licensed
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Permissive licensing that works for individuals, startups, and
                  enterprises.
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
      <div className="flex w-full flex-col items-center px-8 py-24 bg-gradient-to-br from-brand-900 to-brand-700 mobile:px-4 mobile:py-14">
        <div className="flex flex-col items-center gap-8 max-w-[600px]">
          <div className="flex flex-col items-center gap-4">
            <span className="font-['Inter'] text-[38px] font-[700] leading-[44px] text-white text-center -tracking-[0.035em] mobile:font-['Jost'] mobile:text-[28px] mobile:font-[400] mobile:leading-[34px] mobile:tracking-normal">
              Ready to give your maintainers time back?
            </span>
            <span className="text-body font-body text-brand-200 text-center">
              Join the growing community of open-source projects using Apache
              Magpie to scale their review processes without burning out their
              maintainers.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/docs">
              <Button size="large" icon={<FeatherArrowRight />}>
                Get Started Free
              </Button>
            </a>
            <a href="https://github.com/apache/airflow-steward" target="_blank" rel="noreferrer">
              <Button
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
                size="large"
                icon={<FeatherGithub />}
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
              src="/wordmark.svg"
              alt="Apache Magpie"
            />
            <span className="text-caption font-caption text-subtext-color max-w-[260px]">
              An Apache Software Foundation project. AI-powered assistance for
              open-source maintainers.
            </span>
            <div className="flex items-center gap-2">
              <a href="https://github.com/apache/airflow-steward" target="_blank" rel="noreferrer" aria-label="GitHub">
                <IconButton icon={<FeatherGithub />} />
              </a>
              <a href="https://twitter.com/TheASF" target="_blank" rel="noreferrer" aria-label="Twitter">
                <IconButton icon={<FeatherTwitter />} />
              </a>
              <a href="https://the-asf.slack.com" target="_blank" rel="noreferrer" aria-label="Slack">
                <IconButton icon={<FeatherSlack />} />
              </a>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-wrap items-start gap-8">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 min-w-[130px]">
              <span className="text-body-bold font-body-bold text-default-font">Project</span>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="#features">Features</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="/docs">Documentation</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/airflow-steward/issues">Roadmap</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/airflow-steward/releases">Changelog</a>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 min-w-[130px]">
              <span className="text-body-bold font-body-bold text-default-font">Community</span>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/airflow-steward/blob/main/CONTRIBUTING.md">Contributing</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://lists.apache.org/list.html?dev-magpie@airflow.apache.org">Mailing Lists</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://the-asf.slack.com">Slack Channel</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://github.com/apache/airflow-steward/issues">Issue Tracker</a>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-3 min-w-[130px]">
              <span className="text-body-bold font-body-bold text-default-font">Foundation</span>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://apache.org/">Apache Home</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/licenses/LICENSE-2.0">License</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/foundation/sponsorship.html">Sponsorship</a>
              <a className="text-body font-body text-subtext-color hover:text-brand-600" href="https://www.apache.org/security/">Security</a>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between border-t border-solid border-neutral-100 pt-6 max-w-[1100px] mobile:flex-col mobile:gap-3">
          <span className="text-caption font-caption text-subtext-color">
            Copyright © 2026 The Apache Software Foundation. All rights
            reserved.
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Apache Magpie is an effort undergoing at The ASF.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default ImmersiveGradientHero;
