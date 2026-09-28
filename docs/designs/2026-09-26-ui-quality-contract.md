# Site cleanup and measurable UI consistency

The site uses one shared header, footer, spacing system and workflow-card
anatomy. The documentation header deliberately offers search and a mobile tree;
the marketing header offers navigation and installation. Documentation keeps its
three-column reading layout; content pages have a narrower reading measure.

## Inventory and ownership

- `/`: nine hero examples, six skill families and a six-stage security walkthrough,
  Airflow illustration, a four-layer agent protection diagram, three educational
  paths into the existing documentation, project setup and installation links.
- `/start`: five installation variants, real clipboard feedback and setup text.
- `/tools`: search, capability/vendor/organisation filters, MCP switch, empty
  results and reset. Cards and filter options come from generated tool metadata.
- `/stories/airflow`: nine chart metrics, monthly/quarterly periods, keyboard
  inspection and a data table. Source data and its qualifications remain intact.
- `/docs` and `/docs/**`: generated content, nested disclosure navigation,
  mobile drawer, search dialog (including failure/retry), code and tables.
- `/architecture`, `/resources`, `/downloads`, `/brand`: content-page layouts.
- `/demo`: maintained terminal simulation, now reachable from `/start`, using
  the common chrome. It supports draft/approve/reject, details and restart.
- `/404.html`: conventional error page. `/skills/**` and former index URLs are
  compatibility redirects. Markdown twins, search-index JSON, robots and llms
  text are machine-readable endpoints, not standalone navigation pages.

Astro discovers the actual route set on every build. The inventory above
describes page families, not a frozen route allowlist. Generated docs and tool
metadata are changed through their generators. The documentation asset sync
cache is retained; only assets referenced by generated output are published,
including transitive SVG references. Authored assets have no automatic pruning:
an orphan fails the gate and requires review.

Removed code included abandoned animation demos, duplicate security scenes,
unused UI primitives, an old theme/container utility, unused generators and
decorative/stock assets. Removed runtime dependencies included GSAP, Motion,
Three, Radix/shadcn helpers and unused fonts. Existing card/spacing work was
preserved and consolidated. No active workflow or source dataset was removed.

## Blocking rules

`npm run check:fast` checks:

1. Knip's Astro/React/module graph: unused files, exports and dependencies.
   Shell/Worker entry points are explicit in `knip.json`; framework-discovered
   routes and dynamic imports participate in the graph.
2. PostCSS selector parsing: positive class/ID names must have source evidence;
   unused animations fail. Repeated selector/property declarations in the same
   media/layer scope fail across global stylesheets. Scoped Astro styles are
   separate namespaces. Finite runtime terminal/callout names are documented in
   the checker; there is no prefix-wide safelist.
3. Astro/TypeScript diagnostics and Node tests, including deliberately invalid
   CSS, HTML, references, route graphs, assets and a Knip fixture with an unused
   file, export and dependency. A valid dynamic-import fixture must pass.

`npm run test:browser` generates a UUID output directory, runs `astro build
--force`, validates the output and starts its own HTTP server on a random loopback
port. It never reuses the development server. Every route's response must carry
the current build UUID. The process owns and closes its server even on failure.

`npm run test:dev` additionally starts its own development server via `npm run
dev`, refuses an occupied port and runs the same critical progression tests.
It builds production output while dev is running, rebuilds that output with
an active page and requires state and interactions to survive, including after
a reload. It also checks rendered layout, including the chart caption's left
and right edges, so stale development styles cannot pass on markup alone.
This reproduces the previously observed failed React module imports.
Dev, production and individual quality builds use separate dependency caches;
the dev watcher excludes `.builds/`. Tests also reject hydration errors caught
and logged by Astro, failed script requests and uncaught browser errors.

Build integrity checks all HTML, including redirects: raw nesting/closing tags,
duplicate IDs/attributes, accessible form/image structure, one page title/H1/main,
skip destination, ID references, local URLs/assets and fragments. A breadth-first
walk from `/` must reach every non-redirect public page except the conventional
404. Disconnected cycles fail even if their pages link to each other.

