# Apache Training module: Building and running AI agents for open-source projects

Rendered page: https://magpie.apache.org/docs/education/training/readme/

Source: https://github.com/apache/magpie/blob/main/docs/education/training/README.md

<!-- SPDX-License-Identifier: Apache-2.0
     https://www.apache.org/licenses/LICENSE-2.0 -->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Apache Training module: Building and running AI agents for open-source projects](#apache-training-module-building-and-running-ai-agents-for-open-source-projects)
  - [Who this is for](#who-this-is-for)
  - [Relationship to the source pages](#relationship-to-the-source-pages)
  - [Module map](#module-map)
  - [Delivery formats](#delivery-formats)
  - [Prerequisites](#prerequisites)
  - [Placeholders](#placeholders)
  - [Learn with an AI tutor](#learn-with-an-ai-tutor)
  - [Licence](#licence)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This directory packages the [maintainer-education stream](/docs/education/readme) as a
reusable, LMS-neutral **Apache Training module**. Any project — ASF or not —
can use it to *teach* the material in a structured course, not just circulate
the pages as reading. It is shaped for upstream contribution to
[Apache Training](https://training.apache.org/) so the module can live there
once it is stable.

## Who this is for

Instructors and facilitators running the education stream as a course:
workshops, on-boarding sessions, reading groups, self-paced curricula, or any
environment where learners need per-lesson structure (objectives, exercises,
assessment) in addition to the reference pages.

Learners using the module self-paced do not need an LMS. Every lesson is a
plain Markdown file: read it, work through the exercises, and answer the
self-check questions before moving on.

## Relationship to the source pages

Each lesson in this module is a **wrapper** around one or more
[progression pages](/docs/education/readme). The source pages are the canonical
reference; the lessons add LMS-friendly structure on top:

- **Learning objectives** — what a learner will be able to *do* after the
  lesson, written as observable, assessable outcomes.
- **Exercises** — hands-on activities a learner can complete without access
  to a live system (paper/whiteboard activities use the page's own examples).
- **Self-check** — short questions (and answers) the learner uses to gate
  themselves before moving to the next lesson.

Nothing in this directory duplicates the reference material; it only frames it.

## Module map

| Lesson | Source page | Learning time |
|---|---|---|
| [Lesson 1 — What agents are](/docs/education/training/lesson-01-what-agents-are) | [What agents are](/docs/education/what-agents-are) | ~30 min |
| [Lesson 2 — Working with agents](/docs/education/training/lesson-02-working-with-agents) | [Working with agents](/docs/education/working-with-agents) | ~30 min |
| [Lesson 3 — Choosing models](/docs/education/training/lesson-03-choosing-models) | [Choosing models](/docs/education/choosing-models) | ~35 min |
| [Lesson 4 — Your first skill](/docs/education/training/lesson-04-your-first-skill) | [Your first skill](/docs/education/your-first-skill) | ~60 min |
| [Lesson 5 — Writing safe skills](/docs/education/training/lesson-05-writing-safe-skills) | [Writing safe skills](/docs/education/writing-safe-skills) | ~45 min |
| [Lesson 6 — Debugging a skill](/docs/education/training/lesson-06-debugging-a-skill) | [Debugging a skill](/docs/education/debugging-skills) | ~50 min |
| [Lesson 7 — Writing portable skills](/docs/education/training/lesson-07-writing-portable-skills) | [Writing portable skills](/docs/education/portable-skills) | ~35 min |
| [Lesson 8 — Eval-driven development](/docs/education/training/lesson-08-eval-driven-development) | [Eval-driven development](/docs/education/eval-driven-development) | ~60 min |
| [Lesson 9 — Agentic and autonomous work](/docs/education/training/lesson-09-agentic-and-autonomous-work) | [Agentic and autonomous work](/docs/education/agentic-work) | ~45 min |
| [Lesson 10 — English as a programming language](/docs/education/training/lesson-10-english-as-a-programming-language) | [English as a programming language](/docs/education/english-as-code) | ~30 min |
| [Lesson 11 — How to contribute](/docs/education/training/lesson-11-how-to-contribute) | [How to contribute](/docs/education/contributing) | ~30 min |
| [Hands-on lab](/docs/education/training/lesson-lab-tutorials) | [Tutorial: build and evaluate a skill](/docs/education/tutorials) | ~90 min |

## Delivery formats

**Self-paced.** Learners read the source page, then work through the lesson
wrapper (objectives, exercises, self-check) on their own. No instructor or LMS
needed.

**Instructor-led.** An instructor presents the key ideas from the source page,
assigns the exercises to pairs or small groups, and uses the self-check
questions for a brief group debrief before moving on. The facilitator guide
([`instructor-guide.md`](/docs/education/training/instructor-guide)) covers room setup, timing, and group discussion
prompts.

**LMS upload.** Each lesson is a Markdown file that can be converted to SCORM,
xAPI, or any other format a specific LMS supports. The module does not assume
any particular LMS. Learning time estimates above are rough guides for LMS
credit-hour tagging.

## Prerequisites

No prior AI experience. Learners should be comfortable reading and writing
plain text, and familiar with the idea of a software project that uses version
control. Specific technical prerequisites are stated in each lesson.

## Placeholders

Exercises use `<PROJECT>` wherever a real project name would appear.
Substitute your own project name when working through the activities.

## Learn with an AI tutor

Each lesson in the module map above has a matching AI tutor prompt in
[`ai-tutors/`](https://github.com/apache/magpie/blob/main/ai-tutors/README.md). Load one into any capable chat
model and it teaches that lesson interactively — working through the
objectives, exercises, and self-check questions one step at a time.

**How to load a tutor:** open the matching `lesson-*.md` file under `ai-tutors/`,
find the `---` separator, and paste everything below that line as the system
prompt. The notes above the separator are for you; only the content below goes
to the model. See [`ai-tutors/README.md`](https://github.com/apache/magpie/blob/main/ai-tutors/README.md) for
tool-by-tool instructions (claude.ai Projects, Open WebUI, API).

These prompts are companions to the lesson wrappers, not a replacement for the
source pages or in-person instruction.

## Licence

Apache License 2.0 (PRINCIPLE 17). Contributions carry a `Generated-by:` note
in their commit message following ASF Generative Tooling Guidance.
