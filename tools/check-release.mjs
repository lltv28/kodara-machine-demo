import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const pagePath = resolve(root, 'index.html');
const rendererPath = resolve(root, 'tools/video-capture.html');
const page = readFileSync(pagePath, 'utf8');
const renderer = readFileSync(rendererPath, 'utf8');

const budgets = new Map([
  [pagePath, 140 * 1024],
  [rendererPath, 205 * 1024],
]);

for (const [path, maximum] of budgets) {
  const bytes = statSync(path).size;
  assert.ok(bytes <= maximum, `${path} is ${bytes} bytes; budget is ${maximum}`);
}

assert.match(page, /--measure-display:/, 'Missing semantic display measure');
assert.match(page, /--measure-body:/, 'Missing semantic body measure');
assert.match(page, /text-wrap:balance/, 'Headlines must use balanced wrapping');
assert.match(page, /text-wrap:pretty/, 'Body copy must use pretty wrapping');
assert.match(page, /scroll-padding-bottom:/, 'Mobile focus must clear the sticky CTA');
assert.match(page, /\.proof-more summary:focus-visible/, 'Disclosure controls need a visible focus state');
assert.match(page, /prefers-reduced-motion:reduce/, 'The landing page must honor reduced motion');
assert.match(renderer, /prefers-reduced-motion:reduce/, 'The demo renderer must honor reduced motion');
assert.match(page, /function loadFrame\(/, 'Demo renderers need a viewport-driven loader');
assert.match(page, /rootMargin:'600px 0px'/, 'Demo renderers must preload shortly before entering view');

const h1s = page.match(/<h1\b/g) ?? [];
assert.equal(h1s.length, 1, `Expected one h1, found ${h1s.length}`);

const iframes = [...page.matchAll(/<iframe\b[^>]*>/g)].map((match) => match[0]);
assert.ok(iframes.length > 0, 'Expected demo iframes');
assert.ok(iframes.every((tag) => /\btitle="[^"]+"/.test(tag)), 'Every iframe needs a useful title');
assert.ok(iframes.filter((tag) => /loading="eager"/.test(tag)).length <= 1, 'Only one iframe may load eagerly');

const wistiaPlayers = [...page.matchAll(/<wistia-player\b[^>]*>/g)].map((match) => match[0]);
assert.ok(wistiaPlayers.length > 0, 'Expected testimonial players');
assert.ok(wistiaPlayers.every((tag) => /\baria-label="[^"]+"/.test(tag)), 'Every testimonial player needs an accessible name');

const ctaLinks = [...page.matchAll(/<a\b[^>]*class="[^"]*cta-btn[^"]*"[^>]*>/g)].map((match) => match[0]);
assert.ok(ctaLinks.length > 0, 'Expected application links');
assert.ok(ctaLinks.every((tag) => /href="https:\/\/app\.iclosed\.io\/e\/kodara\/strategy-call"/.test(tag)), 'Every CTA must use the live scheduler');
assert.ok(ctaLinks.every((tag) => /target="_blank"/.test(tag) && /rel="noopener"/.test(tag)), 'External CTA links must open safely');

const localReferences = [...page.matchAll(/\b(?:src|data-src)="([^"]+)"/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'))
  .filter((reference) => !/^(?:data:|https?:|\/\/)/.test(reference))
  .map((reference) => reference.split(/[?#]/)[0]);
for (const reference of localReferences) {
  assert.ok(existsSync(resolve(root, reference)), `Missing local page asset: ${reference}`);
}

console.log('Release checks passed.');
