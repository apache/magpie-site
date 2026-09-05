/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { getCollection, type CollectionEntry } from "astro:content";

export const SITE_URL = "https://magpie.apache.org";
export const SITE_NAME = "Apache Magpie";
export const SITE_DESCRIPTION =
  "AI-powered assistant for open-source maintainers. Triage, mentor, draft, pair, and auto-merge under Apache Software Foundation governance.";
export const SOURCE_REPO = "https://github.com/apache/magpie";
export const SITE_REPO = "https://github.com/apache/magpie-site";
export const DEV_LIST = "dev@magpie.apache.org";

/**
 * Hand-written routes that no collection knows about. The sitemap integration
 * discovers pages from src/pages, so these only need listing for llms.txt.
 * Keep the descriptions to one line: agents read them verbatim.
 */
export const STATIC_ROUTES: { path: string; title: string; description: string }[] = [
  { path: "/", title: "Home", description: "What Magpie is, the five agentic modes, and the ten skill families." },
  { path: "/docs/", title: "Documentation", description: "Setup, skill families, education stream, principles and RFCs." },
  { path: "/architecture/", title: "Architecture", description: "Organizations, tools and capability contracts behind vendor neutrality." },
  { path: "/tools/", title: "Tools", description: "The adapters that fulfil each capability, and which vendors each supports." },
  { path: "/downloads/", title: "Downloads", description: "Signed release artifacts and how to verify them." },
  { path: "/brand/", title: "Brand assets", description: "Logos, wordmark and usage rules for the Apache Magpie trademark." },
];

/**
 * Internal governance drafts that are in the synced collection but must not
 * appear on the public site. src/pages/docs/[...slug].astro, llms.txt and the
 * Markdown twins all filter on this one set.
 */
export const HIDDEN_DOCS = new Set(["board-resolution-draft"]);

export type DocEntry = CollectionEntry<"docs">;

/** Entry id with any trailing .md removed, as the docs page uses for its slug. */
export function docSlug(entry: DocEntry): string {
  return entry.id.replace(/\.md$/, "");
}

/** Path of the rendered HTML page, exactly as src/pages/docs/[...slug].astro emits it. */
export function docHtmlPath(entry: DocEntry): string {
  return `/docs/${docSlug(entry)}/`;
}

/** Path of the synced file relative to apache/magpie/docs, original case preserved. */
export function docRelPath(entry: DocEntry): string {
  return entry.filePath ? entry.filePath.replace(/^.*\/content\/docs\//, "") : `${docSlug(entry)}.md`;
}

/** Upstream file the page was synced from, so agents can read or edit the source. */
export function docSourceUrl(entry: DocEntry): string {
  return `${SOURCE_REPO}/blob/main/docs/${docRelPath(entry)}`;
}

/** The body's first "# heading", wherever it sits: synced files open with a licence comment and a TOC. */
function leadingHeading(body: string): string | undefined {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : undefined;
}

/**
 * Display title: frontmatter, else the body's opening H1, else the same
 * dash-to-space fallback the docs page uses.
 */
export function docTitle(entry: DocEntry): string {
  return (
    entry.data.title ??
    leadingHeading(entry.body ?? "") ??
    docSlug(entry).split("/").pop()!.replace(/-/g, " ")
  );
}

/** Public docs entries in stable order. */
export async function allDocs(): Promise<DocEntry[]> {
  const entries = await getCollection("docs", (e) => !HIDDEN_DOCS.has(docSlug(e)));
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}


