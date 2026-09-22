// SPDX-License-Identifier: Apache-2.0
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import gsap from "gsap";
import { withBase } from "@/ui/lib/utils";
import "../../styles/terminal-demo.css";

const previewLines = [
  { kind: "prompt", text: "> Help me triage this private security report." },
  { kind: "muted", text: "1. Intake — summarize the report in the private workspace." },
  { kind: "result", text: "2. Triage — check the evidence and affected versions." },
  { kind: "result", text: "3. Remediation — propose a fix and regression checks." },
  { kind: "result", text: "4. Disclosure — prepare an advisory for maintainer review." },
  { kind: "muted", text: "Fictional report. Nothing sent or published." },
  { kind: "gate", text: "Review each proposal before moving to the next step." },
];

const securityStages = [
  {
    title: '1/4 · Private intake',
    proposal: 'A reporter says a private export can be opened by another account.\nPrepare an acknowledgement and keep the report in the private security workspace.',
    details: 'Record the report, the reporter’s contact details, and the affected component privately. Ask for version and reproduction details. Do not copy the report to a public issue.',
    approved: 'Acknowledgement draft approved in this simulation. Nothing sent. Continue with triage.',
  },
  {
    title: '2/4 · Triage',
    proposal: 'The fictional report includes a reproduction showing a missing ownership check.\nPropose checking supported versions and recording the impact before deciding severity.',
    details: 'Evidence in this example: account B can read an export owned by account A. Affected versions and severity are still unconfirmed. The security team reviews those conclusions.',
    approved: 'Triage plan approved in this simulation. No checks were run. Continue with remediation.',
  },
  {
    title: '3/4 · Remediation',
    proposal: 'Propose checking export ownership before returning data.\nAdd regression checks for the owner, another account, and an anonymous request.',
    details: 'Prepare the fix privately. Run regression tests and verify supported versions before accepting it. This demo does not execute tests or claim that the fix is verified.',
    approved: 'Remediation plan approved in this simulation. No code changed. Continue with disclosure planning.',
  },
  {
    title: '4/4 · Coordinated disclosure',
    proposal: 'Prepare an advisory draft with impact, affected versions, and the fix.\nLeave unverified fields pending. Coordinate the release, reporter notification, and any CVE steps with the security team.',
    details: 'Publication remains a separate maintainer decision after the fix and affected versions are verified. Approving here only records review of a fictional disclosure plan.',
    approved: 'Disclosure plan approved in this simulation. No advisory published, reporter contacted, or CVE requested. Security walkthrough complete.',
  },
];

function CodexStartup() {
  return <div className="t-codex-startup">
    <strong><span>&gt;_</span> OpenAI Codex <small>(demo)</small></strong>
    <div><span>model:</span> gpt-5 <small>/model to change</small></div>
    <div><span>directory:</span> ~/example-project</div>
  </div>;
}

export function TerminalPreview({ paused }: { paused: boolean }) {
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState('');
  const [visible, setVisible] = useState(false);
  const container = useRef<HTMLElement>(null);
  const sequence = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {threshold: 0.2});
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const progress = {characters: 0};
      const prompt = previewLines[0].text;
      const tl = gsap.timeline({paused: true, repeat: -1, repeatDelay: 4});
      sequence.current = tl;
      tl.call(() => {setLine(0);setTyped('');})
        .fromTo('.t-codex-startup', {opacity: 0,y: 10}, {opacity: 1,y: 0,duration: 0.5})
        .to(progress, {characters: prompt.length, duration: 1.8, ease: 'none', onUpdate: () => setTyped(prompt.slice(0,Math.floor(progress.characters)))}, '+=0.3');
      previewLines.slice(1).forEach((_, index) => tl.call(() => setLine(index + 2), [], '+=0.65'));
      return () => { tl.kill(); sequence.current = null; };
    }, container);
    media.add('(prefers-reduced-motion: reduce)', () => {setTyped(previewLines[0].text); setLine(previewLines.length);});
    return () => media.revert();
  }, []);
  useEffect(() => {sequence.current?.paused(paused || !visible);}, [paused,visible]);
  return <section className="k-section t-preview" id="demo" ref={container}>
    <div className="t-preview-grid">
      <a className="t-window t-preview-link" href={withBase('/demo?scenario=security')} aria-label="Try the security report walkthrough">
        <div className="t-bar"><span className="t-dots" aria-hidden="true">● ● ●</span><span>codex / example-project</span><span>SIMULATION</span></div>
        <div className="t-preview-output" aria-hidden="true"><CodexStartup /><div className="t-prompt">{typed}<span className="t-cursor">▍</span></div>{previewLines.slice(1).map((entry,index) => <div key={entry.text} className={`t-${entry.kind}`} style={{visibility:index + 2 <= line ? 'visible' : 'hidden'}}>{entry.text}</div>)}</div>
      </a>
      <div className="t-preview-heading"><h2>Your work.<br /><span>A little assistance.</span></h2><p>Walk through a security report, from private intake to a disclosure plan. Review each step at your own pace.</p><a className="k-button" href={withBase('/demo?scenario=security')}>Try the security demo <ArrowUpRight size={18} /></a></div>
    </div>
  </section>;
}

