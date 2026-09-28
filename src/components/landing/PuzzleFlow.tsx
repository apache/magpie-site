import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/** Introduce each sequence once; subsequent panels stay assembled as they slide. */
export default function PuzzleFlow({as: Element = "div", className, active = true, introduced, children}: {
  as?: "div" | "ol"; className: string; active?: boolean; introduced?: RefObject<boolean>; children: ReactNode;
}) {
  const root = useRef<HTMLOListElement & HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [shine, setShine] = useState(false);
  const localIntroduction = useRef(false);
  const introduction = introduced ?? localIntroduction;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); observer.disconnect(); }
    }, {threshold: .15});
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active) setShine(false);
    else if (seen && !introduction.current) {
      introduction.current = true;
      setShine(true);
    }
  }, [active, seen, introduction]);
  return <Element ref={root} className={`${className} puzzle-flow`} data-puzzle-ready={seen && active || undefined} data-puzzle-shine={shine && active || undefined}>{children}</Element>;
}
