import { ChevronDown, ArrowRight } from "lucide-react";
import { Checklist } from "./WorkflowCard";
import { MagpieToolkit } from "./MagpieCard";

type Item = {
  label: string;
  prompt: string;
  context?: string;
  work: string[];
  outcome?: string;
  outputs?: string[];
  before?: string[];
  href?: string;
};

// On a narrow screen, choose the work first and read one explanation in place.
// Native disclosures keep vertical scrolling and keyboard navigation ordinary.
export default function MobileWorkflows({ items, name }: { items: Item[]; name: string }) {
  return <div className="mobile-workflows">
    {items.map(item => <details className="mobile-workflow" name={name} key={item.label}>
      <summary><span><strong>{item.label}</strong><span>{item.prompt}</span></span><ChevronDown aria-hidden="true" /></summary>
      <div className="mobile-workflow-body">
        {item.context && <p className="mobile-workflow-context">{item.context}</p>}
        <div className="mobile-workflow-brand"><MagpieToolkit /><strong>Magpie</strong></div>
        <Checklist items={item.work} />
        {item.outcome && <div className="mobile-workflow-result"><p><strong>{item.outcome}</strong></p>{item.outputs && <Checklist items={item.outputs} />}</div>}
        {item.before && <details className="mobile-workflow-before"><summary>Compare with doing it manually</summary><Checklist items={item.before} /></details>}
        {item.href && <a className="text-link" href={item.href} target="_blank" rel="noreferrer">Explore {item.label.toLowerCase()} workflows<ArrowRight className="cta-arrow" aria-hidden="true" /></a>}
      </div>
    </details>)}
  </div>;
}
