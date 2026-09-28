import { Menu, Search, Moon, Sun } from "lucide-react";
import { withBase } from "@/ui/lib/utils";

export function SiteHeader({ search = false, currentPath = "" }: { search?: boolean; currentPath?: string }) {
  const installing = currentPath.replace(/\/$/, "") === "/start";
  const themeToggle = <button className="button button-quiet button-icon theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false"><Moon className="theme-moon" size={18} aria-hidden="true" /><Sun className="theme-sun" size={18} aria-hidden="true" /></button>;
  return <header className="site-header">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="header-inner">
      <a className="brand-lockup" href={withBase("/")} aria-label="Apache Magpie home"><img className="official-wordmark" src={withBase("/wordmark.svg")} alt="Apache Magpie" width="160" height="45" /></a>
      {search ? <div className="header-actions">
        <button className="button button-quiet button-icon docs-menu-toggle" aria-label="Browse documentation" aria-expanded="false" aria-controls="docs-sidebar"><Menu size={21} aria-hidden="true" /><span>Browse</span></button>
        <button className="docs-search-trigger" aria-label="Search docs" data-search-open><Search size={18} aria-hidden="true" /><span>Search docs</span><kbd>⌘ K</kbd></button>
        {themeToggle}
      </div> : <nav className="site-navigation" aria-label="Main navigation">
        <a className="nav-story" href={withBase("/#how-it-works")}>How it works</a>
        <a href={withBase("/docs")} target="_blank" rel="noreferrer">Docs</a>
        {themeToggle}
        {!installing && <a className="button button-small" href={withBase("/start")} target="_blank" rel="noreferrer">Get started</a>}
      </nav>}
    </div>
  </header>;
}
