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
assert.match(page, /--space-1:4\.6px;--space-2:9\.2px;--space-3:13\.8px;--space-4:18\.4px;--space-5:27\.6px;--space-6:36\.8px;--space-7:55\.2px/, 'Internal spacing tiers must retain the approved 15% increase');
assert.match(page, /--space-8:72px;--space-9:96px/, 'Large section spacing must remain unchanged');
assert.match(page, /--type-body:1\.5rem/, 'Desktop body typography must retain the approved 20% increase');
assert.match(page, /@media\(max-width:720px\)[\s\S]*--type-body:1\.35rem/, 'Mobile body typography must retain the approved 20% increase');
assert.match(page, /--type-section:clamp\(3\.6rem,3\.252rem \+ 1\.416vw,4\.5rem\)/, 'Section typography must retain the approved 20% increase');
assert.match(page, /--type-control:1\.2rem;--type-button:1\.8rem;--type-label:1\.2rem;--type-meta:1\.2rem;--type-legal:1\.125rem/, 'Small typography tiers must retain their approved increases');
assert.match(page, /--type-button:1\.8rem/, 'CTA typography must retain the approved 1.8rem size');
assert.match(page, /\.cta-btn\{[^}]*display:flex;[^}]*width:max-content;[^}]*font-weight:700;[^}]*font-size:var\(--type-button\)[^}]*text-transform:capitalize/, 'CTA buttons must use their own line, bold type, and Capitalize Case');
assert.match(page, /\.cta-btn\{[^}]*padding:12\.65px var\(--space-6\)/, 'Desktop CTA buttons must retain the approved horizontal padding');
assert.match(page, /@media\(max-width:720px\)[\s\S]*\.cta-btn\{padding-inline:var\(--space-4\)\}/, 'Mobile CTA buttons must use responsive horizontal padding');
assert.match(page, /\.mid-cta-inner\{[^}]*flex-direction:column/, 'Mid-page CTA button must remain on its own line');
assert.match(page, /\.primary-demo h1\{[^}]*font-size:clamp\(3\.3rem,4\.8vw,3\.6rem\)/, 'Hero typography must retain the approved 20% increase');
assert.match(page, /--type-stat:clamp\(5\.1rem,9\.6vw,7\.8rem\)/, 'Stat typography must retain the approved 20% increase');
assert.match(page, /\.proof-stat\{[^}]*font-size:var\(--type-stat\)/, 'Proof stats must consume the semantic stat tier');
assert.match(page, /\.proof-card blockquote::before\{[^}]*font-size:5\.4rem/, 'Quote marks must retain the approved 20% increase');
assert.match(page, /\.faq-item summary::after\{[^}]*font-size:1\.8rem/, 'FAQ controls must retain the approved 20% increase');
assert.match(page, /--bg:#F6F6F7;--surface:var\(--bg\)/, 'Neutral surfaces must use one cool-gray token');
assert.match(page, /--border-subtle:rgba\(26,26,26,\.06\)/, 'Missing WL-aligned subtle border token');
assert.match(page, /--border-default:rgba\(26,26,26,\.09\)/, 'Missing WL-aligned default border token');
assert.match(page, /--border-accent:rgba\(46,125,82,\.20\)/, 'Missing green accent border token');
assert.doesNotMatch(page, /--accent-soft:/, 'Pale green section fills must not return');
assert.match(page, /--radius-sm:8px/, 'Compact surfaces need the 8px radius tier');
assert.match(page, /--radius:16px;--radius-lg:16px/, 'Support surfaces need the 16px radius tier');
assert.match(page, /--radius-xl:24px/, 'Featured surfaces need the 24px radius tier');
assert.match(page, /--radius-pill:9999px/, 'Avatars and pill controls need a semantic full-radius token');
assert.match(page, /--shadow-md:0 12px 32px rgba\(7,94,63,\.06\),0 2px 6px rgba\(26,26,26,\.04\)/, 'Featured surfaces need the layered green-tinted shadow');
assert.match(page, /<meta name="description" content="[^"]+">/, 'Landing page needs a search and share description');
assert.match(page, /<link rel="icon" href="assets\/favicon\.svg"/, 'Landing page needs a local favicon');
assert.match(page, /--measure-body:/, 'Missing semantic body measure');
assert.match(page, /text-wrap:balance/, 'Headlines must use balanced wrapping');
assert.match(page, /text-wrap:pretty/, 'Body copy must use pretty wrapping');
assert.match(page, /\.proof-more summary:focus-visible/, 'Disclosure controls need a visible focus state');
assert.match(page, /prefers-reduced-motion:reduce/, 'The landing page must honor reduced motion');
assert.match(page, /prefers-reduced-transparency:reduce/, 'Glassy demo surfaces need an opaque accessibility fallback');
assert.match(page, /\.primary-demo-placeholder\{[^}]*backdrop-filter:blur\(8px\)/, 'Glass treatment must stay scoped to the primary demo placeholder');
assert.match(page, /\.primary-demo,\.founder-highlight,\.case-featured--portrait,\.cta\{border-radius:var\(--radius-xl\)\}/, 'Featured surfaces need an explicit 24px role');
assert.match(page, /\.cta\{[^}]*background:var\(--accent-dark\)[^}]*color:#fff/, 'Closing CTA must remain the single deep-green color block');
assert.match(page, /\.cta \.cta-btn\{[^}]*color:var\(--accent-dark\)[^}]*background:#fff/, 'Closing CTA button must keep high contrast');
assert.match(renderer, /prefers-reduced-motion:reduce/, 'The demo renderer must honor reduced motion');
assert.match(renderer, /var PLAYER_MODE=document\.documentElement\.classList\.contains\('player-mode'\)/, 'Reduced motion must work inside independent demo players');
assert.match(renderer, /if\(REDUCE && PLAYER_MODE\)\{ window\.renderCaptureFrame\(chapter,chapter==='triagers'\?\.94:1\);send\('ready'\);return; \}/, 'Reduced-motion players must settle on a useful chapter end state');
assert.match(renderer, /renderTriagerScrollActivity\(state\.triagerActivityProgress,\(!REDUCE \|\| PLAYER_MODE\) && state\.phase==='triagers'\)/, 'Reduced-motion Triager players must keep their completed conversation visible');
assert.match(renderer, /zoomRange\(local,0,\.25\)/, 'Graph milestones need a 1.5-second hold in the eight-second loop');
assert.match(renderer, /if\(p>=\.70\)/, 'The learning result needs a 1.5-second hold in the five-second loop');
assert.match(page, /class="card primary-demo"/, 'Primary demo must follow the authority proof');
assert.match(page, /class="primary-demo-copy"/, 'Primary demo needs page-owned sales copy');
assert.match(page, /class="primary-demo-visual"[^>]*data-demo-slot/, 'Primary demo needs a stable visual integration slot');
assert.ok(page.indexOf('class="primary-demo-visual"') < page.indexOf('class="primary-demo-copy"'), 'Primary demo visual must lead the split layout');
assert.doesNotMatch(page, /class="primary-demo-visual"[^>]*role="img"/, 'Interactive demo slot must not hide future controls behind an image role');
assert.match(page, /class="primary-demo-placeholder"[^>]*role="img"/, 'Static placeholder needs its own image semantics');
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
assert.match(page, /class="card founder-highlight"/, 'Founder highlight must follow mechanism features');
assert.match(page, /data-placeholder="founder"/, 'Founder highlight needs a stable portrait placeholder');
assert.match(page, /class="card outcome-features"/, 'Outcome features must follow founder highlight');
assert.ok(page.indexOf('class="card mechanism-features"') < page.indexOf('class="card founder-highlight"'), 'Mechanism features must precede founder highlight');
assert.ok(page.indexOf('class="card founder-highlight"') < page.indexOf('class="card outcome-features"'), 'Founder highlight must precede outcome features');
assert.ok(page.indexOf('class="card outcome-features"') < page.indexOf('class="card case-studies"'), 'Outcome features must precede proof stories');

const outcomeFeatures = page.match(/class="outcome-feature"/g) ?? [];
assert.equal(outcomeFeatures.length, 3, `Expected three outcome features, found ${outcomeFeatures.length}`);
const outcomePlaceholders = page.match(/data-placeholder="outcome"/g) ?? [];
assert.equal(outcomePlaceholders.length, 3, 'Every outcome feature needs a stable placeholder');
assert.match(page, /Self-funding is the objective, not a guaranteed result\./, 'Outcome section must keep the self-funding boundary');

const h1s = page.match(/<h1\b/g) ?? [];
assert.equal(h1s.length, 1, `Expected one h1, found ${h1s.length}`);
assert.match(page, /<h1[^>]*>[^<]*done-for-you AI sales department/i, 'Primary demo H1 must state the offer');

const iframes = [...page.matchAll(/<iframe\b[^>]*>/g)].map((match) => match[0]);
assert.ok(iframes.every((tag) => /\btitle="[^"]+"/.test(tag)), 'Every iframe needs a useful title');
assert.ok(iframes.filter((tag) => /loading="eager"/.test(tag)).length <= 1, 'Only one iframe may load eagerly');

const wistiaPlayers = [...page.matchAll(/<wistia-player\b[^>]*>/g)].map((match) => match[0]);
assert.equal(wistiaPlayers.length, 3, `Expected three testimonial players, found ${wistiaPlayers.length}`);
assert.ok(wistiaPlayers.every((tag) => /\baria-label="[^"]+"/.test(tag)), 'Every testimonial player needs an accessible name');
assert.match(wistiaPlayers[0], /media-id="6oj2gj3wqt"/, 'Sandra must remain the featured testimonial');

const proofCards = page.match(/class="proof-card [^"]+"/g) ?? [];
assert.equal(proofCards.length, 8, `Expected eight written proof cards, found ${proofCards.length}`);
const faqItems = page.match(/class="faq-item"/g) ?? [];
assert.equal(faqItems.length, 6, `Expected six FAQ items, found ${faqItems.length}`);
assert.doesNotMatch(page, /class="site-footer"/, 'Removed footer must not return');
assert.doesNotMatch(page, /mobile-cta/, 'Removed sticky CTA must not return');
assert.ok(page.indexOf('class="card faq"') < page.indexOf('class="card cta"'), 'FAQ must precede the final CTA');

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