type Scenario = 'prs' | 'issues' | 'security';
type Entry = { kind: string; text: string };
const intro: Entry = { kind: 'muted', text: 'Magpie interactive demo\nFictional repository · simulated actions · no account required\nChoose a task below or type help. No shell commands are executed.' };
const reports = {
  prs: '#142  Fix empty search results       → needs-review\n      Adds an empty-state guard. Regression test included.\n#145  Add export documentation      → ready-for-review\n      Documentation only. No runtime changes.\n#148  Upgrade runtime dependency    → needs-testing\n      Compatibility evidence is missing. Ask the author for tests.',
  issues: '#81   Export fails with an empty list → needs-reproduction\n      Missing version and reproduction steps.\n#84   Empty export crashes            → possible-duplicate\n      Similar symptom to #81; maintainer confirmation needed.\n#89   Improve keyboard focus          → enhancement\n      Clear accessibility request with a focused scope.',
};
const patch = 'Illustrative diff for PR #142\n\n--- a/search.ts\n+++ b/search.ts\n@@\n- return results[0].title;\n+ return results.length ? results[0].title : "No results";\n\n--- a/search.test.ts\n+++ b/search.test.ts\n@@\n+ expect(firstTitle([])).toBe("No results");\n\nReview note: confirm the empty-state text matches the product conventions.\nNo tests were executed in this simulation.';

