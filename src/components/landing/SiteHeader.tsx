import React from "react";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { ArrowRight, Menu } from "lucide-react";
import { withBase } from "@/ui/lib/utils";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

export function SiteHeader({ tone = "default" }: { tone?: "default" | "hero" }) {
  const ghBtnClass =
    tone === "hero"
      ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
      : "";
  return (
    <nav className="relative z-10 flex w-full items-center justify-between bg-default-background px-8 py-5 mobile:px-4">
      <a
        href={withBase("/")}
        aria-label="Apache Magpie home"
        className="flex items-end justify-end gap-2 px-2 py-2"
      >
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
      <div className="flex items-center gap-7 mobile:hidden">
        <a className="text-body font-body text-brand-600 hover:text-brand-700" href={`${withBase("/")}#features`}>Features</a>
        <a className="text-body font-body text-brand-600 hover:text-brand-700" href={withBase("/docs")}>Docs</a>
        <a className="text-body font-body text-brand-600 hover:text-brand-700" href="https://lists.apache.org/list.html?dev@magpie.apache.org">Community</a>
        <a className="text-body font-body text-brand-600 hover:text-brand-700" href="https://github.com/apache/magpie">GitHub</a>
      </div>
      <div className="flex items-center gap-2">
        <a href="https://github.com/apache/magpie" target="_blank" rel="noreferrer" className="mobile:hidden">
          <Button className={ghBtnClass} variant="neutral-secondary" icon={<GithubIcon />}>
            Star on GitHub
          </Button>
        </a>
        <a href={withBase("/docs")}>
          <Button icon={<ArrowRight />}>Get Started</Button>
        </a>
        <IconButton
          className={tone === "hero" ? "hidden text-white mobile:flex" : "hidden mobile:flex"}
          icon={<Menu />}
          aria-label="Open menu"
        />
      </div>
    </nav>
  );
}
