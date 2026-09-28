import { Menu } from "lucide-react";
import { withBase } from "@/ui/lib/utils";

export default function HomeNavigation() {
  return <details className="home-navigation">
    <summary><Menu size={20} aria-hidden="true" /><span>Sections</span></summary>
    <nav aria-label="On this page">
      <a href="#overview">Overview</a>
      <a href="#airflow">Who’s using Magpie</a>
      <a href="#how-it-works">Skills for everyday work</a>
      <a href="#agent-isolation">Agent isolation</a>
      <a href="#project-rules">Your project’s rules</a>
      <a href="#learning">Learning guides</a>
      <a href="#get-started">Try Magpie</a>
      <a className="home-start-link" href={withBase("/start")} target="_blank" rel="noreferrer">Get started</a>
      <a className="home-docs-link" href={withBase("/docs")} target="_blank" rel="noreferrer">Documentation</a>
    </nav>
  </details>;
}
