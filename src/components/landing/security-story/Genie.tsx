"use client";

/**
 * The Magpie genie: the bird coming out of the lamp, shown whenever Magpie does
 * something the maintainer would otherwise have done by hand.
 *
 * It is a badge, not a mascot animation — it pops, says what it did and what
 * that would have cost, and gets out of the way. Drawn inline so it needs no
 * asset and follows the page's colours.
 */
export function GenieMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      {/* the wisp it rides in on */}
      <path
        d="M12 44c-3-4 1-7 5-8 5-1 9 1 13-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M16 46c6-1 10-3 16-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* long magpie tail */}
      <path
        d="M30 30c6 3 10 8 12 14-6-2-11-5-15-9"
        fill="currentColor"
        opacity="0.55"
      />
      {/* body */}
      <ellipse cx="25" cy="24" rx="10" ry="11" fill="currentColor" />
      {/* wing */}
      <path d="M22 18c6 1 9 5 10 11-5 1-9-2-11-6z" fill="currentColor" opacity="0.35" />
      {/* head */}
      <circle cx="21" cy="12" r="6" fill="currentColor" />
      {/* beak */}
      <path d="M15 11l-7 2 7 3z" fill="currentColor" />
      {/* eye */}
      <circle cx="22" cy="11" r="1.6" fill="#fff" />
      {/* sparkle, because it is magic */}
      <path
        d="M38 8l1.6 4.4L44 14l-4.4 1.6L38 20l-1.6-4.4L32 14l4.4-1.6z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

/**
 * The pop-in. `phase` runs 0→1 across the moment: it springs in, holds, and
 * fades. Derived from beat progress like everything else, so it is correct when
 * the reader jumps into the middle of a chapter.
 */
export function GenieBadge({
  did,
  month,
  phase,
}: {
  did: string;
  month: string;
  phase: number;
}) {
  // Quick in, quick out, long hold: three-quarters of the window is the badge
  // simply sitting there being read.
  const entering = Math.min(1, phase / 0.12);
  const leaving = phase > 0.88 ? (phase - 0.88) / 0.12 : 0;
  const opacity = entering * (1 - leaving);
  // A little overshoot on the way in reads as "popped", not "faded".
  const scale = 0.7 + 0.36 * entering - 0.06 * Math.max(0, entering - 0.88) * 8;
  const lift = (1 - entering) * 10 + leaving * 8;

  return (
    // Centred horizontally and sitting low in the frame: it is the thing to look
    // at while Magpie works — hence the dimmed scene behind it — but it should
    // not cover the scene it is talking about.
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center px-4 pb-8 mobile:pb-4">
      <div
        className="absolute inset-0 bg-neutral-900"
        style={{ opacity: opacity * 0.28 }}
      />
      <div
        className="relative w-[min(34rem,100%)]"
        style={{
          opacity,
          transform: `translateY(${lift}px) scale(${scale})`,
        }}
      >
      <div className="flex items-center gap-4 rounded-2xl border border-solid border-brand-200 bg-default-background/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
        <GenieMark className="size-14 flex-none text-brand-600 mobile:size-10" />
        <div className="min-w-0">
          <div className="truncate text-caption font-caption text-subtext-color">
            Magpie did that — {did}
          </div>
          {/* The month is the only figure. A per-act saving would be a claim
              about one run that nobody can check. */}
          <div className="truncate text-body-bold font-body-bold text-brand-700">
            {month} last month
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
