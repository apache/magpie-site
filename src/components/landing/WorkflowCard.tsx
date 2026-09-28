import type { ReactNode } from "react";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
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

export function CardHeading({ title, icon, level: Heading = "h3" }: {
  title: ReactNode; icon?: ReactNode; level?: HeadingLevel;
}) {
  return <Heading className="workflow-card-heading">
    {icon && <span className="card-badge" aria-hidden="true">{icon}</span>}
    <span className="workflow-card-title">{title}</span>
  </Heading>;
}

export function Checklist({ items, icon: Icon = Check }: { items: string[]; icon?: LucideIcon }) {
  return <ul className="workflow-checklist">{items.map(item => <li key={item}><Icon size={22} aria-hidden="true" /><span>{item}</span></li>)}</ul>;
}

export default function WorkflowCard({ title, icon, tone = "neutral", children, work, emphasis, connector, checklistIcon,
  className = "", as: Element = "div", headingLevel = "h3" }: WorkflowCardProps) {
  return <Element className={`surface-card workflow-card ${className}`} data-card-tone={tone}>
    <CardHeading title={title} icon={icon} level={headingLevel} />
    <div className="workflow-card-body">
      {work && <Checklist items={work} icon={checklistIcon} />}
      {children}
    </div>
    {emphasis && <p className="workflow-card-emphasis"><strong><q>{emphasis}</q></strong></p>}
    {connector && <ArrowRight className="flow-arrow" aria-hidden="true" />}
  </Element>;
}
