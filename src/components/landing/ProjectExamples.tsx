import SectionHeading from "./SectionHeading";
import { useRef, type RefObject } from "react";
import MagpieCard from "./MagpieCard";
import WorkflowCard from "./WorkflowCard";
import WorkflowStages from "./WorkflowStages";
import SequenceNavigation from "./SequenceNavigation";
import SequenceSlides from "./SequenceSlides";
import PuzzleFlow from "./PuzzleFlow";
import { useWorkflowSequence } from "./useWorkflowSequence";
import { ArrowRight, Boxes, Bug, ClipboardCheck, Compass, FileCheck2, GitPullRequest, Inbox, MessageSquareText, Package, PackageCheck, SlidersHorizontal, UserRound, Wrench } from "lucide-react";

const lifecycle = [
  { label: "Triage", inputIcon: Inbox, outputIcon: ClipboardCheck, input: "New reports keep arriving", frustration: "I can’t get ahead of this queue!", inputs: ["A user reports a failure.", "Another report looks familiar.", "Some details are missing."], work: ["Checks for duplicates", "Reproduces and classifies reports", "Drafts the next response"], outcome: "You know what to investigate", relief: "I know where to start!", outputs: ["The issue has steps to reproduce it.", "Missing information is requested in a draft.", "Related reports are linked."], link: "/docs/issue-management/readme" },
  { label: "Develop", inputIcon: Bug, outputIcon: FileCheck2, input: "A bug needs a fix", frustration: "Please don’t let this break again!", inputs: ["A user found a failing case.", "You need to prevent it happening again."], work: ["Reproduces the failure", "Writes a patch and regression test", "Runs checks and reviews the diff"], outcome: "You can review the proposed fix", relief: "I can see why this fix should work.", outputs: ["The patch addresses the failure.", "A test covers the regression.", "Check results accompany the change."], link: "/docs/issue-management/readme" },
  { label: "Review", inputIcon: GitPullRequest, outputIcon: MessageSquareText, input: "Contributors keep sending changes", frustration: "How will I ever catch up on reviews?", inputs: ["Someone fixes a bug.", "Another contributor adds a feature.", "More pull requests need a review."], work: ["Triages the review queue", "Checks CI and reviews the code", "Drafts feedback for each PR"], outcome: "You know where you’re needed", relief: "I know which changes need my attention.", outputs: ["Review findings are ready to approve.", "Requested changes are explained.", "Failing checks are flagged."], link: "/docs/pr-management/readme" },
  { label: "Release", inputIcon: Package, outputIcon: PackageCheck, input: "A release is coming", frustration: "How am I supposed to remember all this?", inputs: ["A candidate needs verification.", "The vote and announcement need preparing."], work: ["Verifies the release candidate", "Prepares the vote and tally", "Drafts the announcement"], outcome: "You can make the release decision", relief: "I can see what’s ready!", outputs: ["Verification results are collected.", "The vote is prepared for review.", "The announcement is ready to approve."], link: "/docs/release-management/readme" },
  { label: "Maintain", inputIcon: Boxes, outputIcon: Wrench, input: "The repository keeps changing", frustration: "Wasn’t this green yesterday?", inputs: ["Dependencies need updating.", "A workflow starts failing.", "Tests become unreliable."], work: ["Audits dependencies and licences", "Investigates failing workflows", "Recommends maintenance work"], outcome: "You can prioritise the next fix", relief: "I know what to tackle next!", outputs: ["Dependency risks are explained.", "Workflow problems have findings.", "Suggested fixes are ready to assess."], link: "/docs/repo-health/readme" },
  { label: "Grow", inputIcon: UserRound, outputIcon: Compass, input: "Someone wants to contribute", frustration: "Getting started shouldn’t be this hard!", inputs: ["They need a suitable first issue.", "They want to understand the code."], work: ["Finds a suitable first issue", "Explains the relevant code", "Shows how to test the change"], outcome: "They know how to get started", relief: "The first step feels doable.", outputs: ["The first task matches their experience.", "The relevant code is explained.", "Test instructions accompany the task."], link: "/docs/mentoring/readme" },
];

