import { allDocs, docTitle, docSlug } from '../lib/site';
export const prerender = true;
export async function GET() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const docs = await allDocs();
  return new Response(JSON.stringify([{ title: "Install Magpie", path: `${base}/start`, section: "Getting started", text: "Get started with Claude Code, Codex CLI, Gemini CLI, Cursor or GitHub Copilot. Install and set up your workspace, then try a pull request review." }, ...docs.map(entry => ({
    title: docTitle(entry),
    path: `${base}/docs/${docSlug(entry)}`,
    section: docSlug(entry).includes('/') ? docSlug(entry).split('/')[0].replaceAll('-', ' ') : 'Getting started',
    text: (entry.body ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '').replace(/[#*`|<>]/g, ' ').replace(/\s+/g, ' ').slice(0, 22000),
  }))]), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
