// review.js is browser script, not a module: at publish time the publisher
// concatenates logic.mjs ahead of it with the `export ` keywords stripped, so
// these arrive as globals rather than imports. Declaring them here documents
// that contract and lets `astro check` see the file as it actually runs.

declare function clampRegion(
  drag: { x1: number; y1: number; x2: number; y2: number },
  viewport: { w: number; h: number },
): { x: number; y: number; w: number; h: number } | null;

declare function captionFor(input: {
  url: string;
  source: string | null;
  region: { x: number; y: number; w: number; h: number };
  sha: string;
}): string;

declare function targetUrl(input: {
  repo: string;
  pr: number;
  source: string | null;
  anchors: Record<string, { anchor: string; ranges: [number, number][] }> | null;
}): string;
