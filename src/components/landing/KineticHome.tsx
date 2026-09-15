// SPDX-License-Identifier: Apache-2.0
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  ArrowDown,
  RotateCw,
  ShieldCheck,
  GitPullRequest,
  Fingerprint,
  Layers,
  Menu,
  X,
  Pause,
  Play,
  BookOpen,
  Activity,
  Wrench,
  Sprout,
  GitCompare,
  Filter,
  Rocket,
} from "lucide-react";
import { BadgeHero } from "./BadgeHero";
import { TerminalPreview } from "./TerminalDemo";
import { MagpieFlight } from "./MagpieFlight";
import { SiteFooter } from "./SiteFooter";
import { withBase } from "@/ui/lib/utils";
import counts from "@/data/skill-counts.json";
import community from "@/data/community.json";
import tools from "@/data/tools.json";
import "../../styles/kinetic-home.css";

gsap.registerPlugin(ScrollTrigger);

const families = [
  {
    name: "pr-management",
    title: "A calmer pull request queue.",
    text: "Organize incoming pull requests, identify what needs attention, and prepare structured code reviews. Get a clearer queue and review findings you can act on.",
    path: "pr-management",
    icon: GitPullRequest,
    group: "Maintain",
  },
  {
    name: "issue",
    title: "Make sense of the backlog.",
    text: "Turn an issue backlog into concrete next steps: triage reports, find duplicates, reproduce bugs, and prepare fixes. Reassess older issues before spending time on them.",
    path: "issue-management",
    icon: Filter,
    group: "Maintain",
  },
  {
    name: "security",
    title: "Care at every security step.",
    text: "Follow security reports from intake and triage through remediation and CVE publication. Keep the evidence, decisions, and disclosure steps organized in one workflow.",
    path: "security",
    icon: ShieldCheck,
    group: "Maintain",
  },
  {
    name: "repo-health",
    title: "Keep the foundations healthy.",
    text: "Check dependencies, licenses, CI workflows, and unreliable tests through read-only audits. Review specific findings and suggested remedies before making changes.",
    path: "repo-health",
    icon: Activity,
    group: "Maintain",
    experimental: true,
  },
  {
    name: "release-management",
    title: "Give releases a clear path.",
    text: "Prepare release artifacts, verify a release candidate, and draft vote and announcement messages. Follow the ASF release process while maintainers retain signing and publication control.",
    path: "release-management",
    icon: Rocket,
    group: "Maintain",
  },
  {
    name: "mentoring",
    title: "Help the next contributor.",
    text: "Help a newcomer understand an issue, navigate project conventions, and prepare a first contribution. Provide practical explanations and feedback tailored to their next step.",
    path: "mentoring",
    icon: BookOpen,
    group: "Grow",
    experimental: true,
  },
  {
    name: "contributor-growth",
    title: "Grow a lasting community.",
    text: "Understand contributor activity, spot opportunities for support, and assess readiness for greater responsibility. Prepare evidence-based nomination briefs and onboarding guidance.",
    path: "contributor-growth",
    icon: Sprout,
    group: "Grow",
  },
  {
    name: "pairing",
    title: "Another perspective on your work.",
    text: "Review your local changes before opening a pull request. Use a structured self-review or independent review perspectives to identify gaps and prepare a stronger submission.",
    path: "pairing",
    icon: GitCompare,
    group: "Build",
    experimental: true,
  },
  {
    name: "setup",
    title: "Start with a sound foundation.",
    text: "Install Magpie, connect project-specific tools and conventions, and configure an isolated agent environment. Check setup status and keep the framework configuration up to date.",
    path: "setup",
    icon: Layers,
    group: "Build",
  },
  {
    name: "utilities",
    title: "Make the framework your own.",
    text: "Find the right skill, write a reusable workflow, or improve an existing one. Explore the framework’s capabilities and adapt its workflows to your project.",
    path: "utilities",
    icon: Wrench,
    group: "Build",
  },
];
const nav = [
  { label: "See it in action", id: "demo" },
  { label: "The toolkit", id: "skill-families" },
  { label: "The people", id: "community" },
];
function OutLink({
  href,
  children,
  className = "k-link",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href.startsWith("/") ? withBase(href) : href}
      className={className}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}
