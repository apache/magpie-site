import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { withBase } from "@/ui/lib/utils";

export type InstallOption = { id: string; name: string; where: string; commands: string; detail: string; guide: string; verify: string };
function CopyText({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState("");
  return <button type="button" className="button button-secondary button-small copy-command" aria-label={label} onClick={async () => {
    try { await navigator.clipboard.writeText(text); setStatus("Copied"); }
    catch { setStatus("Select and copy the text below"); }
    setTimeout(() => setStatus(""), 2500);
  }}>{status === "Copied" ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}<span aria-live="polite">{status || "Copy"}</span></button>;
}
function CopyBlock({ text, label, code = false }: { text: string; label: string; code?: boolean }) {
  return <div className={`surface-card copy-block ${code ? "install-code" : "start-request"}`}>
    {code ? <pre tabIndex={0} aria-label="Installation commands"><code>{text}</code></pre> : <p>{text}</p>}
    <CopyText key={text} text={text} label={label} />
  </div>;
}
export default function StartGuide({ agents }: { agents: InstallOption[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [selected, setSelected] = useState(agents[0].id);
  const agent = agents.find(item => item.id === selected)!;
  const setupPrompt = "Set up Magpie for my own work on this project, including secure isolation and privacy settings. Show me the proposed changes before installing anything.";
  const reviewPrompt = "Install Magpie’s PR review workflows and help me review a pull request. Ask me for the PR, then prepare findings for my approval.";
  return <div className="start-guide">
    <div className="agent-choice"><label htmlFor="start-agent">Which agent do you use?</label><select className="field-control" disabled={!ready} id="start-agent" value={selected} onChange={event => setSelected(event.target.value)}>{agents.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select><a className="text-link" href={withBase('/docs/setup/marketplace-install')} target="_blank" rel="noreferrer">Another agent</a></div>
    <section id="install" className="start-step" aria-labelledby="install-title">
      <h2 id="install-title">Install Magpie in {agent.name}</h2>
      <p>{agent.where}</p>
      <CopyBlock text={agent.commands} label="Copy installation commands" code />
      <p>{agent.detail}</p>
      <p className="install-verify">{agent.verify} <a href={withBase(agent.guide)} target="_blank" rel="noreferrer">Installation details</a></p>
    </section>
    <section id="prepare" className="start-step" aria-labelledby="prepare-title">
      <h2 id="prepare-title">Let Magpie prepare your workspace</h2>
      <p>Open your project in the agent and send this request. Magpie checks what is missing and proposes the setup for you to review.</p>
      <CopyBlock text={setupPrompt} label="Copy workspace setup request" />
      <p>You approve the configuration and installation changes. <a href={withBase('/docs/setup/secure-agent-setup')} target="_blank" rel="noreferrer">See how isolation works</a>.</p>
    </section>
    <section id="try" className="start-step" aria-labelledby="try-title">
      <h2 id="try-title">Try it on a pull request</h2>
      <CopyBlock text={reviewPrompt} label="Copy first workflow request" />
      <p>Magpie prepares a review with evidence. You decide which findings to use and what to publish.</p>
      <a className="text-link" href={withBase('/docs/quick-start/families')} target="_blank" rel="noreferrer">Choose a different workflow</a>
    </section>
    <div className="start-reference"><a href={withBase('/docs/quick-start')} target="_blank" rel="noreferrer">Read the full setup guide</a><a href={withBase('/docs/setup/team-adoption')} target="_blank" rel="noreferrer">Adopt Magpie as a team</a></div>
  </div>;
}
