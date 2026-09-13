"use client";

import type { Beat, BoardCard } from "../script";

/**
 * The tracker board. One card travels; everything else holds still, so the eye
 * has exactly one thing to follow. Column position is interpolated from
 * `progress`, which is why a chapter jump lands the card mid-column correctly.
 */
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Which column a card occupies at `progress`, as a fractional index. */
function columnAt(card: BoardCard, progress: number) {
  if (card.from === card.to) return card.from;
  const legs = card.to - card.from;
  // Cards move in discrete hops, one per event, with a pause on each column.
  const scaled = easeInOut(Math.min(1, progress / 0.92)) * legs;
  return card.from + scaled;
}

export function BoardScene({
  beat,
  progress,
}: {
  beat: Extract<Beat, { scene: "board" }>;
  progress: number;
}) {
  const columns = beat.columns;
  const eventIndex = Math.min(
    beat.events.length - 1,
    Math.floor((progress / 0.92) * beat.events.length),
  );

  return (
    <div className="flex h-full w-full flex-col bg-neutral-50 px-6 py-5 mobile:px-3 mobile:py-3">
      <div className="mb-3 flex flex-none items-center justify-between gap-3">
        <span className="truncate text-caption font-caption text-subtext-color">
          {beat.title}
        </span>
        <span className="truncate rounded-md bg-default-background px-2 py-1 text-caption font-caption text-brand-700">
          {beat.events[eventIndex]}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2 mobile:grid-cols-3 mobile:overflow-x-auto">
        {columns.map((column, ci) => {
          const here = beat.cards.filter(
            (card) =>
              Math.round(columnAt(card, progress)) === ci &&
              !(card.exitAt !== undefined && progress > card.exitAt + 0.12),
          );
          return (
            <div
              key={column}
              className="flex min-w-0 flex-col rounded-lg border border-solid border-neutral-200 bg-default-background/60"
            >
              <div className="flex flex-none items-center justify-between gap-1 border-b border-solid border-neutral-200 px-2 py-1.5">
                <span className="truncate text-caption font-caption text-default-font">
                  {column}
                </span>
                <span className="flex-none rounded-full bg-neutral-100 px-1.5 text-caption font-caption text-subtext-color">
                  {here.length}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-1.5">
                {here.map((card) => (
                  <Card
                    key={card.id}
                    card={card}
                    moving={card.from !== card.to}
                    leaving={card.exitAt !== undefined && progress > card.exitAt}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  card,
  moving,
  leaving,
}: {
  card: BoardCard;
  moving: boolean;
  /** Closed and on its way off the board — the work is finished. */
  leaving?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-solid px-2 py-1.5 transition-all duration-500 ${
        leaving ? "-translate-y-2 scale-95 opacity-0" : ""
      } ${
        card.muted
          ? "border-neutral-200 bg-neutral-50 opacity-60"
          : moving
            ? "border-brand-300 bg-default-background shadow-md"
            : "border-neutral-200 bg-default-background"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-caption text-subtext-color">{card.id}</span>
        {card.severity === "high" && (
          <span className="rounded-full bg-red-50 px-1.5 text-caption font-caption text-red-700">
            high
          </span>
        )}
        {card.severity === "none" && (
          <span className="rounded-full bg-neutral-100 px-1.5 text-caption font-caption text-subtext-color">
            closed
          </span>
        )}
      </div>
      <div className="mt-0.5 line-clamp-3 text-caption font-caption text-default-font">
        {card.title}
      </div>
    </div>
  );
}
