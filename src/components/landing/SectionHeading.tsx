import type { ReactNode } from "react";
import { Link } from "lucide-react";

/** Native navigation remains available; home navigation also copies the URL. */
export default function SectionHeading({ id, target, level: Heading = "h2", className = "", children }: {
  id: string; target: string; level?: "h2" | "h3"; className?: string; children: ReactNode;
}) {
  return <Heading id={id} className={`section-heading ${className}`}><a href={`#${target}`} title="Copy link to this section"><span>{children}</span><Link size={18} aria-hidden="true" /></a></Heading>;
}
