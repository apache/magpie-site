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

// An llmstxt.org index, generated from the same docs collection the site
// renders, so it cannot drift from the sidebar. Links are absolute and the
// generated section sits under an H2: an llms.txt has exactly one H1.

import type { APIRoute } from "astro";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SOURCE_REPO,
  SITE_REPO,
  DEV_LIST,
  STATIC_ROUTES,
  allDocs,
  docHtmlPath,
  docMarkdownPath,
  docTitle,
} from "../lib/site";

const HEADER = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Apache Magpie is a set of agent skills (recipes) that maintainers run inside
their own agent harness: Claude Code, Codex, Copilot, Gemini, Cursor and
others. It is not a hosted service. There is no HTTP API, no OpenAPI spec and
nothing to call on this domain; integrate by installing the skills from the
source repository, or through an agent marketplace.

- Source repository: ${SOURCE_REPO}
- Agent contract for the source tree: ${SOURCE_REPO}/blob/main/AGENTS.md
- Contributing: ${SOURCE_REPO}/blob/main/CONTRIBUTING.md
- Website source: ${SITE_REPO}
- Developer mailing list: ${DEV_LIST} (archive: https://lists.apache.org/list.html?${DEV_LIST})

Every documentation page has a Markdown twin at the same path with a \`.md\`
suffix in place of the trailing slash, for example
${SITE_URL}/docs/modes/ is also ${SITE_URL}/docs/modes.md. HTML pages advertise
their twin with \`<link rel="alternate" type="text/markdown">\`. Prefer the
twin: it is the synced source with no navigation.
`;

export const GET: APIRoute = async () => {
  const docs = await allDocs();

  const pages = STATIC_ROUTES.map(
    (r) => `- [${r.title}](${SITE_URL}${r.path}): ${r.description}`,
  );

  const docLines = docs.map((entry) => {
    const desc = entry.data.description ? `: ${entry.data.description}` : "";
    return `- [${docTitle(entry)}](${SITE_URL}${docMarkdownPath(entry)})${desc} (rendered: ${SITE_URL}${docHtmlPath(entry)})`;
  });

  const body = [
    HEADER,
    "## Site",
    "",
    ...pages,
    "",
    "## Documentation",
    "",
    ...docLines,
    "",
    "## Optional",
    "",
    `- [Full documentation in one file](${SITE_URL}/llms-full.txt): every docs page concatenated, for agents that want one fetch.`,
    `- [Sitemap](${SITE_URL}/sitemap-index.xml)`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
