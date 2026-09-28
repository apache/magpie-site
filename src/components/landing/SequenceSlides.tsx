import type { ReactNode } from "react";

/** Keep the content envelope stable while moving whole panels in reading order. */
export default function SequenceSlides({ active, className, live, children }: {
  active: number; className: string; live?: "off" | "polite"; children: ReactNode;
}) {
  return <div className={`sequence-window ${className}`} aria-live={live}>
    <div className="sequence-track" style={{ transform: `translateX(-${active * 100}%)` }}>{children}</div>
  </div>;
}
