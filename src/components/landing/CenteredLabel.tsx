import type { ReactNode } from "react";
import "./centered-label.css";

/** Keep the text on the center axis, with an adjacent, balanced icon slot. */
export default function CenteredLabel({ children, icon, stacked = false }: {
  children: ReactNode; icon?: ReactNode; stacked?: boolean;
}) {
  return <span className="centered-label" data-icon={Boolean(icon)} data-stacked={stacked}>
    {icon && <span className="centered-label-icon" aria-hidden="true">{icon}</span>}
    <span className="centered-label-text">{children}</span>
  </span>;
}
