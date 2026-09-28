import WorkflowCard, { type WorkflowCardProps } from "./WorkflowCard";
import { withBase } from "@/ui/lib/utils";
import { NotebookPen } from "lucide-react";

export function MagpieToolkit() { return <svg className="magpie-toolkit" viewBox="0 0 64 56" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M23 13V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4" />
      <rect x="5" y="13" width="54" height="38" rx="8" />
      <path d="M6 27h52" strokeOpacity=".3" />
      <use href={withBase("/brand/magpie-symbol.svg#magpie")} x="20" y="19" width="24" height="24" fill="currentColor" stroke="none" />
    </svg>; }

type BrandedCardProps = Omit<WorkflowCardProps, "title" | "icon" | "tone"> & { title?: string };

export function ManualCard(props: BrandedCardProps) {
  const { title = "Good old days", ...rest } = props;
  return <WorkflowCard {...rest} title={title} icon={<NotebookPen aria-hidden="true" />} tone="manual" />;
}

export default function MagpieCard({ title = "Magpie", className = "", tone = "prepared", ...props }: BrandedCardProps & { tone?: "prepared" | "result" }) {
  return <WorkflowCard {...props} className={`magpie-card ${className}`} title={title} icon={<MagpieToolkit />} tone={tone} />;
}
