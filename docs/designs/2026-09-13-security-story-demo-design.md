# Security-story demo — design

An in-browser animated demo for the landing page's **See it in action** band,
carrying one story end to end: install Magpie, set it up, import and triage a
security report, watch it cross a tracker board, publish the CVE, announce it.

It replaces the placeholder in `InstallDemo.tsx`, which reserved the frame for
a screen recording. The recording could only ever cover the first two beats —
the CVE flow does not exist to film — so the frame is filled by a component
instead.

## Constraints

**The project is fictional and must read that way.** `example-org/example-app`,
its tracker `example-org/example-app-security`, and the RFC 2606 reserved
domains `example.com` / `example.org`. The CVE id is `CVE-2026-XXXXX` — a
placeholder shape that cannot collide with a real identifier. The mail,
Vulnogram and published scenes carry an *Illustration · fictional project*
ribbon, so a screenshot of any of them cannot be mistaken for a real advisory.

**Isolation comes before the first real read.** The Adopt chapter sits
ahead of Import deliberately: these skills read pre-disclosure reports, so the
sandbox, the clean environment and the action guard are in place before a skill
touches anything that matters. Ordering is asserted in the checks.

**The agent proposes; a human sends.** Every outward-facing action in the story
passes a confirmation gate on screen. This is the argument the demo exists to
make, so it is never implied — it is always rendered.

**Accessibility is not optional.** A transcript derived from the same script
constant renders below the frame: real text for screen readers, search engines
and anyone with JavaScript off. `prefers-reduced-motion: reduce` never starts
the clock and renders the story as a static stack instead.

## Architecture

The script is data; the scenes are pure functions of a cursor.

```ts
type Beat    = { ms: number; scene: SceneKind; /* scene-specific payload */ };
type Chapter = { id: string; label: string; beats: Beat[] };
const SCRIPT: Chapter[] = [ /* 6 chapters, ~14 beats */ ];
```

**One number drives everything.** `useTimeline` accumulates elapsed
milliseconds in a single `requestAnimationFrame` loop and derives
`(chapterIndex, beatIndex, beatProgress)` from it by prefix sums over `ms`.

Because any elapsed value renders directly, jumping to a chapter is just
assigning `elapsed`. No scene needs a "fast-forward to my end state" path —
which is where a per-scene-timer design gets buggy. Pause stops accumulating;
replay assigns zero.

**Scenes hold no timers and no state.** Each takes `(beat, progress)` and
draws. A terminal types to `progress`; a board card sits between two columns at
`progress`; a Send button depresses past `progress > 0.8`. No drift, no
cleanup, and chapter jumps are exact.

`cursorAt(script, elapsed)` is exported as a pure function so it is testable
the moment this repo grows a test runner (it has none today).

### Files

```
src/components/landing/security-story/
  script.ts              SCRIPT, types, transcript derivation
  Genie.tsx              the genie mark and its pop-in badge
  useTimeline.ts         cursorAt() + the hook (rAF, pause, jump, reduced motion)
  SecurityStoryDemo.tsx  frame, chapter strip, controls, transcript
  scenes/TerminalScene.tsx
  scenes/MailScene.tsx
  scenes/InterludeScene.tsx
  scenes/BoardScene.tsx
  scenes/VulnogramScene.tsx
  scenes/PublishedScene.tsx
```

`InstallDemo.tsx` and `InstallDemo.README.md` are removed: the component is
superseded, and the README was a shooting script for a recording that will not
be made. Its accessibility requirements are carried into this document.

## The script

Ten chapters, ~136s. The four setup steps are separate on purpose: `/magpie-setup`
recommends the other three, and each is then shown being asked for and answered.

| # | Chapter | ~s | Scene | Beat |
|---|---------|----|-------|------|
| 1 | Install | 8 | Terminal | Marketplace, then `magpie-setup`, `magpie-security`, `magpie-agent-guard`; nothing committed |
| 2 | Set up | 9 | Terminal | **`/magpie-setup`** — detects the tracker, writes local config, and recommends the next three steps |
| 3 | Isolate & guard | 10 | Terminal | *"set up isolation and the action guard"* — sandbox plus the `PreToolUse` hook, which denies a force-push to a protected branch outright |
| 4 | Privacy | 8 | Terminal | *"set up privacy for this project"* — the approved-LLM gate refuses a private-list fetch unless every model is approved; PII redaction swaps names for `N-a3f9d2` before a model sees them |
| 5 | Security | 7 | Terminal | *"prepare the security model for this project"* — trust boundaries and scope, opened as a PR |
| 6 | Import | 8 | Terminal | *"sync the security issues that arrived in the last 2 days"* — two reports become #41 and #42 |
| 7 | Triage | 10 | Terminal | *"triage the two new reports"* — #41 high, not a duplicate of #12; #42 is not a vulnerability |
| 7b | Triage | 7 | Mail | Reply to the reporter, sent by a human |
| 8 | Board | 6 | Board | Reported → Triaged → Fix in progress |
| 8b | Board | 7 | Interlude | The genie opens the fix PR itself — #8317, with the test that proves it |
| 8c | Board | 6 | Board | Fix in progress → Fix ready → Released |
| 9 | Learn | 8 | Terminal | *"update the security model with what we learned from #41 and #42"* — the accepted report names a new trust boundary, the rejected one states something out of scope, both land as a PR |
| 10 | Publish | 8 | Vulnogram | CVE record arrives whole, then **Send** |
| 10b | Publish | 8 | Mail | Announcement to `announce@example.org`, sent by a human |
| 10c | Publish | 6 | Board | #41 closes and leaves the board; #42 follows; board clear |
| 10d | Publish | 4 | Published | Advisory entry beside the sent announcement |