Passive reading updates the URL to the current section or documentation heading
using history replacement. Query parameters, history state, focus and selected
workflow content remain intact. Explicit links and Back/Forward retain their
destination until the reader scrolls again; precise links within a section are
kept while that section is active. Returning to the page top clears the fragment.
Browser checks cover desktop/phone widths, keyboard navigation and documentation.

Browser rules use a 2 CSS-pixel rounding tolerance:

- No document overflow or visible elements outside the viewport. Text ranges
  must fit headings, buttons and paragraphs; legitimate code/table scroll
  regions remain scrollable. The moving carousel rail is measured through its
  active slide and descendants, not its intentionally translated wrapper.
- Shared page containers have symmetric margins and at least the gutter token.
- Homepage sections retain at least the shared responsive section-padding
  token on both vertical edges (64–112px, plus any wave clearance). Local
  compression fails the checker; deliberately broken phone/desktop fixtures
  verify both edges. Shared card gaps are 24px on phones and 32px on desktop;
  Headings use 32px between their title and lead; consecutive explanatory blocks
  use 64px (24px and 48px on phones). The stage rail, prompt and cards follow
  that same rhythm. Security stage titles retain clearance before floating badges.
  Heading/body spacing and checklist items use a separate 20px content gap.
  The card checker rejects heading/body gaps that depart from this token.
- Every visible marketing section heading shares its section's centre axis,
  including headings inside narrower wrappers. Both the box and its text are
  checked. The original Airflow defect came from a more specific `margin`
  shorthand cancelling auto inline margins; shared heading rules now own both
  axes. Article headings and card headings retain their separate semantics.
- Homogeneous card rows (comparisons, learning paths and content catalogues)
  have equal bottom edges and aligned heading/body rows. Flow steps deliberately
  fit their own content and align on a common vertical centre; unlike cards in
  a catalogue, they do not borrow empty height from neighbouring steps. Isolation
  diagrams align at the top and also keep their natural heights. Their different
  diagram depths express different access boundaries. Learning links and tool
  metadata align within their respective rows. Card padding equals the
  shared token on all four sides. Heading text centres in its heading box;
  its row fits the tallest actual title plus badge clearance, without a fixed
  minimum height. The gate rejects surplus heading space.
- Workflow cards are capped at 26rem (and the available width); paired layouts
  share this measure instead of filling the entire section. Isolation diagrams and their prose share one 36ch content column. Prose in
  every workflow card is capped at that same measure and centred as a column. Text remains left-aligned unless
  its role explicitly calls for centred copy. Shared card padding is 32px on
  desktop and 20px on phones. These tokens scale with reading needs rather than
  setting fixed heights. Hidden carousel/sequence stages may reserve a stable
  outer viewport, but must not inflate visible card bodies. Broken fixtures
  reject excessive body height, displaced flow centres, overwide cards/prose
  and off-centre prose columns, including a taller inactive stage.
  All card flows use the same 28px SVG arrow with one card-gap token of
  clearance on each side (32px desktop, 24px phone). The same rule applies
  horizontally and between a stacked card and the next badge. Three-card
  flows stack below 1101px to preserve readable cards and these clearances;
  two-card flows stack below 801px. The checker rejects differing glyphs,
  sizes, positions and clearances, including deliberately broken fixtures.
  The three learning cards use the same connectors and progress from manual
  through prepared to result colours, including their icon palettes.
  Manual cards use warm orange, Magpie's preparation uses blue, and ready
  results use green in both themes. The checker rejects a different surface
  or text palette, and every hero/lifecycle stage asserts this semantic order.
