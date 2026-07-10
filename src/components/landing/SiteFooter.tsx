import React from "react";
import { ArrowUpRight } from "lucide-react";
import { IconButton } from "@/ui/components/IconButton";
import { withBase } from "@/ui/lib/utils";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
  </svg>
);
const SlackIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M6 15a2 2 0 1 1-2-2h2v2Zm1 0a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0v-5Zm2-9a2 2 0 1 1 2-2v2H9Zm0 1a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4h5Zm9 2a2 2 0 1 1 2 2h-2V9Zm-1 0a2 2 0 1 1-4 0V4a2 2 0 1 1 4 0v5Zm-2 9a2 2 0 1 1-2 2v-2h2Zm0-1a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4h-5Z" />
  </svg>
);

// ── Link primitives ────────────────────────────────────────────────────────
// Two kinds of footer link, so the "opens in a new tab ⇒ trailing ↗" rule is
// enforced by construction and can't drift:
//   SameTabLink — opens in place, no arrow.
//   NewTabLink  — opens in a new tab, always shows ↗.
const linkCls =
  "inline-flex items-center gap-1 whitespace-nowrap text-body font-body text-subtext-color hover:text-brand-600";

const SameTabLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className={linkCls} href={href}>
    {children}
  </a>
);

const NewTabLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className={linkCls} href={href} target="_blank" rel="noreferrer">
    {children}
    <ArrowUpRight className="size-3.5" />
  </a>
);

// ── Footer link model ───────────────────────────────────────────────────────
// The single source of truth for footer navigation. Both the landing page and
// every other page render this same <SiteFooter>, so the columns stay in sync.
// `newTab` (external links and the docs pages) opens in a new tab with a ↗.
type FooterLink = { label: string; href: string; newTab?: boolean };

const columns: { title: string; links: FooterLink[]; twoCol?: boolean }[] = [
  {
    title: "Documentation",
    links: [
      { label: "Documentation", href: withBase("/docs"), newTab: true },
      { label: "Architecture", href: withBase("/architecture"), newTab: true },
      { label: "Tools", href: withBase("/tools"), newTab: true },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Downloads", href: withBase("/downloads") },
      { label: "Brand assets", href: withBase("/brand") },
      { label: "Roadmap", href: "https://github.com/apache/magpie/issues", newTab: true },
      { label: "Changelog", href: "https://github.com/apache/magpie/releases", newTab: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Contributing", href: "https://github.com/apache/magpie/blob/main/CONTRIBUTING.md", newTab: true },
      { label: "Mailing Lists", href: "https://lists.apache.org/list.html?dev@magpie.apache.org", newTab: true },
      { label: "Slack Channel", href: "https://the-asf.slack.com/archives/C0BD1EBMVEJ", newTab: true },
      { label: "Issue Tracker", href: "https://github.com/apache/magpie/issues", newTab: true },
      { label: "Report a site issue", href: "https://github.com/apache/magpie-site/issues/new", newTab: true },
    ],
  },
  {
    title: "Foundation",
    // Rendered two links per row to save vertical space (7 external links).
    twoCol: true,
    links: [
      { label: "Apache Home", href: "https://www.apache.org/", newTab: true },
      { label: "License", href: "https://www.apache.org/licenses/", newTab: true },
      { label: "Events", href: "https://www.apache.org/events/current-event", newTab: true },
      { label: "Sponsorship", href: "https://www.apache.org/foundation/sponsorship.html", newTab: true },
      { label: "Thanks", href: "https://www.apache.org/foundation/thanks.html", newTab: true },
      { label: "Security", href: "https://www.apache.org/security/", newTab: true },
      { label: "Privacy", href: "https://privacy.apache.org/policies/privacy-policy-public.html", newTab: true },
    ],
  },
];

export function SiteFooter() {
  return (
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
              <IconButton icon={<GithubIcon />} />
            </a>
            <a href="https://twitter.com/TheASF" target="_blank" rel="noreferrer" aria-label="Twitter">
              <IconButton icon={<TwitterIcon />} />
            </a>
            <a href="https://the-asf.slack.com/archives/C0BD1EBMVEJ" target="_blank" rel="noreferrer" aria-label="Slack">
              <IconButton icon={<SlackIcon />} />
            </a>
          </div>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-wrap items-start gap-8">
          {columns.map((col) => (
            <div key={col.title} className={`flex grow shrink-0 basis-0 flex-col items-start gap-3 ${col.twoCol ? "min-w-[200px]" : "min-w-[130px]"}`}>
              <span className="text-body-bold font-body-bold text-default-font">{col.title}</span>
              <div className={col.twoCol ? "grid grid-cols-[auto_auto] justify-start gap-x-8 gap-y-3" : "flex flex-col items-start gap-3"}>
                {col.links.map((link) =>
                  link.newTab ? (
                    <NewTabLink key={link.label} href={link.href}>{link.label}</NewTabLink>
                  ) : (
                    <SameTabLink key={link.label} href={link.href}>{link.label}</SameTabLink>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col items-center gap-3 border-t border-solid border-neutral-100 pt-6 max-w-[1100px]">
        <span className="text-caption font-caption text-subtext-color text-center">
          Copyright © 2026 The Apache Software Foundation, Licensed under the Apache License, Version 2.0.
        </span>
        <span className="text-caption font-caption text-subtext-color text-center max-w-[860px]">
          Apache Magpie, Magpie, and Apache are either registered trademarks or trademarks of The Apache Software Foundation in the United States and other countries. All other marks mentioned may be trademarks or registered trademarks of their respective owners.
        </span>
      </div>
    </footer>
  );
}
