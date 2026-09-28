import type { ReactNode } from "react";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import CenteredLabel from "./CenteredLabel";
import "./workflow-card.css";

type HeadingLevel = "h2" | "h3" | "h4" | "h5";
export type WorkflowCardProps = {
  title: ReactNode;
  icon?: ReactNode;
  tone?: "manual" | "prepared" | "result" | "neutral";
  children?: ReactNode;
  work?: string[];
  emphasis?: string;
  connector?: boolean;
  checklistIcon?: LucideIcon;
  className?: string;
  as?: "div" | "li";
  headingLevel?: HeadingLevel;
};

function CardHeading({ title, level: Heading = "h3" }: {
  title: ReactNode; level?: HeadingLevel;
}) {
  return <Heading className="workflow-card-heading">
    <CenteredLabel>{title}</CenteredLabel>
  </Heading>;
}

export function Checklist({ items, icon: Icon = Check }: { items: string[]; icon?: LucideIcon }) {
  return <ul className="workflow-checklist">{items.map(item => <li key={item}><Icon size={22} aria-hidden="true" /><span>{item}</span></li>)}</ul>;
}

export default function WorkflowCard({ title, icon, tone = "neutral", children, work, emphasis, connector, checklistIcon,
  className = "", as: Element = "div", headingLevel = "h3" }: WorkflowCardProps) {
  return <Element className={`surface-card workflow-card ${className}`} data-card-tone={tone}>
    {icon && <span className="card-badge" aria-hidden="true">{icon}</span>}
    <CardHeading title={title} level={headingLevel} />
    <div className="workflow-card-body">
      {work && <Checklist items={work} icon={checklistIcon} />}
      {children}
    </div>
    {emphasis && <p className="workflow-card-emphasis"><strong><q>{emphasis}</q></strong></p>}
    {connector && <ArrowRight className="flow-arrow" aria-hidden="true" />}
  </Element>;
}