function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="44"
          y="3"
          width="12"
          height="94"
          rx="2"
          transform={`rotate(${i * 22.5} 50 50)`}
        />
      ))}
    </svg>
  );
}

const skillPhotos: Record<string, string> = {
  "pr-management": "collaboration",
  issue: "health-review",
  security: "security-review",
  "repo-health": "team-review",
  "release-management": "release-planning",
  mentoring: "workshop",
  "contributor-growth": "maintainer-work",
  pairing: "building-tools",
  setup: "pair-work",
  utilities: "team-discussion",
};

function SkillPhotoCard({
  family: f,
  paused,
}: {
  family: (typeof families)[number];
  paused: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const name = f.name.replaceAll("-", " ");
  return (
    <article
      className={`k-skill k-photo-skill k-skill-${f.group.toLowerCase()}`}
      data-flipped={flipped}
      data-paused={paused}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches)
          setFlipped(true);
      }}
      onMouseLeave={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX < box.right &&
          event.clientY >= box.top &&
          event.clientY < box.bottom;
        if (!inside && !event.currentTarget.contains(document.activeElement))
          setFlipped(false);
      }}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          !event.currentTarget.matches(":hover")
        )
          setFlipped(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setFlipped(false);
          event.currentTarget
            .querySelector<HTMLButtonElement>(".k-flip-toggle")
            ?.focus();
        }
      }}
    >
      <button
        className="k-flip-toggle"
        onClick={() => setFlipped(!flipped)}
        aria-expanded={flipped}
        aria-controls={`skill-details-${f.name}`}
        aria-label={`${flipped ? "Show photo" : "Show details"} for ${name}`}
      >
        <RotateCw size={17} aria-hidden="true" />
        <span>{flipped ? "Photo" : "Explore"}</span>
      </button>
      <div className="k-flip-inner">
        <div className="k-flip-front" aria-hidden={flipped} inert={flipped}>
          <img
            src={withBase(
              `/photos/${skillPhotos[f.name] || "collaboration"}.jpg`,
            )}
            alt=""
            width="800"
            height="533"
            loading="lazy"
          />
          <div className="k-photo-shade" />
          <span className="k-photo-family">
            <f.icon size={21} strokeWidth={1.5} />
            {f.group}
          </span>
          <div className="k-photo-flags">
            {f.name === "setup" && <span>Start here</span>}
            {f.name === "security" && <span>Maintainer-only</span>}
            {f.experimental && <span>Experimental</span>}
            {tools.asfFamilies.includes(f.path) && <span>ASF-specific</span>}
          </div>
          <div className="k-photo-title">
            <span>
              {(counts.counts as Record<string, number>)[f.name]} SKILLS
            </span>
            <h3>{name}</h3>
          </div>
        </div>
        <div
          className="k-flip-back"
          id={`skill-details-${f.name}`}
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <span className="k-skill-icon">
            <f.icon size={25} strokeWidth={1.5} />
          </span>
          <h3>{name}</h3>
          <p>{f.text}</p>
          <div className="k-skill-bottom">
            <span>{f.group}</span>
            {f.name === "security" && <span>Maintainer-only</span>}
            {f.name === "setup" && <span>Start here</span>}
            {f.experimental && <span>Experimental</span>}
            {tools.asfFamilies.includes(f.path) && <span>ASF-specific</span>}
          </div>
          <OutLink href={`/docs/${f.path}/readme`} className="k-flip-docs">
            Explore skills
          </OutLink>
        </div>
      </div>
    </article>
  );
}

