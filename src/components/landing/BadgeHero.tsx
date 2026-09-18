// SPDX-License-Identifier: Apache-2.0
import { useLayoutEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import gsap from "gsap";
import { withBase } from "@/ui/lib/utils";

const markdown = '[![Magpie](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/apache/magpie/main/assets/badge.json)](https://magpie.apache.org/)';

export function BadgeHero({paused}: {paused: boolean}) {
  const root = useRef<HTMLElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  useLayoutEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to('.k-badge-mark', {y: -14, rotation: 5, duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true, scrollTrigger: {trigger: root.current, start: 'top bottom', end: 'bottom top', toggleActions:'play pause resume pause'}});
      gsap.to('.k-badge-orbit', {rotation: 360, duration: 32, ease: 'none', repeat: -1, scrollTrigger: {trigger: root.current, start: 'top bottom', end: 'bottom top', toggleActions:'play pause resume pause'}});
    }, root);
    return () => mm.revert();
  }, [paused]);
  async function copy() {
    let success = false;
    try {await navigator.clipboard.writeText(markdown);success=true;}
    catch {const details = field.current?.closest('details'); const wasOpen = details?.open; if (details) details.open=true; field.current?.focus();field.current?.select();try {success=document.execCommand('copy');}catch {success=false;} if (details && success && !wasOpen) details.open=false;}
    setCopied(success);setFailed(!success);
  }
  return <section className="k-section k-badge-hero" id="adopt-magpie" ref={root}>
    <div className="k-badge-art" aria-hidden="true"><div className="k-badge-orbit"><i /><i /></div><img className="k-badge-mark" src={withBase('/subframe-mark.svg')} width="150" height="150" alt="" /><span>Maintained with Magpie</span></div>
    <div className="k-badge-copy"><h2>Give your README<br /><span>a little Magpie.</span></h2><p>Using Magpie? Add the badge to your project.</p><div className="k-badge-action"><button className="k-button" onClick={copy}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Copied!' : 'Copy badge code'}</button><span role="status">{copied ? 'Ready to paste into your README.' : failed ? 'Select the code below and copy it.' : 'Markdown for your README'}</span></div><details open={failed || undefined}><summary>View code</summary><textarea aria-label="Badge Markdown" ref={field} readOnly value={markdown} rows={3} onFocus={event => event.currentTarget.select()} /></details></div>
  </section>;
}
