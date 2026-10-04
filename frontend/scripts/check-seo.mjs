import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SITE_URL, publicPages } from '../src/seo.js';
import { JSDOM } from 'jsdom';
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const titles = new Set();
for (const page of publicPages) {
  const html = await readFile(`dist/${page.path === '/' ? 'index' : page.path.slice(1)}.html`, 'utf8');
  const document = new JSDOM(html).window.document;
  assert.equal(document.title, page.title);
  assert(!titles.has(page.title)); titles.add(page.title);
  assert.equal(document.querySelectorAll('h1').length, 1, page.path);
  assert.equal(document.querySelectorAll('meta[name="description"]').length, 1);
  assert.equal(document.querySelector('meta[name="description"]').content, page.description);
  assert.equal(document.querySelector('link[rel="canonical"]').href, SITE_URL + page.path);
  assert.equal(document.querySelector('meta[property="og:url"]').content, SITE_URL + page.path);
  assert.equal(document.querySelector('meta[name="robots"]').content, 'index,follow');
  assert(document.querySelector('#root').textContent.length > 400);
  assert(!html.includes('SearchAction'));
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => JSON.parse(script.textContent));
  assert(sitemap.includes(`<loc>${SITE_URL}${page.path}</loc>`));
  for (const link of document.querySelectorAll('a[href^="/"]')) assert(publicPages.some(p => p.path === link.getAttribute('href')) || ['/login','/register','/integrations','/changelog','/careers','/blog','/feedback','/review'].includes(link.getAttribute('href')), `Broken internal link: ${link.href}`);
}
for (const file of ['app', '404']) assert((await readFile(`dist/${file}.html`, 'utf8')).includes('noindex,follow'));
assert(!sitemap.includes('/groups/'));
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const resolveRoute = path => config.routes.find(route => route.src && !route.continue && new RegExp(`^${route.src}$`).test(path));
for (const page of publicPages.filter(page => page.path !== '/')) assert.equal(resolveRoute(page.path).dest, '/$1.html');
for (const path of ['/login', '/reset-password', '/group-invite', '/groups/42/sections/7', '/users/42', '/dashboard', '/profile', '/activity']) {
  assert.equal(resolveRoute(path).dest, '/app.html');
  assert.equal(resolveRoute(path).headers['X-Robots-Tag'], 'noindex, follow');
}
assert.equal(resolveRoute('/nonexistent-page').status, 404);
console.log(`SEO checks passed for ${publicPages.length} public pages and private/404 shells.`);