export default function TerminalDemo() {
  const [entries, setEntries] = useState<Entry[]>([intro]);
  const [scenario, setScenario] = useState<Scenario>('prs');
  const [securityStep, setSecurityStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const output = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; }, [entries]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('scenario') === 'security') run('security');
  }, []);
  function append(kind: string, text: string) { setEntries(previous => [...previous, {kind, text}]); }
  function run(value: string) {
    const request = value.trim();
    if (!request || busy) return;
    setInput('');
    append('prompt', `> ${request}`);
    const command = request.toLowerCase();
    if (['help','ajuda','?'].includes(command)) {
      append('muted', 'Try: security · next · triage PRs · triage issues · details · diff · approve · reject · restart\nYou can also ask: “Review the open pull requests”.\nThis guided demo supports these tasks; it is not connected to an LLM.'); return;
    }
    if (['restart','reset','clear','reiniciar'].includes(command)) { reset(); return; }
    if (/security|vulnerability|private report/.test(command)) {
      setScenario('security'); setSecurityStep(0); setPending(true);
      append('result', `${securityStages[0].title}\n${securityStages[0].proposal}`);
      append('gate', 'Review this proposal: details · approve · reject. Approval here only advances the simulation.');
      return;
    }
    if (command === 'next') {
      if (scenario !== 'security') { append('muted', 'Start the security walkthrough to follow its steps.'); return; }
      if (pending) { append('gate', 'Review and approve this proposal before continuing. Reject keeps it as a draft on this step.'); return; }
      if (securityStep === securityStages.length - 1) { append('muted', 'Walkthrough complete. Type security to start again, or choose another task.'); return; }
      const next = securityStep + 1;
      setSecurityStep(next); setPending(true);
      append('result', `${securityStages[next].title}\n${securityStages[next].proposal}`);
      append('gate', 'Review this proposal: details · approve · reject.');
      return;
    }
    if (['y','yes','approve','aprovar'].includes(command)) {
      if (!pending) { append('muted','There is no proposal waiting for approval. Start a triage first.'); return; }
      if (scenario === 'security') {
        append('result', securityStages[securityStep].approved); setPending(false); return;
      }
      append('result', scenario === 'prs' ? 'Simulated approval recorded.\n#142 → needs-review\n#145 → ready-for-review\n#148 → needs-testing\n\nAudit: 3 proposed labels approved by you. No merge or external write occurred.' : 'Simulated approval recorded.\n#81 → needs-reproduction\n#84 → possible-duplicate (left open)\n#89 → enhancement\n\nAudit: labels approved by you. No issues were closed or changed externally.');
      setPending(false); return;
    }
    if (['n','no','reject','recusar'].includes(command)) {
      if (!pending) { append('muted','There is no pending proposal. Start a triage first.'); return; }
      if (scenario === 'security') {
        append('muted', 'Proposal kept as a draft. The walkthrough stays on this step. Inspect details, approve when ready, or restart.'); return;
      }
      append('muted','Proposal kept as a draft. No labels applied.\nYou can inspect details, view the diff, or start another task.'); setPending(false); return;
    }
    if (/^(diff|patch|show diff|ver diff)$/.test(command)) {
      if (scenario === 'security') {
        append('result', 'No code patch is included in this walkthrough. At remediation, Magpie proposes an ownership check and regression tests for private review.'); return;
      }
      append('result', scenario === 'prs' ? patch : 'Issue triage has not produced a patch. Reproduce #81 first.\nSwitch to PR triage to inspect the sample diff for #142.'); return;
    }
    if (/^(details|detail|why|explain|detalhes)$/.test(command)) {
      if (scenario === 'security') { append('result', securityStages[securityStep].details); return; }
      append('result', scenario === 'prs' ? 'Why #148 needs testing:\nThe runtime version changed, but the PR includes no compatibility tests.\nSuggested next step: ask the author to run the supported runtime matrix.\n\nDraft comment: “Could you include the compatibility results for the supported runtimes?”\nThis comment has not been posted.' : 'Why #84 is only a possible duplicate:\nBoth reports mention empty exports, but neither supplies a full reproduction.\nAsk for the version, sample input, and expected result before closing either issue.'); return;
    }
    if (/triage|review|pull request|\bprs?\b|issues|backlog|revis|fila/.test(command)) {
      const next: Scenario = /issue|backlog/.test(command) ? 'issues' : 'prs';
      setScenario(next); setPending(false); setBusy(true);
      append('muted', `Reading the fictional project context and 3 ${next === 'prs' ? 'pull requests' : 'issues'}…`);
      timer.current = setTimeout(() => { append('result', reports[next]); append('gate','Apply these proposed labels? Type approve or reject.\nUse details to inspect the reasoning before deciding.'); setPending(true); setBusy(false); timer.current = null; }, 850);
      return;
    }
    append('muted','That request is outside this guided demo. Try “security”, “triage PRs”, “triage issues”, or “help”. No command was executed.');
  }
  function reset() { if (timer.current) clearTimeout(timer.current); timer.current = null; setEntries([intro]); setPending(false); setBusy(false); setInput(''); setScenario('prs'); setSecurityStep(0); field.current?.focus(); }
  return <div className="t-demo-page">
    <header className="t-demo-header"><a href={withBase('/')} aria-label="Back to Magpie homepage"><img src={withBase('/subframe-mark.svg')} width="32" height="32" alt="" />Magpie</a><span>INTERACTIVE DEMO</span><a href={withBase('/docs/quick-start')}>Get started <ArrowUpRight size={16} /></a></header>
    <main className="t-demo-main"><div className="t-demo-intro"><div><span>YOUR AGENT. YOUR CALL.</span><h1>Give it a task.<br />Keep the final say.</h1></div><p>Explore a simulated maintainer session. Read the findings, inspect a diff, and choose what happens next.</p></div>
      <div className="t-window t-interactive"><div className="t-bar"><span>magpie / example-project</span><span>SIMULATION</span><button onClick={reset} aria-label="Restart demo"><RotateCcw size={16} />Restart</button></div>
        <div className="t-transcript" ref={output} role="log" aria-label="Demo terminal output" aria-live="polite" aria-relevant="additions" tabIndex={0}><CodexStartup />{entries.map((entry,index) => <pre key={index} className={`t-${entry.kind}`}>{entry.text}</pre>)}</div>
        <div className="t-suggestions" aria-label="Suggested demo commands">{(scenario === 'security' && pending ? ['details','approve','reject'] : pending ? ['details','diff','approve','reject'] : scenario === 'security' && securityStep < securityStages.length - 1 ? ['next','details','triage PRs','triage issues'] : ['security','triage PRs','triage issues','help']).map(command => <button key={command} disabled={busy} onClick={() => run(command)}>{command}</button>)}</div>
        <form className="t-prompt-form" onSubmit={event => {event.preventDefault(); run(input);}}><label htmlFor="terminal-input">›</label><input ref={field} id="terminal-input" aria-label="Command or request" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); run(event.currentTarget.value); } }} placeholder={busy ? 'Preparing a proposal…' : 'Ask Magpie, or type help'} autoComplete="off" spellCheck={false} disabled={busy} maxLength={500} /><button disabled={busy || !input.trim()} type="submit">Run ↵</button></form>
      </div><p className="t-demo-disclaimer">Fictional data and simulated actions. Nothing connects to your terminal, repository, or agent account.</p>
    </main>
  </div>;
}
