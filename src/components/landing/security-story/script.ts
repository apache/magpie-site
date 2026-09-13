// The security-story demo, as data.
//
// Everything the animation shows lives here: the scenes are pure renderers of
// whatever this script points at, and the transcript below the frame is derived
// from this same constant — so the two can never drift. Retiming the demo means
// editing `ms`; rewording it means editing this file and nothing else.
//
// The project is fictional and must stay that way. `example-org/example-app`
// with the RFC 2606 reserved domains, and a CVE id in placeholder form that
// cannot collide with a real identifier. See
// docs/superpowers/specs/2026-09-13-security-story-demo-design.md.

export const PROJECT = {
  org: "example-org",
  repo: "example-app",
  name: "Example App",
  tracker: "example-org/example-app-security",
  securityList: "security@example.org",
  announceList: "announce@example.org",
  reporter: "r.chen@example.com",
  cve: "CVE-2026-XXXXX",
  fixVersion: "3.2.1",
  fixPr: 8317,
} as const;

export type SceneKind =
  | "terminal"
  | "mail"
  | "board"
  | "interlude"
  | "vulnogram"
  | "published";

/**
 * A moment where Magpie does the work a maintainer would otherwise have done by
 * hand. The genie pops in, says what it just did and what it cost instead, and
 * leaves. `at` is a point in the beat's own progress, so it stays put when the
 * beat is retimed.
 */
export type Genie = {
  at: number;
  did: string;
  /** What this kind of work added up to across last month. Deliberately the
   *  only figure: a per-act saving would be a claim about one run that nobody
   *  can check, where a month of the same work is the thing a team feels. */
  month: string;
};

/** One line in a terminal scene. `kind` picks how it is drawn, not what it says. */
export type TerminalLine =
  /** A command the human typed — a slash command of the agent or `/magpie-setup`. */
  | { kind: "cmd"; text: string }
  /** What the human actually asks for the rest of the time: plain language. The
   *  skills are not a command vocabulary anybody has to learn. */
  | { kind: "ask"; text: string }
  /** Agent or tool output. */
  | { kind: "out"; text: string }
  /** Output worth noticing — a result, a count, a verdict. */
  | { kind: "note"; text: string }
  /** A confirmation the human has to answer before anything leaves the machine. */
  | { kind: "gate"; text: string; answer: string };

export type MailField = { label: string; value: string };

export type BoardCard = {
  id: string;
  title: string;
  severity?: "high" | "none";
  /** Column index the card starts this beat in. */
  from: number;
  /** Column index it ends in. Equal to `from` means it does not move. */
  to: number;
  muted?: boolean;
  /** Progress at which the card leaves the board — closed, done with. */
  exitAt?: number;
};

type BeatBase = { ms: number; genie?: Genie };

export type Beat = BeatBase &
  (
    | { scene: "terminal"; title: string; lines: TerminalLine[] }
    | {
        scene: "mail";
        title: string;
        fields: MailField[];
        body: string[];
        /** Caption under the Send button, e.g. who is sending and why. */
        gate: string;
      }
    | {
        scene: "board";
        title: string;
        columns: string[];
        cards: BoardCard[];
        /** Event captions that fade in across the beat, evenly spaced. */
        events: string[];
      }
    | {
        /** The genie centre stage: Magpie doing something on its own. */
        scene: "interlude";
        title: string;
        did: string;
        month: string;
        /** The artefact it produced, drawn as a card. */
        card: { kind: string; id: string; title: string; lines: string[] };
      }
    | {
        scene: "vulnogram";
        title: string;
        fields: MailField[];
        gate: string;
      }
    | {
        scene: "published";
        title: string;
        advisory: MailField[];
        summary: string;
      }
  );

export type Chapter = { id: string; label: string; beats: Beat[] };

const BOARD_COLUMNS = [
  "Reported",
  "Triaged",
  "Fix in progress",
  "Fix ready",
  "Released",
];