- Content cards use at most two shared type sizes: the 20px card title and
  16px reading text (both rem-based and responsive to text zoom). Emphasis and
  secondary information use weight and colour instead of a third size. A text
  node audit includes labels, links and metadata in cards and tool entries;
  deliberately introducing a third size must fail. Code viewers, charts and
  full documentation articles are separate content structures.
  The two-card summaries and project-rule example share `card-flow`, including
  content-sized heading rows and responsive connectors. Supporting notes and
  actions belong beneath the pair, so they do not inflate the opposite card.
  Brief human reactions use an optional shared emphasis row in bold, centered
  reading text with quotation marks and balanced wrapping. Their separation from
  the card body uses the heading-gap token (32px desktop, 24px phone). Paired comparisons align this row separately, keeping headings
  and checklist markers steady when a reaction wraps.
  Follow-up actions beneath the lifecycle, isolation, project-rule and learning
  sections share a centered, softly filled blue button with one next-step arrow.
  Layout fixtures reject side-aligned buttons and different variants. Reactions
  retain the body text size; quoted example instructions use the shared
  `example-quote` style with italics and no literal quotation marks.
- All card checklists share a 36ch reading column, capped by the available
  card width. Its width does not depend on wording: markers keep their column
  when a carousel or progressive section changes stage. Every list shares the
  title's centre axis while each item's text stays left-aligned. Checks reject
  content-sized or overwide columns, displaced lists, unequal comparison
  columns and centred item text; long identifiers must still wrap within the
  card. All stages are checked for marker position, including narrow screens.
  Checklist
  icons occupy one line-height and align with the first text line, including
  wrapped items and enlarged text; centring icons against the whole item fails.
  A comparison fits its content inside the stable sequence viewport; hidden
  stages must not stretch its cards. Checks compare list heights to the space
  required by their text, icons and gaps; oversized desktop and phone fixtures
  must fail. Stacked phone lists use natural item heights; matching row heights
  apply only to side-by-side comparisons.
- Shared label text remains centred with or without icons. Stacked label icons
  share its axis and cannot overlap text. Card badges straddle the top edge
  at its midpoint, cannot overlap titles and cannot be clipped by ancestors.
  Every card reserves the same badge space, keeping mixed rows aligned. Chart
  phase icons use the same `card-badge` primitive, size and placement rules;
  missing, shifted, resized or clipped phase badges fail the gate too.
  The badge wrapper is transparent: the icon silhouette itself carries an
  opaque, softly tinted fill. Painted tile backgrounds/shadows and unfilled
  badge SVGs fail the checker. Small interface icons remain outline glyphs.
  Badge icons share a fixed height and keep their SVG aspect ratio; wider
  silhouettes such as the Magpie toolkit must not shrink to fit a square.
  Fixtures reject width-constrained and undersized icons.
  Badge strokes use the same palette as their card heading; their soft fill
  follows that colour. Neutral cards inherit neutral ink rather than the blue
  action-link accent. Both themes reject a badge with an unrelated colour.
  Lifecycle source and result cards also use this primitive, with symbols for
  their specific problem and outcome in every stage.
- The chart caption places its note at the left edge and its data CTA at the
  right edge of the chart. The shared heading gap separates it from the chart
  (or the phone legend). The figure owns these gaps so caption margins cannot
  collapse them. Rendered geometry is checked in production and dev;
  deliberately centred or crowded captions fail the same checker.
- Interface icons share one 1.5px stroke token, rounded caps/joins and
  non-scaling strokes, including Magpie's custom SVG and documentation tree
  chevrons. Checks cover actual rendered icons on every route and reject local
  stroke overrides, scaling strokes and square caps in invalid fixtures.
  Charts, artwork and third-party logos retain their own drawing semantics.
  Paired workflow illustrations put icons and captions on separate shared rows;
  connectors align with the icons even when captions wrap or text is enlarged.
  Their silhouettes share the badge height and soft fill, without backgrounds
  on either SVGs or their wrappers; invalid fixtures cover both tile variants.
  Code is represented by braces throughout these illustrations.
