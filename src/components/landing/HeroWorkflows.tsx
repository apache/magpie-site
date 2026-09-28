import { useEffect, useRef, useState } from "react";
import MagpieCard from "./MagpieCard";
import WorkflowCard from "./WorkflowCard";
import WorkflowIllustration, { type WorkflowScene } from "./WorkflowIllustration";
import { useWorkflowKeyboard } from "./useWorkflowSequence";
import SequenceNavigation from "./SequenceNavigation";

const examples = [
  { scene: "security" as WorkflowScene, question: "triaging security reports?", input: "A security report arrives", frustration: "There goes the work I had planned!", work: ["Investigates the report", "Writes and tests the fix", "Coordinates release & CVE"], outcome: "A released fix and a published CVE", relief: "I can stop chasing this report." },
  { scene: "review" as WorkflowScene, question: "checking every pull request?", input: "A pull request needs review", frustration: "The review queue never ends!", work: ["Reads the code changes", "Checks tests and conventions", "Drafts comments with evidence"], outcome: "A review ready to approve", relief: "I can get straight to the decisions." },
  { scene: "bug" as WorkflowScene, question: "reproducing every bug?", input: "A bug needs fixing", frustration: "Why won’t it fail on my machine?", work: ["Reproduces the failure", "Writes the fix", "Adds a regression test"], outcome: "A tested fix ready to merge", relief: "Now I have a fix I can actually test!" },
  { scene: "release" as WorkflowScene, question: "checking release candidates?", input: "A release needs checking", frustration: "Did I miss a step?", work: ["Verifies the build and signatures", "Prepares the release vote", "Drafts the announcement"], outcome: "A release ready to publish", relief: "I can see what’s left before we ship." },
  { scene: "contributor" as WorkflowScene, question: "finding first tasks for newcomers?", input: "Someone wants to contribute", frustration: "How do I make my first contribution?", work: ["Finds a suitable issue", "Explains the code to change", "Shows how to test the change"], outcome: "A clear first task to work on", relief: "I know how to make my first contribution!" },
  { scene: "dependencies" as WorkflowScene, question: "auditing your dependencies?", input: "Your dependencies need updating", frustration: "Which of these alerts actually matters?", work: ["Finds vulnerable packages", "Flags abandoned dependencies", "Prioritises the fixes"], outcome: "An actionable upgrade plan", relief: "I finally know what to update first!" },
  { scene: "pairing" as WorkflowScene, question: "checking your own diffs?", input: "Your code needs a second look", frustration: "What am I missing in this diff?", work: ["Reviews the local diff", "Finds bugs and missing tests", "Suggests specific fixes"], outcome: "Problems caught before a PR", relief: "It helps to have a fresh pair of eyes." },
  { scene: "onboarding" as WorkflowScene, question: "chasing onboarding paperwork?", input: "A new committer joins", frustration: "Who’s still waiting on what?", work: ["Checks required paperwork", "Tracks access setup", "Prepares the welcome"], outcome: "Onboarding covered, step by step", relief: "I can spend more time welcoming them!" },
  { scene: "sandbox" as WorkflowScene, question: "setting up agent sandboxes?", input: "Your agent needs a sandbox", frustration: "What else can this agent touch?", work: ["Configures the sandbox", "Limits file and tool access", "Verifies the protections"], outcome: "An isolated workspace to code in", relief: "I decide what my agent can access." },
];

export default function HeroWorkflows() {
  const [selected, setSelected] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [userStopped, setUserStopped] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setMotionAllowed(!media.matches);
    const change = () => setMotionAllowed(!media.matches);
    media.addEventListener("change", change);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .3 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); media.removeEventListener("change", change); };
  }, []);
  useEffect(() => {
    const boundary = root.current;
    if (!boundary) return;
    const hover = () => setHovered(boundary.matches(":hover"));
    const focus = (event?: Event) => {
      const target = event?.type === "focusout" ? (event as FocusEvent).relatedTarget : document.activeElement;
      setFocused(target instanceof Element && boundary.contains(target) && target.matches(":focus-visible"));
    };
    boundary.addEventListener("mouseenter", hover);
    boundary.addEventListener("mouseleave", hover);
    boundary.addEventListener("focusin", focus);
    boundary.addEventListener("focusout", focus);
    hover(); focus();
    return () => {
      boundary.removeEventListener("mouseenter", hover);
      boundary.removeEventListener("mouseleave", hover);
      boundary.removeEventListener("focusin", focus);
      boundary.removeEventListener("focusout", focus);
    };
  }, []);
  const select = (index: number) => { setSelected(index); setUserStopped(true); };
  useWorkflowKeyboard(root, selected, examples.length, select, ".reel-dot");
  const advancing = motionAllowed && !userStopped && visible && !hovered && !focused;
  useEffect(() => {
    if (!advancing) return;
    const timer = setInterval(() => {
      const boundary = root.current;
      if (!document.hidden && boundary && !boundary.matches(":hover") && !boundary.querySelector(":focus-visible")) {
        setSelected(i => (i + 1) % examples.length);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [advancing]);
  return <>
  <div className="hero-copy">
    <h1 id="hero-title">Still manually<br /><span id="hero-question">{examples.map((item, i) => <span key={item.scene} aria-hidden={selected !== i}>{item.question}</span>)}</span></h1>
  </div>
  <div ref={root} className="workflow-reel" role="region" aria-roledescription="carousel" aria-label="Nine ways maintainers use Magpie" tabIndex={0}>
    <SequenceNavigation previousLabel="Previous use case" nextLabel="Next use case" onPrevious={() => select((selected - 1 + examples.length) % examples.length)} onNext={() => select((selected + 1) % examples.length)} content={
    <div className="reel-window" aria-live={advancing ? "off" : "polite"}>
      <div className="reel-track" style={{ transform: `translateX(-${selected * 100}%)` }}>
        {examples.map((item, i) => <div className="reel-slide" key={item.scene} aria-hidden={i !== selected} inert={i !== selected} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${examples.length}: ${item.input}`}>
          <ol className="reel-flow">
            <WorkflowCard as="li" className="reel-source" headingLevel="h2" title={item.input} tone="manual" emphasis={item.frustration} connector><WorkflowIllustration scene={item.scene} /></WorkflowCard>
            <MagpieCard as="li" headingLevel="h2" className="reel-process" work={item.work} connector />
            <WorkflowCard as="li" className="reel-delivery" headingLevel="h2" title={item.outcome} tone="result" emphasis={item.relief}><WorkflowIllustration scene={item.scene} result /></WorkflowCard>
          </ol>
        </div>)}
      </div>
    </div>
    }>
    <div className="example-navigation" aria-label="Choose a use case">
      {examples.map((item, i) => <button className="reel-dot" key={item.scene} type="button" aria-label={`${i + 1}: ${item.input}`} aria-pressed={selected === i} title={item.input} onClick={() => select(i)}><span /></button>)}
    </div>
    </SequenceNavigation>
  </div></>;
}
