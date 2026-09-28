import { useWorkflowSequence } from "./useWorkflowSequence";
import { Minus } from "lucide-react";
import { securityStory } from "./security-story";
import MagpieCard, { ManualCard } from "./MagpieCard";
import WorkflowStages from "./WorkflowStages";
import SequenceNavigation from "./SequenceNavigation";

export default function WorkflowExplorer() {
  const {active:stage, scrollDriven, sceneRef, panelRef, select} = useWorkflowSequence(securityStory.length, "security-tab-");
  return <div className="workflow-sequence security-walkthrough" ref={sceneRef} data-scroll-driven={scrollDriven} role="region" aria-labelledby="security-example-title">
    <div className="security-workbench" ref={panelRef}>
      <div className="lifecycle-heading"><h3 id="security-example-title">Why did Magpie help so much?</h3><p>Magpie’s skills cover the whole process, from checking a security report to fixing the problem, releasing the fix, and closing the report.</p></div>
      <WorkflowStages phases={securityStory} active={stage} label="Security lifecycle phases" tabPrefix="security-tab-" panelPrefix="security-stage-" select={select} />
      <div className="security-prompts">{securityStory.map((phase, i) => <h4 key={phase.label} id={`security-prompt-${i}`} aria-hidden={stage !== i}>{phase.prompt}</h4>)}</div>
      <SequenceNavigation previousLabel="Previous security stage" nextLabel={stage < securityStory.length - 1 ? `Next security stage: ${securityStory[stage + 1].label}` : "Next security stage"} onPrevious={() => select(stage - 1)} onNext={() => select(stage + 1)} previousDisabled={stage === 0} nextDisabled={stage === securityStory.length - 1} content={
      <div className="security-scenes">{securityStory.map((phase, i) => <section className="security-scene" id={`security-stage-${i}`} key={phase.label} role="tabpanel" aria-labelledby={`security-tab-${i} security-prompt-${i}`} aria-hidden={stage !== i} inert={stage !== i} tabIndex={0}>
        <div className="story-comparison">
          <ManualCard className="story-manual" headingLevel="h5" work={phase.without} checklistIcon={Minus} emphasis={phase.frustration} />
          <MagpieCard className="story-assisted" headingLevel="h5" work={phase.work} emphasis={phase.relief} />
        </div>
      </section>)}</div>
      } />
    </div>
  </div>;
}