- Standalone action links use `text-link`: an 8px token gap, intrinsic width,
  no resting underline and an underline on hover/keyboard focus. Ordinary prose
  links remain underlined. Decorative outbound arrows are removed throughout
  the site. Only a next-step CTA may contain one trailing `ArrowRight` with
  `cta-arrow`, in either a shared button or text link; diagram connectors and
  disclosure chevrons retain their meaning.
- Buttons share 8px corners, 44px minimum height, a 1.5 line-height, weight 550,
  the site font and an 8px content gap. Normal/small/icon variants own their
  padding and font size. Fields share 8px corners, 44px minimum height, 16px text
  and 12px horizontal padding. Sequence controls deliberately use the shared
  round icon-button variant: a subtle blue surface and left/right chevrons,
  distinct from the shafted arrows connecting diagram cards. Fixtures reject
  missing backgrounds, wrong icons and inconsistent anatomy. On desktop, controls
  flank the active card row at its vertical centre in all three sequences. The
  shared layout accounts for the cards’ reserved badge space. Stacked layouts
  put controls below the content; dots and documentation CTAs have their own row.
  Geometry checks and a deliberately displaced control cover this contract. Page styles cannot
  override these dimensions.
- Workflow and documentation/content surface cards share 16px corners, the
  responsive card-padding token, 20px titles and 16px body text. Cards use fills
  without border strokes, while badge wrappers remain transparent. Controls,
  table rules and diagram
  boundaries keep meaningful lines, and keyboard focus remains outlined.
  Documentation,
  installation, charts, demo and content-page titles use the same page-title
  scale. The homepage hero remains a deliberate display-title exception.
- Cards, chart frames and tables share one two-layer surface-shadow token, with
  light/dark theme values. Plain list rows and nested protection boundaries stay
  flat so lists and diagrams do not accumulate shadows. The rendered checker rejects missing or locally
  divergent shadows in both themes; fixtures include cards, charts and tables.
- Software skill families and the detailed security example use two independent
  scrolling walkthroughs. Both share `WorkflowStages`: numbered 32px markers,
  selected/completed states, connector lines and keyboard navigation. Each panel
  pins below the header only when it fits the viewport; scrolling reveals every
  stage in either direction. The section title and introduction belong inside
  the pinned panel, so their context remains visible through every stage.
  Browser checks reject a title that disappears above the viewport.
  Short, narrow and reduced-motion viewports use
  ordinary page flow with the same stage tabs and round arrow controls.
  The security walkthrough belongs inside the Airflow case-study article,
  following its result chart on the same sheet. The broader skill families follow
  in their own section. Every family retains its full problem/work/result
  content and documentation CTA. Family examples sit directly on their section
  surface; neither walkthrough has nested topic navigation or duplicate summaries.
  The nine-example carousel retains compact dots for its separate
  autoplay model. Hover and keyboard focus pause rotation temporarily; selecting
  a dot stops it for the visit, including on touch devices. System motion changes
  must not override that explicit selection. There is no separate play/pause button.
  All three sequences share `useWorkflowKeyboard`: Left/Right wrap through items,
  Home/End select the endpoints and focus follows the selected control. Keys
  work from focused sequence content as well as navigation controls; modified
  shortcuts and text-entry fields retain their normal behaviour. Without focus
  inside a visible sequence, Left/Right control the most visible sequence after
  scrolling; an off-screen tab cannot keep ownership.   Home/End still navigate the page outside sequences, and unrelated focused
  controls keep their keys.
  Keyboard
  selection stops hero autoplay just like clicking a dot.
  Titles and progressive panels share a 280ms fade with a 6px settling motion;
  control colours and markers use 180ms transitions. Inactive content remains
  inert and hidden from assistive technology throughout the transition.
  Reduced motion disables these transitions. Production and dev tests inspect
  running opacity transitions after real selections and verify their absence
  with reduced motion enabled.
- Every discovered HTML route runs at 320, 375, 600, 800, 801, 1150, 1151, 1440,
  1524 and 1920 px. Axe WCAG 2 A/AA and 2.1 AA runs in light/dark at 375 and 1280 px.
