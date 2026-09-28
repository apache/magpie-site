import { Check } from "lucide-react";

type Props = {
  phases: { label: string }[];
  active: number;
  label: string;
  tabPrefix: string;
  panelPrefix: string;
  select: (index: number) => void;
};

export default function WorkflowStages({ phases, active, label, tabPrefix, panelPrefix, select }: Props) {
  return <div className="workflow-stages" role="tablist" aria-label={label}>
    {phases.map((phase, index) => <button key={phase.label} type="button" role="tab"
      id={`${tabPrefix}${index}`} aria-label={phase.label} aria-selected={active === index}
      aria-controls={`${panelPrefix}${index}`} tabIndex={active === index ? 0 : -1}
      data-complete={index < active} onClick={() => select(index)}>
      <span className="workflow-stage-point" aria-hidden="true">{index < active ? <Check size={16} /> : index + 1}</span>
      <span>{phase.label}</span>
    </button>)}
  </div>;
}