Total ≈ 136s: 120s of content plus a one-second hold at the end of every beat.

The hold is deliberately **not** part of a beat's `ms`. Folding it in would
stretch the performance — the typing would simply get slower — where what the
story wants is a moment of stillness on the finished frame before the scene
changes. So `ms` is how long the content takes, `BEAT_HOLD_MS` is the silence
after it, and the cursor clamps progress at 1 for the duration of the hold.

Timing lives in `timeline.ts`, content in `script.ts`: `totalMs(script)` is
derived, so retiming a beat retimes the demo and nothing else needs touching.

## One command, and then plain language

**Two safety chapters, not three.** Upstream lists isolation, the guard and
privacy as three strongly-recommended layers, but the first two answer the same
question — what the agent can reach and what it can run — so the demo shows them
as one step. Privacy stays separate because it answers a different one: the
sandbox and the guard are about a command that should not run, while privacy is
about a command that *should* run and, doing exactly what it was asked, exports
somebody else's mail to a model provider. That chapter closes on the line,
because it is the distinction people miss.

**The model learns from the dispositions.** The chapter after the board feeds
both outcomes back into `SECURITY.md`: the accepted report turns archive
extraction into a named trust boundary, and the rejected one states page latency
out of scope so the next report like it routes itself. It is the one beat that
shows the loop closing — the project gets sharper because a report arrived,
rather than merely surviving it. Its position is asserted in the checks.

`/magpie-setup` is the only Magpie command anybody types. Everything after it is
asked for in ordinary words — *"set up isolation on this machine"*, *"sync the
security issues that arrived in the last 2 days"*, *"triage the two new
reports"* — because the skills are not a command vocabulary a maintainer has to
memorise, and a demo full of `/magpie-security:issue-import` would teach exactly
the wrong lesson. The `/plugin` lines in chapter 1 are the agent's own
marketplace commands, not Magpie's.

The checks assert this: exactly one typed command may start with `/magpie`, and
it must be `/magpie-setup`.

## The genie

Magpie shows up as a genie — the bird out of the lamp — every time it does work
a maintainer would otherwise have done by hand. The badge is deliberately large
and sits low and centred, with the scene dimmed behind it: it is the argument,
not decoration.

**One figure, and it is the month.**

> Magpie did that — checked 148 past issues for duplicates
> **9 h of searching last month**

There is deliberately no per-act claim. "This saved you two hours" is a claim
about a single run that nobody can check and that invites the obvious retort —
*no it didn't* — whereas a month of the same work is the thing a team actually
feels. Every figure is tied to a kind of work ("of searching", "of
form-filling") rather than to the product in general. The closing moment is the
only aggregate: 31 h across 12 reports.

The genie never appears on a step a human took — the two Sends are the
maintainer's, and it is absent from both.

Moments are declared on the beat (`genie: { at, did, month }`) with `at` in the
beat's own progress, so retiming never dislodges one. The window is half the
beat, three-quarters of it a still hold, and every `at` is <= 0.5 so the
fade-out is never cut off by the scene change — asserted in the checks, as is
the absence of any per-act saving.

**Nothing a maintainer did not type is typed.** The mail bodies and the CVE
record both arrive whole, in one flash. Typing them out would sell the opposite
story — a machine at a keyboard, taking exactly as long as the person would
have. Only the terminal types, because there a human really is at the keyboard.

## Visual treatment

One 16:9 frame with the site's `rounded-2xl` border and shadow. Scenes crossfade
with a 4% scale drift over ~400ms, except **CLI → board**, which gets its own
beat: the terminal dims and the board rises through it, because that hand-off is
the point of the story.

Palette is the site's own: `brand-600` for anything a human touches — Send,
Confirm, the active chapter dot — neutrals for surfaces. Severity and status
carry the only other colour.

- **Terminal** — dark slate, monospace, a plain `›` prompt and no imitation of
  any product's chrome. Confirmation gates render as bordered brand-tinted
  blocks.
- **Mail** — deliberately the opposite: light paper, header as label/value rows,
  **plain-text monospace body with literal URLs**, no tracking pixels and no
  rewritten links, as the project's editorial guidance asks of reporter-facing
  mail. The contrast with the terminal is what makes the send beats land.
- **Board** — five columns with counts. Cards are id + title + severity chip.
  Only the travelling card moves; it lifts and slides while counts tick.
- **Vulnogram** — a two-column field grid filling in field by field, beside a
  JSON preview that grows as fields land.
- **Published** — split frame: advisory entry left, sent announcement right.

Below the `mobile:` breakpoint the frame goes 4:3, the board shows three columns
with the rest scrolled horizontally, and the chapter strip wraps.

## Playback

- `IntersectionObserver` starts the clock at ~40% visibility, stops on exit
- hover and focus pause; leaving resumes
- `visibilitychange` pauses on a hidden tab
- the last beat holds, with **Replay**
- a chapter strip shows seven stages, jumpable, with the active one filled
