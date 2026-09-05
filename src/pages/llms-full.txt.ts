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

// Every docs page concatenated, in sidebar order, separated by a rule. This is
// the same text the .md twins serve; agents that want one fetch use this one.

import type { APIRoute } from "astro";
import { SITE_NAME, SITE_URL, allDocs, docMarkdown } from "../lib/site";

export const GET: APIRoute = async () => {
  const docs = await allDocs();
  const body = [
    `# ${SITE_NAME} — full documentation`,
    "",
    `Index: ${SITE_URL}/llms.txt`,
    "",
    ...docs.map((entry) => `---\n\n${docMarkdown(entry)}`),
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
