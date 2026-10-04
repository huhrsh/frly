import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { SITE_URL, publicPages, schemaFor } from '../src/seo.js';
const template = await readFile('dist/index.html', 'utf8');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function htmlFor(page, body, indexable) {
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(/<meta\s+(?:name="(?:description|robots|twitter:[^"]*)"|property="og:[^"]*")[\s\S]*?\/>/g, '')
    .replace(/<link rel="canonical"[^>]*\/>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const url = `${SITE_URL}${page.path}`;
  const head = `<meta name="description" content="${escape(page.description)}"/><meta name="robots" content="${indexable ? 'index,follow' : 'noindex,follow'}"/><link rel="canonical" href="${url}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="Fryly"/><meta property="og:title" content="${escape(page.title)}"/><meta property="og:description" content="${escape(page.description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${SITE_URL}/teamwork.png"/><meta name="twitter:card" content="summary"/><meta name="twitter:title" content="${escape(page.title)}"/><meta name="twitter:description" content="${escape(page.description)}"/><meta name="twitter:image" content="${SITE_URL}/teamwork.png"/>${indexable ? `<script type="application/ld+json">${JSON.stringify(schemaFor(page)).replaceAll('<', '\\u003c')}</script>` : ''}`;
  return html.replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}
// A separate shell prevents private routes receiving homepage content or indexable metadata.
await writeFile('dist/app.html', htmlFor({ path: '/login', title: 'Fryly', description: 'Sign in to organise your group.' }, '', false));
await writeFile('dist/404.html', htmlFor({ path: '/404', title: 'Page not found | Fryly', description: 'This page could not be found.' }, '<main><h1>Page not found</h1><a href="/">Return to Fryly</a></main>', false));
const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render } = await server.ssrLoadModule('/src/entry-seo.jsx');
  for (const page of publicPages) await writeFile(`dist/${page.path === '/' ? 'index' : page.path.slice(1)}.html`, htmlFor(page, render(page.path), true));
} finally { await server.close(); }
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map(page => `<url><loc>${SITE_URL}${page.path}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
await writeFile('dist/llms.txt', `# Fryly\n\nA group collaboration app for shared notes, checklists and expense records. Settlements do not transfer money.\n\n${publicPages.map(page => `- [${page.title}](${SITE_URL}${page.path}): ${page.description}`).join('\n')}\n`);
console.log(`Prerendered ${publicPages.length} public pages.`);
