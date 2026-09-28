import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import ts from 'typescript';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readTree, fail } from './files.mjs';

// Runtime-produced names are finite contracts, colocated with their producer.
// This is deliberately not a prefix safelist: a new t-unused class must fail.
export const runtimeClasses = new Set(['t-prompt', 't-muted', 't-result', 't-gate',
  'doc-callout', 'doc-callout-title', 'doc-callout-note', 'doc-callout-tip',
  'doc-callout-important', 'doc-callout-warning', 'doc-callout-caution']);

export function sourceTokens(sources) {
  const tokens = new Set(runtimeClasses);
  for (const [file, source] of sources) {
    if (!/\.(astro|tsx?|jsx?|mjs|json)$/.test(file)) continue;
    const text = source.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '').replace(/<!--[^]*?-->/g, '');
    // Lucide's rendered root class is supplied by the imported component,
    // rather than an authored className. Only this exact class is generated.
    if (/\bfrom\s*["']lucide-react["']/.test(text)) tokens.add('lucide');
    const add = value => { for (const token of value.match(/[\w-]+/g) ?? []) tokens.add(token); };
    if (file.endsWith('.astro')) add(text); // Astro expressions, markup and inline scripts.
    else {
      const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = node => { if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) add(node.text); ts.forEachChild(node, visit); };
      visit(ast);
    }
  }
  return tokens;
}

export function auditStyles(sheets, tokens) {
  const errors = [], seen = new Map();
  const allCss = [...sheets.values()].join('\n');
  for (const [file, css] of sheets) {
    const root = postcss.parse(css, { from: file });
    root.walkAtRules(/keyframes$/, rule => {
      const used = new RegExp(`(?:animation(?:-name)?\\s*:[^;{}]*\\b)${rule.params}\\b`).test(allCss) || tokens.has(rule.params);
      if (!used) errors.push(`${file}:${rule.source.start.line}: orphan animation ${rule.params}`);
    });
    root.walkRules(rule => {
      if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
      let context = file.includes('#style') ? file : '';
      for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) if (parent.type === 'atrule') context += `|@${parent.name} ${parent.params.replace(/\s+/g, '')}`;
      selectorParser(selectors => {
        selectors.each(selector => {
          const canonical = selector.toString().trim().replace(/\s*([>+~,])\s*/g, '$1').replace(/\s+/g, ' ');
          selector.walkClasses(node => {
            // Negations may describe absence. All positive classes need evidence.
            let negated = false;
            for (let p = node.parent; p; p = p.parent) if (p.type === 'pseudo' && p.value === ':not') negated = true;
            if (!negated && !tokens.has(node.value)) errors.push(`${file}:${rule.source.start.line}: orphan class .${node.value} in ${canonical}`);
          });
          selector.walkIds(node => {
            if (!tokens.has(node.value)) errors.push(`${file}:${rule.source.start.line}: orphan id #${node.value}`);
          });
          for (const decl of rule.nodes.filter(n => n.type === 'decl')) {
            const key = `${context}|${canonical}|${decl.prop}`;
            if (seen.has(key)) errors.push(`${file}:${decl.source.start.line}: duplicate ${decl.prop} for ${canonical}; first at ${seen.get(key)}`);
            else seen.set(key, `${file}:${decl.source.start.line}`);
          }
        });
      }).processSync(rule.selector);
    });
  }
  return [...new Set(errors)];
}

export async function checkStyles() {
  const sources = await readTree('src', p => !p.includes('/content/docs/') && /\.(css|astro|tsx?|jsx?)$/.test(p));
  const sheets = new Map([...sources].filter(([file]) => file.endsWith('.css')));
  for (const [file, text] of sources) if (file.endsWith('.astro')) {
    let index = 0;
    for (const match of text.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)) sheets.set(`${file}${match[1].includes('is:global') ? '#global' : '#style'}${index++}`, match[2]);
  }
  const errors = auditStyles(sheets, sourceTokens(sources));
  fail(errors, 'Styles');
  console.log(`Styles: ${sheets.size} authored stylesheets; no orphan classes or repeated selector/property declarations.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await checkStyles();
