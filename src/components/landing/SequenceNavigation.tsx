import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  content: ReactNode;
  children?: ReactNode;
};

export default function SequenceNavigation({ previousLabel, nextLabel, onPrevious, onNext, previousDisabled, nextDisabled, content, children }: Props) {
  const buttonClass = "button button-soft button-icon button-round";
  return <div className="sequence-navigation">
    <div className="sequence-body">
    <button className={buttonClass} type="button" aria-label={previousLabel} title={previousLabel} onClick={onPrevious} disabled={previousDisabled}><ChevronLeft aria-hidden="true" /></button>
    <div className="sequence-content">{content}</div>
    <button className={buttonClass} type="button" aria-label={nextLabel} title={nextLabel} onClick={onNext} disabled={nextDisabled}><ChevronRight aria-hidden="true" /></button>
    </div>
    {children && <div className="sequence-navigation-middle">{children}</div>}
  </div>;
}
