<!--
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
-->

# Recording the landing-page install demo

The landing page reserves a 16:9 frame in the **See it in action** band
(`InstallDemo.tsx`, section `#see-it-in-action`) for a recording that shows
Magpie being installed **from the `apache/magpie` marketplace** and then used
across skill families. Until that recording exists the frame renders a
placeholder.

This page is the shooting script and the production settings. Follow it end to
end and the result drops into the page with a five-line edit.

- [What the animation has to show](#what-the-animation-has-to-show)
- [Script](#script)
- [Recording setup](#recording-setup)
- [Producing the asset](#producing-the-asset)
- [Accessibility — non-negotiable](#accessibility--non-negotiable)
- [Wiring it into the page](#wiring-it-into-the-page)
- [Review checklist](#review-checklist)
- [Upstream sources](#upstream-sources)

## What the animation has to show

Three beats, in this order. They are also the three cards rendered under the
frame in `InstallDemo.tsx` (`STORYBOARD`) — **if you change the recording,
change those cards to match.**

| # | Beat | The point a viewer should take away |
|---|---|---|
| 01 | Add the marketplace | One command inside the agent they already run. `apache/magpie` *is* the marketplace — no vendor directory, no account, nothing written into their project. |
| 02 | Install only the families you need | One plugin per family. You take `magpie-pr-management` without taking `magpie-security`, and every family you add costs context in every session. |
| 03 | Run a skill | Every skill is called as `/<plugin>:<skill>` — the family plugin is the prefix, so what you can call is exactly what you installed. The agent proposes; the human confirms before anything leaves the machine. |

Beat 03 is the one that sells the project — budget the most screen time for it
and make sure the confirmation prompt is legible.

Two things that must be unmistakable on screen, because they are the whole
argument for the marketplace path over the snapshot install:

1. **Nothing is committed.** The repository is untouched — no lock file, no
   config, no diff. If you can show a clean `git status` at the end without
   padding the runtime, do.
2. **Families are opt-in and separate.** The plugin list after beat 02 should
   show the two or three plugins you chose, *not* all ten and *not* the
   all-in-one `magpie` plugin.

### Scope and length

- **Target 75–110 seconds.** The install itself is two commands; the time
  belongs to beat 03.
- One continuous session in one agent, in one terminal. No cuts between
  windows, no editor, no browser.
- Record in **Claude Code**, because per-family plugins are Claude Code-only
  today — the recommended install is the one worth showing. The all-in-one
  plugin on Codex / VS Code / Gemini is covered by the caption under the
  storyboard cards; it does not need its own footage.
- Demo against a **throwaway repository you own** — see
  [Recording setup](#recording-setup).

## Script

Type these in this order. Bracketed notes are direction, not things to type.

```text
# ── 01 · Add the marketplace ────────────────────────────────────────────────
$ cd ~/demo/my-project
$ claude
> /plugin marketplace add apache/magpie
  [ hold ~2 s on the confirmation that the marketplace was added ]

# ── 02 · Install only the families you need ─────────────────────────────────
> /plugin install magpie-setup@apache-magpie
> /plugin install magpie-pr-management@apache-magpie
> /plugin
  [ hold ~3 s on the plugin list: exactly these two, installed and enabled ]
  [ do NOT scroll through the other eight — the point is that you skipped them ]

# ── 03 · Run a skill ────────────────────────────────────────────────────────
> /magpie-pr-management:pr-management-triage
  [ note the prefix on screen: the plugin from beat 02, then the skill ]
  [ the agent reads the queue and PROPOSES labels / assignees ]
  [ hold on the confirmation prompt — this is the money shot ]
  [ answer, show the applied result ]
> /magpie-utilities:list-skills
  [ OPTIONAL, only if it fits the runtime: the live index of what is installed,
    every entry in <plugin>:<skill> form — install magpie-utilities in beat 02
    if you want this closer ]
> exit
$ git status          [ optional closer: "nothing to commit, working tree clean" ]
```

`magpie-setup` is the family to always install — it carries the
secure-isolation skills, `/magpie-setup:setup-isolated-setup-install` among
them — so keep it in beat 02 even though the skill you run in beat 03 comes
from another family. That pairing *is* the message: two families,
independently chosen.

If a different family reads better for your project, swap the one in beats 02
and 03 — but keep the shape (marketplace → pick families → run one), keep the
`<plugin>:<skill>` form on screen, and keep the `STORYBOARD` cards in step with
whatever you record. Real invocations, one per family:

| Install | Then run |
|---|---|
| `magpie-setup@apache-magpie` | `/magpie-setup:setup-isolated-setup-install` |
| `magpie-pr-management@apache-magpie` | `/magpie-pr-management:pr-management-code-review` |
| `magpie-issue@apache-magpie` | `/magpie-issue:issue-triage` |
| `magpie-release-management@apache-magpie` | `/magpie-release-management:release-rc-cut` |
| `magpie-repo-health@apache-magpie` | `/magpie-repo-health:dependency-audit` |
| `magpie-utilities@apache-magpie` | `/magpie-utilities:list-skills` |

These are the same six rendered on the page (`ACROSS_FAMILIES` in
`InstallDemo.tsx`, which also lists `magpie-security`). Skill names come from
`skills/` in `apache/magpie` — check there before adding one.

Note the two different separators, and do not mix them up: `@` selects the
marketplace when **installing** a plugin, `:` selects the plugin when
**running** a skill.

### Things to avoid on camera

- **Do not demo the `security` family.** Those skills operate on private
  security trackers and pre-disclosure reports.
- **Do not demo the all-in-one `magpie` plugin.** It installs all 74 skills and
  ~21.7k always-on tokens per session; the page argues against it as a default.
- Real credentials, tokens, `gh auth` output, `~/.ssh` paths, private
  hostnames — check the terminal title bar and the status line, not just the
  body.
- Any private tracker, embargoed advisory, or non-public issue content.
- A repo you do not own — the recording is published under the ASF's name.
- Long silent stretches. Trim them with `--speed` at render time, not by
  hand-editing the cast.

## Recording setup

Use a purpose-built demo shell, not your daily one.

```bash
# A clean, reproducible prompt and environment
env -i HOME="$HOME" TERM=xterm-256color PS1='$ ' bash --norc --noprofile
```

| Setting | Value | Why |
|---|---|---|
| Terminal size | **100 × 28** columns × rows | Fills 16:9 without letterboxing; wider wraps badly on mobile. |
| Font | JetBrains Mono / Fira Code, 14 pt | Legible when the frame scales to ~340 px on phones. |
| Theme | Dark, high contrast (the player background is `#0f1117`) | Matches the frame; light themes glare against the brand-50 band. |
| Prompt | Bare `$` | A personal prompt leaks hostname and paths, and dates the recording. |
| Typing | Real typing, unhurried | Instant-paste reads as fake; frantic typing is unreadable. |

Claude Code redraws a full-screen TUI, so record the raw session with
[asciinema](https://asciinema.org) — a text cast, reviewable in a PR and
re-renderable later:

```bash
asciinema rec --cols 100 --rows 28 --idle-time-limit 2 magpie-marketplace-install.cast
```

`--idle-time-limit 2` caps every pause at two seconds, which removes most of
the dead air while the agent thinks. Watch the rendered output once before
publishing: a TUI that repaints heavily can produce a jumpy cast, and that is
easier to fix by re-recording than by post-processing.

## Producing the asset

Two supported outputs. **Prefer the animated SVG** — it is text, it diffs, it
stays sharp at any size, and it needs no video pipeline.

### Option A — animated SVG (preferred)

```bash
# https://github.com/asciinema/agg
agg --font-family "JetBrains Mono" \
    --font-size 14 \
    --theme asciinema \
    --speed 1.4 \
    --idle-time-limit 2 \
    magpie-marketplace-install.cast \
    magpie-marketplace-install.svg
```

Check the result is **under 2 MB**. If it is not, shorten the session — do not
drop the frame rate; the text goes muddy. A TUI-heavy cast can blow past 2 MB
easily, which is the usual reason to fall back to Option B.

### Option B — video (when the SVG is too large)

```bash
agg --speed 1.4 magpie-marketplace-install.cast magpie-marketplace-install.gif
ffmpeg -i magpie-marketplace-install.gif -c:v libvpx-vp9 -crf 34 -b:v 0 -an \
       magpie-marketplace-install.webm
ffmpeg -i magpie-marketplace-install.webm -frames:v 1 \
       magpie-marketplace-install-poster.png
```

Ship the `.webm` plus the poster. There is no audio track and the player is
muted, so never add a soundtrack — the page autoplays it.

### Where the files go

```text
public/demo/magpie-marketplace-install.svg     # or .webm + -poster.png
public/demo/magpie-marketplace-install.txt     # transcript (see below)
```

Keep the raw `.cast` in the PR description or attached to the issue — it is the
source, but it does not need to ship in `public/`.

## Accessibility — non-negotiable

The animation autoplays and loops, so it must not be the only way to get the
information:

1. **Transcript.** Write the session out as plain text to
   `public/demo/magpie-marketplace-install.txt` — the commands and the key
   parts of the output. `asciinema cat <cast> > <txt>` gets you a first draft;
   hand-trim the control sequences, which a TUI recording will be full of. The
   player links it, and `DemoAsset.transcript` is a required field precisely so
   this cannot be skipped.
2. **The storyboard cards stay.** They render in both states and carry the same
   three beats in text. Do not remove them once the recording lands.
3. **No flashing.** Nothing should flash more than three times per second —
   watch for spinner-heavy agent output and repeated full-screen repaints.
4. **Contrast.** Terminal foreground against `#0f1117` at 4.5:1 or better.

## Wiring it into the page

Edit the `DEMO` constant near the top of
[`InstallDemo.tsx`](./InstallDemo.tsx) — that is the whole change:

```tsx
const DEMO: DemoAsset | null = {
  kind: "svg",
  src: "/demo/magpie-marketplace-install.svg",
  transcript: "/demo/magpie-marketplace-install.txt",
  durationLabel: "1 min 20 s",
};
```

For the video variant:

```tsx
const DEMO: DemoAsset | null = {
  kind: "video",
  src: "/demo/magpie-marketplace-install.webm",
  poster: "/demo/magpie-marketplace-install-poster.png",
  transcript: "/demo/magpie-marketplace-install.txt",
  durationLabel: "1 min 20 s",
};
```

Paths are site-relative; `withBase()` is applied for you, so do not prefix them.

## Review checklist

Before opening the PR:

- [ ] `npx astro build` is clean.
- [ ] The frame holds its 16:9 box at 1440 px, 768 px, and 375 px wide — the
      page does not scroll sideways at any of them.
- [ ] No credential, token, private hostname, or private tracker content is
      visible in any frame **or in the transcript**.
- [ ] The plugin list on screen shows only the families that were installed on
      purpose — no all-in-one `magpie` plugin, no `magpie-security`.
- [ ] The transcript exists and its link resolves.
- [ ] Every skill invocation on screen is in `/<plugin>:<skill>` form — a bare
      `/pr-management-triage` means the recording was made against a snapshot
      install, not the marketplace, and has to be redone.
- [ ] `STORYBOARD` and `ACROSS_FAMILIES` in `InstallDemo.tsx` still match what
      the recording shows.
- [ ] Asset size: SVG under 2 MB, or WebM under 5 MB.
- [ ] The raw `.cast` is attached to the PR.

## Upstream sources

The install flow shown here is defined in `apache/magpie`, not in this repo.
When those pages change, this recording and the `STORYBOARD` cards are what
goes stale:

- `docs/quick-start.md` — the two-command marketplace install, the family
  table, and the namespacing rule (`/<plugin>:<skill>`).
- `docs/setup/marketplaces.md` — the full reference: every supported agent,
  all-in-one vs per-family, the Claude Code-only note behind the caption under
  the storyboard cards, and versioning.
- `assets/quickstart/README.md` — the capture checklist for the still
  screenshots on those pages. Its conventions (crop tight, no secrets, one
  family per shot) are the same ones applied here.

The landing section currently links to `/docs/setup/readme`. Once
`docs/quick-start.md` lands upstream and the next docs sync picks it up,
retarget that link to `/docs/quick-start` — there is a `TODO` on it in
`InstallDemo.tsx`.
