import SectionHeading from "./SectionHeading";
import { useWorkflowSequence } from "./useWorkflowSequence";
import { Minus } from "lucide-react";
import { securityStory } from "./security-story";
import MagpieCard, { ManualCard } from "./MagpieCard";
import WorkflowStages from "./WorkflowStages";
import SequenceNavigation from "./SequenceNavigation";
import SequenceSlides from "./SequenceSlides";
import MobileWorkflows from "./MobileWorkflows";

export default function WorkflowExplorer() {
  const {active:stage, scrollDriven, scrollLayout, sceneRef, panelRef, contentRef, select} = useWorkflowSequence(securityStory.length, "security-tab-");
  return <div className="workflow-sequence security-walkthrough" ref={sceneRef} data-scroll-driven={scrollDriven} data-scroll-layout={scrollLayout} role="region" aria-labelledby="security-example-title">
    <div className="security-workbench" ref={panelRef}>
      <div className="lifecycle-heading"><SectionHeading id="security-example-title" target="security-example-title" level="h3">What does Magpie do here?</SectionHeading><p>Magpie’s skills cover the whole process, from checking a security report to fixing the problem, releasing the fix, and closing the report.</p></div>
      <div className="workflow-sequence-content" ref={contentRef}>
        <WorkflowStages phases={securityStory} active={stage} label="Security lifecycle phases" tabPrefix="security-tab-" panelPrefix="security-stage-" select={select} />
        <div className="security-prompts">{securityStory.map((phase, i) => <h4 key={phase.label} id={`security-prompt-${i}`} aria-hidden={stage !== i}>{phase.prompt}</h4>)}</div>
        <SequenceNavigation previousLabel="Previous security stage" nextLabel={stage < securityStory.length - 1 ? `Next security stage: ${securityStory[stage + 1].label}` : "Next security stage"} onPrevious={() => select(stage - 1)} onNext={() => select(stage + 1)} previousDisabled={stage === 0} nextDisabled={stage === securityStory.length - 1} content={
        <SequenceSlides className="security-scenes" active={stage}>{securityStory.map((phase, i) => <section className="security-scene" id={`security-stage-${i}`} key={phase.label} role="tabpanel" aria-labelledby={`security-tab-${i} security-prompt-${i}`} aria-hidden={stage !== i} inert={stage !== i} tabIndex={0}>
          <div className="story-comparison">
            <ManualCard className="story-manual" headingLevel="h5" work={phase.without} checklistIcon={Minus} emphasis={phase.frustration} />
            <MagpieCard className="story-assisted" headingLevel="h5" work={phase.work} emphasis={phase.relief} />
          </div>
        </section>)}</SequenceSlides>
        } />
      </div>
      <MobileWorkflows name="security-mobile" items={securityStory.map(phase => ({label:phase.label, prompt:phase.prompt, work:phase.work, before:phase.without}))} />
    </div>
  </div>;
}
