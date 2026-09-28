import { useEffect, useRef, useState, type RefObject } from "react";

const keyboardPanels = new Set<HTMLElement>();

// One keyboard convention for the hero, skill families and security story.
function workflowKeyIndex(event: KeyboardEvent, index: number, count: number) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input,textarea,select"))) return;
  if (event.key === "Home") return 0;
  if (event.key === "End") return count - 1;
  if (event.key === "ArrowLeft") return (index - 1 + count) % count;
  if (event.key === "ArrowRight") return (index + 1) % count;
}

// Each independent walkthrough explains itself through scrolling when it fits
// below the header. Let the introduction scroll away when only the stage fits;
// never discard progression merely because its introduction makes it taller.
export function useWorkflowSequence(count: number, tabPrefix: string) {
  const [active, setActive] = useState(0);
  const [scrollLayout, setScrollLayout] = useState<"full" | "content" | "flow">("flow");
  const scrollDriven = scrollLayout !== "flow";
  const sceneRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const introHeightRef = useRef(0);
  const stepRef = useRef(220);
  const pinTopRef = useRef(104);

  useEffect(() => {
    const scene = sceneRef.current, panel = panelRef.current, content = contentRef.current;
    const intro = panel?.firstElementChild as HTMLElement | null;
    if (!scene || !panel || !content || !intro) return;
    const media = matchMedia("(min-width: 901px) and (prefers-reduced-motion: no-preference)");
    let frame = 0, driven = false;
    const update = () => {
      if (!driven) return;
      const distance = pinTopRef.current - scene.getBoundingClientRect().top - introHeightRef.current;
      setActive(Math.max(0, Math.min(count - 1, Math.round(distance / stepRef.current))));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const measure = () => {
      const introHeight = intro.offsetHeight + parseFloat(getComputedStyle(intro).marginBottom);
      const fullHeight = introHeight + content.offsetHeight;
      const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 80;
      const available = innerHeight - headerHeight - 32;
      const layout = !media.matches ? "flow" : fullHeight <= available ? "full" : content.offsetHeight <= available ? "content" : "flow";
      driven = layout !== "flow";
      setScrollLayout(layout);
      introHeightRef.current = layout === "content" ? introHeight : 0;
      const pinnedHeight = layout === "content" ? content.offsetHeight : fullHeight;
      pinTopRef.current = Math.max(headerHeight + 16, (innerHeight - pinnedHeight + headerHeight) / 2);
      scene.style.setProperty("--scene-top", `${pinTopRef.current}px`);
      stepRef.current = Math.min(260, Math.max(180, innerHeight * .22));
      scene.style.height = driven ? `${fullHeight + stepRef.current * (count - .5)}px` : "auto";
      update();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(intro);
    observer.observe(content);
    media.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, {passive:true});
    measure();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      media.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
    };
  }, [count]);

  useEffect(() => {
    const tab = document.getElementById(`${tabPrefix}${active}`), rail = tab?.parentElement;
    if (tab && rail && rail.scrollWidth > rail.clientWidth) rail.scrollTo({left:tab.offsetLeft - rail.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2, behavior:"instant"});
  }, [active, tabPrefix]);
  const select = (index: number) => {
    setActive(index);
    if (scrollDriven && sceneRef.current) scrollTo({top:sceneRef.current.getBoundingClientRect().top + scrollY + introHeightRef.current - pinTopRef.current + index * stepRef.current, behavior:"instant"});
  };
  useWorkflowKeyboard(contentRef, active, count, select, '[role="tab"]');
  return {active, scrollDriven, scrollLayout, sceneRef, panelRef, contentRef, select};
}

// Scrolling does not move DOM focus. Let the sequence in view take over from
// an off-screen tab, while visible focused controls keep their normal keys.
export function useWorkflowKeyboard(panelRef: RefObject<HTMLDivElement | null>, active: number, count: number, select: (index: number) => void, controls: string) {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    keyboardPanels.add(panel);
    const navigate = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const next = workflowKeyIndex(event, active, count);
      if (next === undefined) return;
      const top = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
      const visibleHeight = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(top, rect.top));
      };
      const target = event.target instanceof Element ? event.target : null;
      const focusedPanel = [...keyboardPanels].filter(candidate => target && candidate.contains(target)).reduce<HTMLElement | undefined>((inner,candidate) => !inner || inner.contains(candidate) ? candidate : inner,undefined);
      const sufficientlyVisible = (element: Element) => visibleHeight(element) >= Math.min(element.getBoundingClientRect().height, innerHeight - top) * .3;
      let owner = focusedPanel && target && (visibleHeight(target) > 0 || sufficientlyVisible(focusedPanel)) ? focusedPanel : undefined;
      if (!owner) {
        // Home/End outside a sequence retain page navigation. Links, fields
        // and other widgets outside these panels retain their own behaviour.
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        if (!focusedPanel && target?.closest("a,button,input,textarea,select,summary,[contenteditable],[role=slider],[role=tab]")) return;
        owner = [...keyboardPanels].reduce<{panel?:HTMLElement;height:number}>((best,candidate) => {
          if (best.panel && candidate.contains(best.panel)) return best;
          const height = visibleHeight(candidate);
          const minimum = Math.min(candidate.getBoundingClientRect().height, innerHeight - top) * .3;
          return height > 0 && height >= minimum && (height > best.height || best.panel?.contains(candidate)) ? {panel:candidate,height} : best;
        },{height:0}).panel;
      }
      if (owner !== panel) return;
      event.preventDefault();
      select(next);
      panel.querySelectorAll<HTMLElement>(controls)[next]?.focus({preventScroll:true});
    };
    window.addEventListener("keydown", navigate);
    return () => { keyboardPanels.delete(panel); window.removeEventListener("keydown", navigate); };
  }, [panelRef, active, count, select, controls]);
}
