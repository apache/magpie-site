import { Menu } from "lucide-react";
import { withBase } from "@/ui/lib/utils";

// The home page's sections. On other pages the same menu links back to them,
// so every page offers one way to reach any part of the site.
export default function HomeNavigation({ homepage = true }: { homepage?: boolean }) {
  const section = (id: string) => homepage ? `#${id}` : withBase(`/#${id}`);
  return <details className="home-navigation">
    <summary><Menu size={20} aria-hidden="true" /><span>Sections</span></summary>
    <nav aria-label={homepage ? "On this page" : "Home page sections"}>
      <a href={section("overview")}>Overview</a>
      <a href={section("airflow")}>Who’s using Magpie</a>
      <a href={section("how-it-works")}>Skills for everyday work</a>
      <a href={section("agent-isolation")}>Agent isolation</a>
      <a href={section("project-rules")}>Your project’s rules</a>
      <a href={section("learning")}>Learning guides</a>
      <a href={section("get-started")}>Try Magpie</a>
      <a className="home-start-link" href={withBase("/start")} target="_blank" rel="noreferrer">Get started</a>
      <a className="home-docs-link" href={withBase("/docs")} target="_blank" rel="noreferrer">Documentation</a>
    </nav>
  </details>;
}
