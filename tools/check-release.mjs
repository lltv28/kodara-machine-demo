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
assert.match(renderer, /var PLAYER_MODE=document\.documentElement\.classList\.contains\('player-mode'\)/, 'Reduced motion must work inside independent demo players');
assert.match(renderer, /if\(REDUCE && PLAYER_MODE\)\{ window\.renderCaptureFrame\(chapter,chapter==='triagers'\?\.94:1\);send\('ready'\);return; \}/, 'Reduced-motion players must settle on a useful chapter end state');
assert.match(renderer, /renderTriagerScrollActivity\(state\.triagerActivityProgress,\(!REDUCE \|\| PLAYER_MODE\) && state\.phase==='triagers'\)/, 'Reduced-motion Triager players must keep their completed conversation visible');
assert.match(renderer, /zoomRange\(local,0,\.25\)/, 'Graph milestones need a 1.5-second hold in the eight-second loop');
assert.match(renderer, /if\(p>=\.70\)/, 'The learning result needs a 1.5-second hold in the five-second loop');
assert.match(page, /class="card primary-demo"/, 'Primary demo must follow the authority proof');
assert.match(page, /class="primary-demo-copy"/, 'Primary demo needs page-owned sales copy');
assert.match(page, /class="primary-demo-visual"[^>]*data-demo-slot/, 'Primary demo needs a stable visual integration slot');
assert.doesNotMatch(page, /class="card video-story"/, 'Old four-demo story must be removed');
assert.doesNotMatch(page, /class="video-chapter"/, 'Old independent demo chapters must be removed');
assert.match(page, /class="card founder-letter"/, 'Founder letter must follow the primary demo');
assert.match(page, /class="founder-letter-copy" data-letter-copy/, 'Founder letter needs a measurable reading body');
assert.match(page, /class="card mechanism-features"/, 'Mechanism features must follow the founder letter');
assert.ok(page.indexOf('class="card founder-letter"') < page.indexOf('class="card mid-cta"'), 'Founder letter must precede its CTA');
assert.ok(page.indexOf('class="card mid-cta"') < page.indexOf('class="card mechanism-features"'), 'Letter CTA must precede mechanism features');

const letterMatch = page.match(/class="founder-letter-copy" data-letter-copy>([\s\S]*?)<\/div>/);
assert.ok(letterMatch, 'Expected founder letter copy');
const letterWords = letterMatch[1].replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean);
assert.ok(letterWords.length >= 450 && letterWords.length <= 600, `Founder letter has ${letterWords.length} words; expected 450-600`);

const mechanismFeatures = page.match(/class="mechanism-feature"/g) ?? [];
assert.equal(mechanismFeatures.length, 3, `Expected three mechanism features, found ${mechanismFeatures.length}`);
const mechanismPlaceholders = page.match(/data-placeholder="mechanism"/g) ?? [];
assert.equal(mechanismPlaceholders.length, 3, 'Every mechanism feature needs a stable placeholder');

const h1s = page.match(/<h1\b/g) ?? [];
assert.equal(h1s.length, 1, `Expected one h1, found ${h1s.length}`);
assert.match(page, /<h1[^>]*>[^<]*done-for-you AI sales department/i, 'Primary demo H1 must state the offer');

const iframes = [...page.matchAll(/<iframe\b[^>]*>/g)].map((match) => match[0]);
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
