import { chmod, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, transformWithEsbuild } from 'vite';

const dist = resolve('dist');
const output = resolve(process.argv[2] || 'dist/tusk-preview.html');
const artwork = `data:image/png;base64,${(await readFile(resolve(dist, 'tusk-home.png'))).toString('base64')}`;
const favicon = `data:image/svg+xml;base64,${(await readFile(resolve(dist, 'favicon.svg'))).toString('base64')}`;
let html = await readFile(resolve(dist, 'index.html'), 'utf8');

// Render the actual Today components, without reading any saved user records.
// File viewers may block scripts, so the document must contain visible content
// before the interactive app starts. React replaces this preview when it runs.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let preview;
try {
  const { LifeNav, LifeWorkspace } = await server.ssrLoadModule('/components/life/LifeWorkspace.jsx');
  preview = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(LifeNav, { view: 'today', navigate: () => {} }),
    React.createElement(LifeWorkspace, { view: 'today', navigate: () => {} }),
  ));
} finally {
  await server.close();
}
preview = preview.replaceAll('src="/tusk-home.png"', `src="${artwork}"`)
  .replace(/<button\b/g, '<button disabled');
html = html.replace('<div id="root"></div>', () => `<div id="root"><div data-tusk-static-preview><p class="preview-note">Design preview · Download this file and open it in your browser to use the planner.</p>${preview}</div></div>`);

const scripts = [];

for (const match of [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]) {
  const code = (await readFile(resolve(dist, match[1].replace(/^\//, '')), 'utf8'))
    .replaceAll('"/tusk-home.png"', 'tuskArtwork');
  // A classic script also runs in viewers that allow scripts but not modules.
  const transformed = await transformWithEsbuild(code, 'tusk-preview.js', { format: 'iife', target: 'es2020' });
  scripts.push(transformed.code);
  html = html.replace(match[0], '');
}
for (const match of [...html.matchAll(/<link\b(?=[^>]*\brel="stylesheet")[^>]*\bhref="([^"]+)"[^>]*>/g)]) {
  const css = await readFile(resolve(dist, match[1].replace(/^\//, '')), 'utf8');
  html = html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
}
html = html.replaceAll('href="/favicon.svg"', `href="${favicon}"`);
html = html.replace('</head>', `<style>.preview-note{padding:12px 20px;background:#e7e2d7;color:#263247;font:14px/1.5 system-ui;text-align:center} [data-tusk-static-preview] button:disabled{opacity:1;cursor:default}</style></head>`);
// Sandboxed viewers can allow scripts while denying browser storage. Leave the
// read-only design visible in that case rather than replacing it with an error.
const bootstrap = `(() => {
  try { window.localStorage.getItem('tusk-data'); } catch { return; }
  const tuskArtwork = document.querySelector('[data-tusk-static-preview] .life-hero img').src;
  ${scripts.join('\n')}
})();`.replace(/<\/script/gi, '<\\/script');
html = html.replace('</body>', () => `<script>${bootstrap}</script></body>`);
await writeFile(output, html);
await chmod(output, 0o644);
console.log(`Saved Tusk preview with a script-free design and interactive browser app: ${output}`);