- Interaction tests cover every carousel/tab state, filter dimensions and result
  count changes, dialog/drawer focus and Escape, search failure/retry, clipboard,
  persisted theme, chart metrics/periods and terminal decisions/busy state.
- Long unbreakable text, an additional checklist item and 200% root text size
  must keep the homepage within the same geometry rules. Reduced motion is
  enabled for the deterministic matrix; the carousel defaults to paused there.
  Critical progression tests exercise every hero slide, the complete autoplay
  loop, hover/focus pause and resume, keyboard and touch selection, and live
  reduced-motion changes. Both walkthroughs exercise all stage tabs, keyboard
  wrapping/Home/End, round previous/next buttons and disabled endpoints.
  Actual wheel scrolling must reveal every stage and reverse cleanly. Narrow,
  short and reduced-motion viewports retain usable controls in ordinary page
  flow. Hover/focus/disabled controls are
  also exercised across homepage, installation, documentation, charts and demo.
- Broken browser fixtures prove overflow, asymmetric margins, clipped labels,
  inconsistent padding, row misalignment, shifted headings/wrappers, unbalanced
  labels, displaced/clipped/overlapping badges and divergent action-link styles
  are rejected. Additional fixtures reject local overrides of control/card/title
  typography, corners, padding, target size and invalid CTA arrows. The hydration
  regression was also reproduced before its fix.
- The illustrative Airflow report and projected effort curves increase at every
  sampled point; projected effort preserves its slope across Magpie adoption.
  Curve labels reference their own graph paths, following the same geometry
  with readable clearance. Phones retain the external legend.
  The underlying measured case-study data remains separate and unchanged.
  The Airflow quotation, chart and security walkthrough form one article in
  a quiet section wash. There is no enclosing card or stacked-paper decoration
  around the long scroll sequence.
  A general collection heading introduces project stories. Each article has
  its own logo and subordinate outcome title in the shared heading style, so the first example does not define
  the whole section. The quotation and its attribution follow the chart,
  before the security walkthrough. There is no repeated chart subtitle or
  competing story link beside the attribution; the chart caption links to
  the story and data.
  Completed results and the protected agent workspace share the fresh green
  success palette. The Airflow section uses an 18% wash of that palette over the
  page surface, so the backdrop does not compete with the story and chart. The chart's with-Magpie curve and recovered-time
  area use its success accent, including in dark mode. The symbol inside the
  Magpie toolkit inherits its illustration colour through an SVG symbol using
  the original favicon geometry; it does not require a separate dark-mode filter.

Screenshots for each page family at phone/desktop sizes are emitted in
`.builds/visual/` for human review. Failure screenshots/traces and the Playwright
report are under `.builds/`. They are ignored build artifacts, not source files.

## Hooks and CI

Pre-commit runs hygiene plus `check:fast`; pre-push runs hygiene plus `check`.
CI runs both groups plus the dev/build coexistence suite with locked npm
dependencies and Chromium installed.
`npm run hooks:verify` invokes Git itself in a disposable repository with the
effective hooks path and installed prek shims, and requires deliberate rejection
at both stages. This detects a global `core.hooksPath` that shadows local hooks.
It never changes this project's index or creates/pushes a project commit.

## Boundaries

These are explicit contracts, not a guarantee of every future visual design.
The matrix uses Chromium and selected widths/states, not every browser or every
possible data combination. Axe covers machine-checkable rules, not a complete
screen-reader or usability review. Source token checks are conservative around
dynamic class construction; they cannot prove every selector branch is reachable
or detect every shorthand/specificity interaction. New runtime class generators
need explicit evidence and fixtures. Code/table horizontal scrolling is allowed.

Local links and resources are deterministic. External service availability is
not a blocking network dependency of this suite. Upstream docs are mutable when
syncing `main`; checks apply to the actual synced snapshot. New upstream defects
must be fixed or narrowly normalised in the generator, never hidden by disabling
an accessibility rule or hand-editing generated Markdown.