function LifecycleExample({index, active, introduced}: {index:number; active:boolean; introduced:RefObject<boolean>}) {
  const phase = lifecycle[index];
  return <div className="lifecycle-detail">
      <PuzzleFlow className="lifecycle-flow" active={active} introduced={introduced}>
        <WorkflowCard className="lifecycle-incoming" title={phase.input} icon={<phase.inputIcon />} tone="manual" emphasis={phase.frustration}><p>{phase.inputs.join(" ")}</p></WorkflowCard>
        <MagpieCard className="lifecycle-work" work={phase.work} emphasis="I’ve got a workflow for this." />
        <WorkflowCard className="lifecycle-ready" title={phase.outcome} icon={<phase.outputIcon />} tone="result" work={phase.outputs} emphasis={phase.relief} />
      </PuzzleFlow>
    </div>;
}

export function SoftwareLifecycle() {
  const puzzleIntroduced = useRef(false);
  const {active, scrollDriven, scrollLayout, sceneRef, panelRef, contentRef, select} = useWorkflowSequence(lifecycle.length, "lifecycle-tab-");
  return <div className="workflow-sequence software-lifecycle" ref={sceneRef} data-scroll-driven={scrollDriven} data-scroll-layout={scrollLayout}>
    <div className="software-workbench" ref={panelRef}>
      <div className="lifecycle-heading"><SectionHeading id="choose-work-title" target="how-it-works" level="h2">Skills for the work you do every day</SectionHeading><p>Magpie has dozens of skills for fixing bugs, reviewing code, preparing releases, and more. Pick the ones your project needs.</p></div>
      <div className="workflow-sequence-content" ref={contentRef}>
        <WorkflowStages phases={lifecycle} active={active} label="Software lifecycle phases" tabPrefix="lifecycle-tab-" panelPrefix="lifecycle-detail-" select={select} />
        <SequenceNavigation previousLabel="Previous skill family" nextLabel={active < lifecycle.length - 1 ? `Next skill family: ${lifecycle[active + 1].label}` : "Next skill family"} onPrevious={() => select(active - 1)} onNext={() => select(active + 1)} previousDisabled={active === 0} nextDisabled={active === lifecycle.length - 1} content={
        <SequenceSlides className="software-scenes" active={active}>{lifecycle.map((phase,index) => <section className="lifecycle-scene" key={phase.label} id={`lifecycle-detail-${index}`} role="tabpanel" aria-labelledby={`lifecycle-tab-${index}`} aria-hidden={active !== index} inert={active !== index} tabIndex={0}>
          <LifecycleExample index={index} active={active === index} introduced={puzzleIntroduced} />
        </section>)}</SequenceSlides>
        }>
          <a className="button button-soft" href={lifecycle[active].link} target="_blank" rel="noreferrer"><span>Explore {lifecycle[active].label.toLowerCase()} workflows</span><ArrowRight className="cta-arrow" aria-hidden="true" /></a>
        </SequenceNavigation>
      </div>
    </div>
  </div>;
}

export function ProjectRules() {
  return <><PuzzleFlow className="card-flow">
    <MagpieCard work={["Checks the changes and CI results", "Reviews the code for problems", "Drafts actionable feedback"]} emphasis="I don’t have to start from scratch!" />
    <WorkflowCard title="Your team’s rules" icon={<SlidersHorizontal />} emphasis="I don’t have to repeat myself.">
      <blockquote className="example-quote">Use our review checklist. Ask the owning team for a review. Include a changelog entry.</blockquote>
    </WorkflowCard>
  </PuzzleFlow>
  <div className="section-followup"><a className="button button-soft" href="/docs/setup/agentic-overrides" target="_blank" rel="noreferrer"><span>See how project rules work</span><ArrowRight className="cta-arrow" aria-hidden="true" /></a></div></>;
}