export const SCRIPT: Chapter[] = [
  {
    id: "install",
    label: "Install",
    beats: [
      {
        ms: 8_000,
        scene: "terminal",
        title: "Add the marketplace, take the families you need",
        lines: [
          { kind: "cmd", text: "/plugin marketplace add apache/magpie" },
          { kind: "out", text: "Added marketplace apache-magpie (12 plugins)" },
          { kind: "cmd", text: "/plugin install magpie-setup@apache-magpie" },
          { kind: "cmd", text: "/plugin install magpie-security@apache-magpie" },
          { kind: "cmd", text: "/plugin install magpie-agent-guard@apache-magpie" },
          { kind: "out", text: "Installed: magpie-setup, magpie-security, magpie-agent-guard" },
          {
            kind: "note",
            text: "Nothing committed — the install is yours, on this machine.",
          },
        ],
      },
    ],
  },
  {
    id: "setup",
    label: "Set up",
    beats: [
      {
        ms: 9_000,
        scene: "terminal",
        title: "The one command worth memorising",
        lines: [
          { kind: "cmd", text: "/magpie-setup" },
          { kind: "out", text: `Detected ${PROJECT.org}/${PROJECT.repo}` },
          { kind: "out", text: `Tracker ${PROJECT.tracker} · list ${PROJECT.securityList}` },
          {
            kind: "gate",
            text: "Write this to .magpie-local/ (gitignored)?",
            answer: "y",
          },
          { kind: "note", text: "Recommended next, and each is its own step:" },
          { kind: "out", text: "  · isolate this agent      · install the action guard" },
          { kind: "out", text: "  · prepare the security model" },
        ],
      },
    ],
  },
  {
    id: "isolate-guard",
    label: "Isolate & guard",
    beats: [
      {
        ms: 10_000,
        genie: {
          at: 0.5,
          did: "Wrote the sandbox profile and wired the guard hook",
          month: "6 h of setup, across the team",
        },
        scene: "terminal",
        title: "Two layers about what the agent can reach and what it can run",
        lines: [
          { kind: "ask", text: "set up isolation and the action guard" },
          {
            kind: "out",
            text: "Sandbox: Seatbelt — Bash subprocesses see only the paths you allow",
          },
          {
            kind: "gate",
            text: "Apply 3 settings changes and 1 sudo step?",
            answer: "y",
          },
          { kind: "out", text: "~/.ssh, ~/.aws and your tokens are out of reach" },
          {
            kind: "out",
            text: "magpie-agent-guard: PreToolUse hook now inspects every shell command",
          },
          {
            kind: "note",
            text: "✗ denied: force-push to a protected branch. The guard refuses — no prompt to click through.",
          },
        ],
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    beats: [
      {
        ms: 8_000,
        genie: {
          at: 0.48,
          did: "Pinned the approved models and wired redaction before any fetch",
          month: "3 h of privacy review",
        },
        scene: "terminal",
        title: "The layer that is about other people's data, not your machine",
        lines: [
          { kind: "ask", text: "set up privacy for this project" },
          {
            kind: "out",
            text: "Approved-LLM gate: a private-list fetch refuses unless every model in the stack is approved",
          },
          {
            kind: "out",
            text: "PII redaction: names and addresses → N-a3f9d2, E-7c1b04 before a model sees them",
          },
          {
            kind: "note",
            text: "The mapping that reverses it stays on this machine and is never sent anywhere.",
          },
          {
            kind: "gate",
            text: "Record the approved model registry for this project?",
            answer: "y",
          },
          {
            kind: "note",
            text: "Sandboxes stop the wrong command. This stops the right command exporting someone else's mail.",
          },
        ],
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    beats: [
      {
        ms: 7_000,
        genie: {
          at: 0.46,
          did: "Drafted the security model and wired the tracker conventions",
          month: "5 h of policy-wrangling",
        },
        scene: "terminal",
        title: "Tell the security family what this project is",
        lines: [
          { kind: "ask", text: "prepare the security model for this project" },
          { kind: "out", text: "Read the code, the docs and 2 years of advisories" },
          {
            kind: "out",
            text: "Drafted: trust boundaries · what is in scope · what is not",
          },
          {
            kind: "gate",
            text: "Open a PR adding SECURITY.md and the tracker conventions?",
            answer: "y",
          },
          {
            kind: "note",
            text: "A written model is what lets the next report be routed without a meeting.",
          },
        ],
      },
    ],
  },
  {
    id: "import",
    label: "Import",
    beats: [
      {
        ms: 8_000,
        genie: {
          at: 0.48,
          did: "Read the list and opened both issues",
          month: "6 h of copy-paste",
        },
        scene: "terminal",
        title: "Ask for exactly the window you care about",
        lines: [
          {
            kind: "ask",
            text: "sync the security issues that arrived in the last 2 days",
          },
          { kind: "out", text: `${PROJECT.securityList} — 2 unimported reports` },
          {
            kind: "out",
            text: '  1. "path traversal in archive extractor"  — r.chen@example.com',
          },
          {
            kind: "out",
            text: '  2. "login page is slow"                   — anon@example.com',
          },
          {
            kind: "gate",
            text: `Open 2 issues in ${PROJECT.tracker}?`,
            answer: "y",
          },
          {
            kind: "note",
            text: "Opened #41 and #42. Identifiers are public; contents stay private.",
          },
        ],
      },
    ],
  },
  {
    id: "triage",
    label: "Triage",
    beats: [
      {
        ms: 10_000,
        genie: {
          at: 0.5,
          did: "Checked 148 past issues for duplicates",
          month: "9 h of searching",
        },
        scene: "terminal",
        title: "Classify, check the history, agree a disposition",
        lines: [
          { kind: "ask", text: "triage the two new reports" },
          { kind: "out", text: "#41 archive extractor — path traversal on member names" },
          { kind: "note", text: "Severity: high · CWE-22 · affects 3.0.0 – 3.2.0" },
          {
            kind: "note",
            text: "Related to #12 (fixed 2024) — different code path, not a duplicate.",
          },
          {
            kind: "out",
            text: "Team thread: 3 replies, disposition agreed — accept, fix in 3.2.1",
          },
          { kind: "out", text: "#42 login page is slow — no security impact" },
          {
            kind: "gate",
            text: "Close #42 as not-a-vulnerability, with a reply?",
            answer: "y",
          },
        ],
      },
      {
        ms: 7_000,
        genie: {
          at: 0.18,
          did: "Drafted the reply, with the history it just checked",
          month: "4 h of writing",
        },
        scene: "mail",
        title: "Reply to the reporter — written in an instant, sent by a human",
        fields: [
          { label: "To", value: PROJECT.reporter },
          { label: "From", value: PROJECT.securityList },
          { label: "Subject", value: "Re: path traversal in archive extractor" },
        ],
        body: [
          "Hello,",
          "",
          "Thank you for the report. We have confirmed the issue and are",
          "tracking it privately; it is not related to the 2024 report you",
          "may have seen, which touched a different code path.",
          "",
          "We will request a CVE and let you know before the advisory is",
          "published, so you can check the credit line reads the way you",
          "want it to.",
          "",
          "Please keep the details private until then.",
          "",
          `-- the ${PROJECT.name} security team`,
        ],
        gate: "Plain text, real links, no tracking. Magpie wrote it; you send it.",
      },
    ],
  },
  {
    id: "board",
    label: "Board",
    beats: [
      {
        ms: 6_000,
        scene: "board",
        title: "The same issue, on the tracker board",
        columns: BOARD_COLUMNS,
        cards: [
          {
            id: "#41",
            title: "Path traversal in archive extractor",
            severity: "high",
            from: 0,
            to: 2,
          },
          {
            id: "#42",
            title: "Login page is slow — closed, not a vulnerability",
            severity: "none",
            from: 0,
            to: 0,
            muted: true,
          },
        ],
        events: ["Triaged — severity high, assigned", "Picked up for a fix"],
      },
      {
        ms: 7_000,
        scene: "interlude",
        title: "…and the fix opens itself",
        did: "Opened the fix PR on a private branch, with the test that proves it",
        month: "7 h of fix-shepherding",
        card: {
          kind: "Pull request",
          id: `${PROJECT.org}/${PROJECT.repo}#${PROJECT.fixPr}`,
          title: "Normalise archive member paths before extraction",
          lines: [
            "+ 24  −3   src/extract.ts",
            "+ 61  −0   test/extract_traversal_test.ts",
            "private branch · linked to #41 · awaiting review",
          ],
        },
      },
      {
        ms: 6_000,
        scene: "board",
        title: "Reviewed, merged, released",
        columns: BOARD_COLUMNS,
        cards: [
          {
            id: "#41",
            title: "Path traversal in archive extractor",
            severity: "high",
            from: 2,
            to: 4,
          },
          {
            id: "#42",
            title: "Login page is slow — closed, not a vulnerability",
            severity: "none",
            from: 0,
            to: 0,
            muted: true,
          },
        ],
        events: [
          "Reviewed and merged",
          `${PROJECT.name} ${PROJECT.fixVersion} released`,
        ],
      },
    ],
  },
  {
    id: "learn",
    label: "Learn",
    beats: [
      {
        ms: 8_000,
        genie: {
          at: 0.46,
          did: "Turned two dispositions into a sharper security model",
          month: "4 h of model upkeep nobody ever gets to",
        },
        scene: "terminal",
        title: "The model learns from what you just decided",
        lines: [
          {
            kind: "ask",
            text: "update the security model with what we learned from #41 and #42",
          },
          { kind: "out", text: "Reading both dispositions and the fix that landed" },
          {
            kind: "note",
            text: "#41 accepted → archive extraction is now a named trust boundary",
          },
          {
            kind: "note",
            text: "#42 rejected → page latency is stated out of scope, so the next one routes itself",
          },
          {
            kind: "gate",
            text: "Open a PR updating SECURITY.md with both?",
            answer: "y",
          },
          {
            kind: "note",
            text: "Every report makes the model sharper instead of leaving it staler.",
          },
        ],
      },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    beats: [
      {
        ms: 8_000,
        genie: {
          at: 0.44,
          did: "Filled the CVE record from the issue and the fix",
          month: "3 h of form-filling",
        },
        scene: "vulnogram",
        title: "The CVE record",
        fields: [
          { label: "CVE ID", value: PROJECT.cve },
          { label: "Product", value: `${PROJECT.name} (${PROJECT.org})` },
          { label: "Affected", value: "3.0.0 – 3.2.0" },
          { label: "Fixed in", value: PROJECT.fixVersion },
          { label: "CWE", value: "CWE-22 — path traversal" },
          { label: "CVSS", value: "7.5 (high)" },
          { label: "Credit", value: "R. Chen" },
          { label: "References", value: `${PROJECT.org}/${PROJECT.repo}#${PROJECT.fixPr}` },
        ],
        gate: "Submit the record to the CVE program?",
      },
      {
        ms: 8_000,
        genie: {
          at: 0.18,
          did: "Drafted the advisory from the record and the fix",
          month: "3 h of writing",
        },
        scene: "mail",
        title: "Announce it — written in an instant, sent by a human",
        fields: [
          { label: "To", value: PROJECT.announceList },
          { label: "From", value: PROJECT.securityList },
          {
            label: "Subject",
            value: `[${PROJECT.cve}] Path traversal in ${PROJECT.name} archive extractor`,
          },
        ],
        body: [
          `${PROJECT.cve}: path traversal in the ${PROJECT.name} archive extractor`,
          "",
          "Severity: high (CVSS 7.5, CWE-22)",
          "Affected:  3.0.0 through 3.2.0",
          `Fixed in:  ${PROJECT.fixVersion}`,
          "",
          "An archive member name was joined to the extraction directory",
          "without normalisation, so a crafted archive could write outside",
          "it. Upgrade to 3.2.1. There is no workaround.",
          "",
          "Credit: R. Chen, who reported it privately and followed the",
          "embargo throughout.",
          "",
          `https://example.org/security/${PROJECT.cve}`,
        ],
        gate: "The last gate in the story — and a person is still the one pressing it.",
      },
      {
        ms: 6_000,
        genie: {
          at: 0.28,
          did: "Closed #41 — advisory out, nothing left to chase",
          month: "31 h across 12 reports",
        },
        scene: "board",
        title: "Closed — and off the board",
        columns: BOARD_COLUMNS,
        cards: [
          {
            id: "#41",
            title: "Path traversal in archive extractor — closed",
            severity: "high",
            from: 4,
            to: 4,
            exitAt: 0.45,
          },
          {
            id: "#42",
            title: "Login page is slow — closed, not a vulnerability",
            severity: "none",
            from: 0,
            to: 0,
            muted: true,
            exitAt: 0.6,
          },
        ],
        events: [
          `${PROJECT.cve} published — closing #41`,
          "Board clear. Nothing left open.",
        ],
      },
      {
        ms: 4_000,
        scene: "published",
        title: "Published",
        advisory: [
          { label: "ID", value: PROJECT.cve },
          { label: "Published", value: "2026-09-13" },
          { label: "Severity", value: "7.5 HIGH" },
          { label: "Weakness", value: "CWE-22" },
          { label: "Status", value: "Analyzed" },
        ],
        summary:
          "One report, one fix, one release, one advisory — and every message that left the project was written by Magpie and sent by a person.",
      },
    ],
  },
];

/**
 * The story as plain text, derived from the script above so it cannot drift
 * from what the animation shows. This is the accessible fallback: it is what a
 * screen reader, a search engine, and a reader with reduced motion or no
 * JavaScript get.
 */
export function transcript(): { chapter: string; lines: string[] }[] {
  return SCRIPT.map((chapter) => {
    const lines: string[] = [];
    for (const beat of chapter.beats) {
      lines.push(beat.title);
      if (beat.genie)
        lines.push(
          `Magpie did that: ${beat.genie.did} — ${beat.genie.month} last month.`,
        );
      switch (beat.scene) {
        case "terminal":
          for (const line of beat.lines) {
            if (line.kind === "cmd") lines.push(`$ ${line.text}`);
            else if (line.kind === "ask") lines.push(`You: ${line.text}`);
            else if (line.kind === "gate")
              lines.push(`${line.text} — answered "${line.answer}"`);
            else lines.push(line.text);
          }
          break;
        case "mail":
          for (const f of beat.fields) lines.push(`${f.label}: ${f.value}`);
          lines.push(...beat.body);
          lines.push(beat.gate);
          break;
        case "board":
          lines.push(`Columns: ${beat.columns.join(" → ")}`);
          for (const c of beat.cards)
            lines.push(
              `${c.id} ${c.title} — ${beat.columns[c.from]} to ${beat.columns[c.to]}`,
            );
          lines.push(...beat.events);
          break;
        case "vulnogram":
          for (const f of beat.fields) lines.push(`${f.label}: ${f.value}`);
          lines.push(beat.gate);
          break;
        case "interlude":
          lines.push(`${beat.did} — ${beat.month} last month.`);
          lines.push(`${beat.card.kind} ${beat.card.id}: ${beat.card.title}`);
          lines.push(...beat.card.lines);
          break;
        case "published":
          for (const f of beat.advisory) lines.push(`${f.label}: ${f.value}`);
          lines.push(beat.summary);
          break;
      }
    }
    return { chapter: chapter.label, lines };
  });
}
