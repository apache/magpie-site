// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { ArrowUpRight, Check, Copy, BookOpen } from "lucide-react";
import { withBase } from "@/ui/lib/utils";

function ResourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="k-link" href={href.startsWith('/') ? withBase(href) : href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={16} aria-hidden="true" /></a>;
}

const education = [
  { title: "Working with agents", description: "Get oriented before you build.", links: [
    ["What agents are", "/docs/education/what-agents-are"], ["Working with agents", "/docs/education/working-with-agents"], ["Choosing models", "/docs/education/choosing-models"],
  ] },
  { title: "Authoring skills", description: "Write, harden, and test a skill.", links: [
    ["Your first skill", "/docs/education/your-first-skill"], ["Writing safe skills", "/docs/education/writing-safe-skills"], ["Debugging a skill", "/docs/education/debugging-skills"], ["Writing portable skills", "/docs/education/portable-skills"], ["Eval-driven development", "/docs/education/eval-driven-development"],
  ] },
  { title: "Going further", description: "Run at scale and give back.", links: [
    ["Agentic & autonomous work", "/docs/education/agentic-work"], ["English as a programming language", "/docs/education/english-as-code"], ["Contributing back", "/docs/education/contributing"],
  ] },
];

export function KineticEducation() {
  return <section className="k-section k-education" id="education">
    <div className="k-section-label"><span>NEW TO AGENTS? START HERE.</span><BookOpen size={24} /></div>
    <div className="k-resource-heading"><h2>Curiosity<br /><span>comes first.</span></h2><p>Learn the basics. Write a skill. Test it. Follow the three groups in order, or start with the one you need.</p></div>
    <div className="k-resource-grid">{education.map((group, index) => <article key={group.title}><span className="k-section-label">0{index + 1}</span><h3>{group.title}</h3><p>{group.description}</p><div className="k-resource-list">{group.links.map(([label, href]) => <ResourceLink key={href} href={href}>{label}</ResourceLink>)}</div></article>)}</div>
    <div className="k-resource-links"><ResourceLink href="/docs/education/pattern-catalogue">Pattern catalogue</ResourceLink><ResourceLink href="/docs/education/tutorials">Hands-on tutorials</ResourceLink><ResourceLink href="/docs/education/training/readme">Run a training course</ResourceLink><ResourceLink href="/docs/education/readme">Explore the education stream</ResourceLink></div>
  </section>;
}

const badgeMarkdown = '[![Magpie](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/apache/magpie/main/assets/badge.json)](https://magpie.apache.org/)';

export function KineticAdoption() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return <section className="k-section k-adoption" id="adopt-magpie">
    <div className="k-resource-heading"><div><span className="k-section-label">OPEN TO YOUR WAY OF WORKING.</span><h2>Make it<br /><span>your own.</span></h2></div><p>Use Magpie in a foundation, a company, or an independent project. Add an adapter, extend a skill, or contribute an organization bundle.</p></div>
    <div className="k-resource-links"><ResourceLink href="/architecture">Organizations and architecture</ResourceLink><ResourceLink href="/docs/extending">Extend Magpie</ResourceLink><ResourceLink href="/docs/skill-sources/authoring-a-source">Publish an external skill source</ResourceLink><ResourceLink href="mailto:dev@magpie.apache.org">Propose an organization</ResourceLink></div>
    <div className="k-badge-box"><div><h3>Adopt a Magpie!</h3><p>Already using Magpie? Add the badge to your project’s README.</p><img src={withBase('/subframe-mark.svg')} width="32" height="32" alt="" /><span className="k-badge-preview">Maintained with Magpie</span></div><div><label htmlFor="magpie-badge-markdown">README badge Markdown</label><textarea id="magpie-badge-markdown" readOnly value={badgeMarkdown} rows={3} onFocus={event => event.currentTarget.select()} /><button className="k-button" onClick={async () => {let success = false;
        try { await navigator.clipboard.writeText(badgeMarkdown); success = true; }
        catch {
          const field = document.getElementById('magpie-badge-markdown') as HTMLTextAreaElement | null;
          field?.focus(); field?.select();
          try { success = document.execCommand('copy'); } catch { success = false; }
        }
        setCopied(success); setFailed(!success);}}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy badge'}</button><span role="status">{failed ? 'Select the Markdown above and copy it manually.' : copied ? 'Badge Markdown copied.' : ''}</span></div></div>
  </section>;
}
