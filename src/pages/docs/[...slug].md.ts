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

// Publishes a Markdown copy of every docs page next to the rendered one, so
// /docs/modes/ is also available as /docs/modes.md. An agent that wants the
// page then never has to parse the HTML. Astro emits these as static files, so
// no prebuild script or server is involved.

import type { APIRoute, GetStaticPaths } from "astro";
import { allDocs, docMarkdown, docSlug } from "../../lib/site";

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await allDocs();
  return docs.map((entry) => ({
    params: { slug: docSlug(entry) },
    props: { entry },
  }));
};

export const GET: APIRoute = ({ props }) => {
  return new Response(docMarkdown(props.entry), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Twins are alternates of the HTML page, not pages: keep them out of search results.
      "X-Robots-Tag": "noindex",
    },
  });
};