export default function KineticHome() {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState("All");
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const context = gsap.context(() => {
      if (paused) return;
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(".k-hero-title>span", {
            yPercent: 105,
            rotate: 3,
            opacity: 0,
            duration: 1,
            stagger: 0.12,
          })
          .from(
            ".k-hero-bottom",
            { opacity: 0, y: 18, duration: 0.65 },
            0.4,
          )
          .from(
            ".k-hero-art",
            {
              opacity: 0,
              duration: 0.35,
            },
            0.3,
          );
        gsap.to(".k-magpie-shadow", {
          scale: 0.82,
          opacity: 0.12,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          scrollTrigger: {
            trigger: ".k-hero",
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });
        gsap.to(".k-art-badge", {
          y: -12,
          rotation: 4,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          scrollTrigger: {
            trigger: ".k-hero",
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            y: 45,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          }),
        );
      });
    }, root);
    return () => {
      mm.revert();
      context.revert();
    };
  }, [paused]);
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        root.current
          ?.querySelector<HTMLButtonElement>(".k-menu-button")
          ?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [menu]);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!paused && !matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.from(".k-skill", {
          y: 18,
          opacity: 0,
          duration: 0.35,
          stagger: 0.035,
        });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [filter, paused]);
  return (
    <div className="k-home" ref={root}>
      <a className="k-skip" href="#main">
        Skip to content
      </a>
      <header className="k-header">
        <a
          href={withBase("/")}
          aria-label="Apache Magpie home"
          className="k-logo"
        >
          <img
            className="k-official-mark"
            src={withBase("/subframe-mark.svg")}
            width="40"
            height="40"
            alt=""
          />
          <img
            className="k-official-wordmark"
            src={withBase("/subframe-wordmark.png")}
            height="40"
            alt="Apache Magpie"
          />
          <sup aria-hidden="true">™</sup>
        </a>
        <nav aria-label="Main navigation" className="k-nav">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`}>
              {n.label}
            </a>
          ))}
          <OutLink href="/docs">Docs</OutLink>
          <OutLink href="/architecture">Architecture</OutLink>
          <OutLink href="/tools">Tools</OutLink>
          <OutLink href="/downloads">Downloads</OutLink>
        </nav>
        <OutLink
          href="/docs/quick-start"
          className="k-button k-small"
        >
          Get started
        </OutLink>
        <button
          className="k-menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          aria-controls="kinetic-menu"
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          hidden={!menu}
          id="kinetic-menu"
          className="k-mobile-nav"
          aria-label="Mobile navigation"
        >
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setMenu(false)}>
              {n.label}
              <ArrowDown size={18} />
            </a>
          ))}
          <OutLink href="/docs">Documentation</OutLink>
          <OutLink href="/architecture">Architecture</OutLink>
          <OutLink href="/tools">Tools</OutLink>
          <OutLink href="/downloads">Downloads</OutLink>
        </nav>
      </header>
      <main id="main">
        <section className="k-hero" aria-labelledby="hero-title">
          <div className="k-hero-grid">
            <h1 id="hero-title" className="k-hero-title">
              <span>LESS</span>
              <span>BUSYWORK.</span>
              <span className="k-blue">MORE</span>
              <span className="k-blue">
                BUILDING<span className="k-period">.</span>
              </span>
            </h1>
            <div className="k-hero-art k-hero-mascot">
              <div className="k-art-grid" aria-hidden="true" />
              <div className="k-art-circle" aria-hidden="true" />
              <div className="k-magpie-shadow" aria-hidden="true" />
              <MagpieFlight paused={paused} />
              <div className="k-art-badge">
                <ArrowUpRight strokeWidth={1.7} />
                <span>
                  HUMANS
                  <br />
                  IN THE LOOP
                </span>
              </div>
              <span className="k-art-caption">
                A LITTLE ASSISTANCE. A LOT OF POSSIBILITY.
              </span>
            </div>
          </div>
          <div className="k-hero-bottom">
            <p>
              For the people keeping open source moving.
              <br />A curated set of AI agent skills that takes on repetitive
              <br className="k-desktop-break" /> work, so you can get back to
              yours.
            </p>
            <div>
              <OutLink href="/docs/quick-start" className="k-button">
                Put Magpie to work
              </OutLink>
              <a href="#demo" className="k-discover">
                See it in action <ArrowDown size={16} />
              </a>
            </div>
            <button
              className="k-motion"
              onClick={() => setPaused(!paused)}
              aria-pressed={paused}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
              <span>{paused ? "Motion off" : "Motion on"}</span>
            </button>
          </div>
        </section>
        <TerminalPreview paused={paused} />
        <section className="k-section k-toolkit" id="skill-families">
          <div className="k-toolkit-heading">
            <h2 data-reveal>
              Less on your plate.
              <br />
              <span>Pick your starting point.</span>
            </h2>
          </div>
          <aside className="k-start-here">
            <div><strong>Start with the essentials.</strong><p>Install Setup first, with Agent Guard and Utilities as the recommended baseline. Then choose the families that solve your next task.</p></div>
            <OutLink href="/docs/quick-start" className="k-button">Start here</OutLink>
          </aside>
          <div className="k-filters" aria-label="Filter skill families">
            {["All", "Maintain", "Grow", "Build"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
                <span>
                  {families
                    .filter((x) => f === "All" || x.group === f)
                    .length.toString()
                    .padStart(2, "0")}
                </span>
              </button>
            ))}
            <span className="k-result-count" aria-live="polite">
              {
                families.filter((x) => filter === "All" || x.group === filter)
                  .length
              }{" "}
              families
            </span>
          </div>
          <div className="k-skills-grid">
            {families
              .filter((f) => filter === "All" || f.group === filter)
              .map((f) => (
                <SkillPhotoCard key={f.name} family={f} paused={paused} />
              ))}
          </div>
        </section>
        <section className="k-values k-section" id="privacy-security">
          <h2 data-reveal>
            Good boundaries.
            <br />
            <span>Better assistance.</span>
          </h2>
          <div className="k-values-grid">
            {[
              {
                icon: ShieldCheck,
                title: "Your control.",
                text: "Explicit confirmation before outward actions. The agent proposes; you review and decide.",
                href: "/docs/principles",
              },
              {
                icon: Fingerprint,
                title: "Your privacy.",
                text: "Isolated environments, deliberate model routing, and an audit trail for agent-authored actions.",
                href: "/docs/setup/secure-agent-setup",
              },
              {
                icon: Layers,
                title: "Your choice.",
                text: "Use your own models, runtime, and tools. Skills describe capabilities, not vendors.",
                href: "/docs/vendor-neutrality",
              },
            ].map((v) => (
              <article key={v.title} data-reveal>
                <v.icon size={32} strokeWidth={1.3} />
                <h3>{v.title}</h3>
                <p>{v.text}</p>
                <OutLink href={v.href}>Learn more</OutLink>
              </article>
            ))}
          </div>
          <div className="k-trust-link"><OutLink href="/architecture">How it fits together</OutLink></div>
        </section>
        <section className="k-community k-section" id="community">
          <div className="k-community-title">
            <h2>
              Built by people
              <br />
              who <span>give a fork.</span>
            </h2>
            <Asterisk />
          </div>
          <div className="k-people">
            {community.members.map((p) =>
              p.url ? (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  title={p.name}
                  aria-label={`${p.name} (opens in new tab)`}
                >
                  {p.avatar ? (
                    <img
                      src={withBase(p.avatar)}
                      alt={p.name}
                      width="80"
                      height="80"
                      loading="lazy"
                    />
                  ) : (
                    <span>{p.name.slice(0, 2)}</span>
                  )}
                </a>
              ) : (
                <span key={p.name}>{p.name}</span>
              ),
            )}
          </div>
          <div className="k-community-bottom">
            <p>
              {community.members.length} committers & PMC members.
              <br />
              Open discussions. Shared decisions. Real humans.
            </p>
            <OutLink
              href="https://github.com/apache/magpie/blob/main/CONTRIBUTING.md"
              className="k-button"
            >
              Make your first contribution
            </OutLink>
            <OutLink href="https://lists.apache.org/list.html?dev@magpie.apache.org">
              Browse discussions
            </OutLink>
          </div>
          <div className="k-community-next">
            <OutLink href="/resources#education">Learn to work with agents</OutLink>
            <OutLink href="/docs/modes">Explore agentic modes</OutLink>
          </div>
        </section>
        <BadgeHero paused={paused} />
        <section className="k-close">
          <span className="k-section-label">
            YOUR NEXT GOOD IDEA IS WAITING.
          </span>
          <h2>
            GO BUILD
            <br />
            SOMETHING
            <Asterisk />.
          </h2>
          <div>
            <p>
              Let Magpie help with the rest.
              <br />
              Free, open source, and always human led.
            </p>
            <OutLink href="/docs/quick-start" className="k-button">
              Get started with Magpie
            </OutLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
