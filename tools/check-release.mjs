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
assert.match(page, /--measure-faq:72ch/, 'Desktop FAQ answers must retain the approved 72ch measure');
assert.match(page, /\.faq-answer\{width:100%;max-width:var\(--measure-faq\)/, 'FAQ answers must use the dedicated desktop measure');
assert.match(page, /@media\(max-width:720px\)[\s\S]*\.faq-answer\{max-width:none;/, 'Mobile FAQ answers must use the available width');
assert.match(page, /\.faq-item summary::after\{[^}]*transition:transform \.22s cubic-bezier\(\.22,1,\.36,1\)/, 'FAQ indicator must use the approved closing duration and easing');
assert.match(page, /\.faq-item\[open\] summary::after\{[^}]*transition-duration:\.3s/, 'FAQ indicator must use the approved opening duration');
assert.match(page, /function setupFaqAccordion\(\)/, 'FAQ accordion motion controller is missing');
assert.match(page, /summary\.addEventListener\('click'/, 'FAQ animation must preserve summary click and keyboard activation');
assert.match(page, /summary\.addEventListener\('keydown'/, 'FAQ animation must preserve explicit Enter and Space activation');
assert.match(page, /if\(event\.key!==\'Enter\' && event\.key!==\' \'\) return;\s*event\.preventDefault\(\);\s*if\(event\.repeat\) return;/, 'FAQ keyboard handling must prevent native repeated-key scrolling');
assert.match(page, /suppressKeyboardClick && event\.detail===0/, 'FAQ keyboard handling must suppress a synthetic follow-up click');
assert.match(page, /item\.removeAttribute\('name'\)/, 'Scripted FAQ motion must prevent native group closing from skipping animation');
assert.match(page, /matchMedia\('\(prefers-reduced-motion:reduce\)'\)/, 'FAQ motion must respect reduced-motion preferences');
assert.match(page, /item\.animate\(\[\{height:/, 'FAQ accordion must animate measured height rather than a fixed max-height');
assert.match(page, /--tracking-body:0;--tracking-heading:-2px;--tracking-display:-2px;--tracking-stat:-1px/, 'Heading tracking must retain the approved -2px treatment without changing stat tracking');
assert.match(page, /\.primary-demo h1\{[^}]*line-height:1\.1;[^}]*letter-spacing:var\(--tracking-display\)/, 'Hero heading must retain the shared heading rhythm');
assert.match(page, /\.card-title\{[^}]*line-height:1\.1;[^}]*letter-spacing:var\(--tracking-display\)/, 'Section headings must retain the shared heading rhythm');
assert.match(page, /\.mechanism-feature h3\{[^}]*line-height:1\.1;[^}]*letter-spacing:var\(--tracking-heading\)/, 'Feature headings must retain the shared heading rhythm');
assert.match(page, /\.case-quote\{[^}]*letter-spacing:var\(--tracking-body\)/, 'Long testimonial copy must not inherit display tracking');
assert.match(page, /--space-1:4\.6px;--space-2:9\.2px;--space-3:13\.8px;--space-4:18\.4px;--space-5:27\.6px;--space-6:36\.8px;--space-7:55\.2px/, 'Internal spacing tiers must retain the approved 15% increase');
assert.match(page, /--space-8:80px;--space-9:112px/, 'Large section spacing must retain the expanded rhythm');
assert.match(page, /--rail-wide:1280px/, 'Desktop content rail must retain the expanded 1280px width');
assert.match(page, /--type-body:1\.375rem;--type-body-large:1\.5rem/, 'Desktop body typography must retain the approved 22px and 24px tiers');
assert.match(page, /@media\(max-width:720px\)[\s\S]*--type-body:1\.125rem;--type-body-large:1\.5rem/, 'Mobile body typography must retain the approved 18px and 24px tiers');
assert.match(page, /body\{[^}]*font-size:var\(--type-body\);line-height:1\.5;/, 'Body copy must retain the approved 150% line height');
assert.match(page, /--type-section:clamp\(3\.6rem,3\.252rem \+ 1\.416vw,4\.5rem\)/, 'Section typography must retain the approved 20% increase');
assert.match(page, /--type-control:1\.2rem;--type-button:1\.7rem;--type-label:1\.2rem;--type-meta:1\.2rem;--type-legal:1\.125rem/, 'Small typography tiers must retain their approved increases');
assert.match(page, /--type-button:1\.7rem/, 'CTA typography must retain the approved 1.7rem size');
assert.match(page, /\.card\{--card-pad:var\(--space-6\)/, 'Desktop cards must retain the expanded 36.8px padding');
assert.match(page, /@media\(max-width:720px\)[\s\S]*\.card\{--card-pad:var\(--space-5\)\}/, 'Mobile cards must retain the expanded 27.6px padding');
assert.match(page, /\.cta-btn\{[^}]*display:flex;[^}]*width:max-content;[^}]*font-weight:700;[^}]*font-size:var\(--type-button\)[^}]*text-transform:capitalize/, 'CTA buttons must use their own line, bold type, and Capitalize Case');
assert.match(page, /\.cta-btn\{[^}]*padding:12\.65px var\(--space-6\)/, 'Desktop CTA buttons must retain the approved horizontal padding');
assert.match(page, /@media\(max-width:720px\)[\s\S]*\.cta-btn\{padding-inline:var\(--space-4\);/, 'Mobile CTA buttons must use responsive horizontal padding');
assert.match(page, /@media\(max-width:720px\)[\s\S]*\.cta-btn\{[^}]*font-size:clamp\(1\.35rem,6\.15vw,1\.7rem\);white-space:nowrap/, 'Mobile CTA buttons must remain legible without wrapping');
assert.match(page, /@media\(max-width:350px\)\{\s*\.cta-btn\{padding-inline:var\(--space-3\);font-size:1\.05rem\}/, 'Very narrow screens must keep the full CTA label inside the button');
assert.match(page, /\.primary-demo h1\{[^}]*font-size:clamp\(3\.3rem,4\.8vw,3\.6rem\)/, 'Hero typography must retain the approved 20% increase');
assert.match(page, /--type-stat:clamp\(5\.1rem,9\.6vw,7\.8rem\)/, 'Stat typography must retain the approved 20% increase');
assert.match(page, /\.proof-stat\{[^}]*font-size:var\(--type-stat\)/, 'Proof stats must consume the semantic stat tier');
assert.match(page, /\.proof-card blockquote::before\{[^}]*font-size:5\.4rem/, 'Quote marks must retain the approved 20% increase');
assert.match(page, /\.faq-item summary::after\{[^}]*font-size:1\.8rem/, 'FAQ controls must retain the approved 20% increase');
assert.match(page, /--bg:#F6F6F7;--surface:var\(--bg\)/, 'Neutral surfaces must use one cool-gray token');
assert.match(page, /--page:#fff;--bg:#F6F6F7;--surface:var\(--bg\)/, 'Page canvas must use pure white');
assert.match(page, /body\{[^}]*background:var\(--page\)/, 'Body must render the page canvas token');
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
assert.match(page, /\.primary-demo,\.case-featured--portrait\{grid-template-columns:minmax\(0,3fr\) minmax\(320px,2fr\)\}/, 'Demo and featured testimonial must use the approved 60/40 media-text split');
assert.match(page, /\.founder-highlight\{grid-template-columns:minmax\(320px,2fr\) minmax\(0,3fr\)\}/, 'Founder card must use the approved 40/60 image-text split');
assert.match(page, /\.cta\{[^}]*background:var\(--accent-dark\)[^}]*color:#fff/, 'Closing CTA must remain the single deep-green color block');
assert.match(page, /\.cta \.cta-btn\{[^}]*color:var\(--accent-dark\)[^}]*background:#fff/, 'Closing CTA button must keep high contrast');
assert.match(renderer, /prefers-reduced-motion:reduce/, 'The demo renderer must honor reduced motion');
assert.match(renderer, /var PLAYER_MODE=document\.documentElement\.classList\.contains\('player-mode'\)/, 'Reduced motion must work inside independent demo players');
assert.match(renderer, /if\(REDUCE && PLAYER_MODE\)\{ window\.renderCaptureFrame\(chapter,chapter==='triagers'\?\.94:1\);send\('ready'\);return; \}/, 'Reduced-motion players must settle on a useful chapter end state');
assert.match(renderer, /renderTriagerScrollActivity\(state\.triagerActivityProgress,\(!REDUCE \|\| PLAYER_MODE\) && state\.phase==='triagers'\)/, 'Reduced-motion Triager players must keep their completed conversation visible');
assert.match(renderer, /zoomRange\(local,0,\.25\)/, 'Graph milestones need a 1.5-second hold in the eight-second loop');
assert.match(renderer, /if\(p>=\.70\)/, 'The learning result needs a 1.5-second hold in the five-second loop');
assert.match(page, /class="card primary-demo"/, 'Primary demo must follow the authority proof');
assert.match(page, /\.proof-snapshot\+\.primary-demo\{margin-top:var\(--space-6\)\}/, 'Authority proof and hero must use the compressed first-screen gap');
assert.match(page, /class="primary-demo-copy"/, 'Primary demo needs page-owned sales copy');
assert.match(page, /class="primary-demo-visual"[^>]*data-demo-slot/, 'Primary demo needs a stable visual integration slot');
assert.ok(page.indexOf('class="primary-demo-visual"') < page.indexOf('class="primary-demo-copy"'), 'Primary demo visual must lead the split layout');
assert.match(page, /@media\(max-width:899px\)[\s\S]*\.primary-demo-copy\{[^}]*order:1;[\s\S]*\.primary-demo-visual\{[^}]*order:2;/, 'Hero copy and CTA must precede the visual below desktop width');
assert.match(page, /@media\(max-width:720px\)[\s\S]*\.proof-snapshot-logo-row\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/, 'Mobile authority logos must use a compact three-column grid');
assert.doesNotMatch(page, /class="primary-demo-visual"[^>]*role="img"/, 'Interactive demo slot must not hide future controls behind an image role');
assert.match(page, /class="primary-demo-placeholder"[^>]*role="img"/, 'Static placeholder needs its own image semantics');
assert.doesNotMatch(page, /class="card video-story"/, 'Old four-demo story must be removed');
assert.doesNotMatch(page, /class="video-chapter"/, 'Old independent demo chapters must be removed');
assert.match(page, /class="card founder-letter"/, 'Founder letter must follow the primary demo');
assert.match(page, /class="founder-letter-copy" data-letter-copy/, 'Founder letter needs a measurable reading body');
assert.match(page, /class="card mechanism-features"/, 'Mechanism features must follow the founder letter');
assert.doesNotMatch(page, /mid-cta/, 'Removed white mid-page CTA must not return');
assert.doesNotMatch(page, /buyer-situation/, 'Removed buyer-symptoms section must not return');
assert.match(page, /class="card founder-letter"[\s\S]*?<\/section>\s*<!-- ============ MECHANISM FEATURES ============ -->\s*<section class="card mechanism-features"/, 'Three AI roles must follow the founder letter directly');

const letterMatch = page.match(/class="founder-letter-copy" data-letter-copy>([\s\S]*?)<\/div>/);
assert.ok(letterMatch, 'Expected founder letter copy');
const letterBody = letterMatch[1].replace(/<p class="founder-letter-signature">[\s\S]*?<\/p>/, '');
const letterParagraphs = letterBody.match(/<p(?:\s[^>]*)?>/g) ?? [];
assert.equal(letterParagraphs.length, 15, `Founder letter has ${letterParagraphs.length} reading beats; expected 15`);
const letterWords = letterBody.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean);
assert.ok(letterWords.length >= 180 && letterWords.length <= 300, `Founder letter has ${letterWords.length} words; expected 180-300`);
assert.match(letterBody, /sells 24\/7 in the background of your business/i, 'Founder letter must retain the VSL mechanism language');
assert.match(letterBody, /two things happen at once/i, 'Founder letter must retain the VSL assessment transition');
assert.match(letterBody, /put their money where their mouth is/i, 'Founder letter must retain the VSL buyer-intent language');
assert.match(letterBody, /about one hour per week/i, 'Founder letter must retain the VSL client-involvement boundary');

const mechanismFeatures = page.match(/class="mechanism-feature"/g) ?? [];
assert.equal(mechanismFeatures.length, 3, `Expected three mechanism features, found ${mechanismFeatures.length}`);
assert.match(page, /<h3>AI Brain<\/h3>/, 'Mechanism must name the shared AI Brain');
assert.match(page, /<h3>AI Triagers<\/h3>/, 'Mechanism must name AI Triagers');
assert.match(page, /<h3>AI Salespeople<\/h3>/, 'Mechanism must name AI Salespeople');
const mechanismPlaceholders = page.match(/data-placeholder="mechanism"/g) ?? [];
assert.equal(mechanismPlaceholders.length, 3, 'Every mechanism feature needs a stable placeholder');
assert.match(page, /class="card founder-highlight"/, 'Founder highlight must follow mechanism features');
assert.match(page, /data-placeholder="founder"/, 'Founder highlight needs a stable portrait placeholder');
assert.ok(page.indexOf('class="card mechanism-features"') < page.indexOf('class="card founder-highlight"'), 'Mechanism features must precede founder highlight');
assert.ok(page.indexOf('class="card founder-highlight"') < page.indexOf('class="card case-studies"'), 'Founder highlight must precede proof stories');
assert.match(page, /\.case-studies\+\.proof\{margin-top:var\(--space-5\)\}/, 'Video and written testimonials must use one continuous proof rhythm');
assert.doesNotMatch(page, /What clients measured after putting AI to work\./, 'Written testimonials must not repeat the proof headline');
assert.match(page, /class="card proof" aria-label="More client results"/, 'Written testimonials need an accessible section name without a visible heading');
assert.doesNotMatch(page, /class="card outcome-features"/, 'Removed outcome section must not return');
assert.doesNotMatch(page, /class="card implementation-strip"/, 'Removed implementation strip must not return');
assert.match(page, /Self-funding is the objective, not a guaranteed result\./, 'Landing page must keep the self-funding boundary');

const h1s = page.match(/<h1\b/g) ?? [];
assert.equal(h1s.length, 1, `Expected one h1, found ${h1s.length}`);
assert.match(page, /<h1[^>]*>An AI sales department that helps pay for its own leads\.<\/h1>/, 'Primary demo H1 must state the self-funding mechanism in spoken sentence case');
assert.match(page, /<h1[^>]*>An AI sales department that helps pay for its own leads\.<\/h1>\s*<p>[^<]+<\/p>\s*<p class="primary-demo-note">Self-funding is the objective, not a guaranteed result\.<\/p>/, 'Hero must qualify the self-funding objective beside its claim');
assert.doesNotMatch(page, /Every lead you pay for should have a useful next step/i, 'The old soft founder-letter headline must not return');
assert.doesNotMatch(page, /90% of leads/i, 'Unverified exact lead-loss percentages must not appear');

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
assert.equal(faqItems.length, 7, `Expected seven FAQ items, found ${faqItems.length}`);
assert.doesNotMatch(page, /class="site-footer"/, 'Removed footer must not return');
assert.doesNotMatch(page, /mobile-cta/, 'Removed sticky CTA must not return');
assert.ok(page.indexOf('class="card faq"') < page.indexOf('class="card cta"'), 'FAQ must precede the final CTA');

const ctaLinks = [...page.matchAll(/<a\b[^>]*class="[^"]*cta-btn[^"]*"[^>]*>/g)].map((match) => match[0]);
assert.equal(ctaLinks.length, 1, 'Only the final green CTA may contain an application link');
assert.match(page, /<section class="card cta"[\s\S]*?<a\b[^>]*class="[^"]*cta-btn[^"]*"/, 'Application link must remain inside the final green CTA');
assert.equal((page.match(/>Apply for a Free Live Demo<\/a>/g) ?? []).length, ctaLinks.length, 'Every application CTA must use the specific free-live-demo label');
assert.ok(ctaLinks.every((tag) => /href="https:\/\/app\.iclosed\.io\/e\/kodara\/strategy-call"/.test(tag)), 'Every CTA must use the live scheduler');
assert.ok(ctaLinks.every((tag) => /target="_blank"/.test(tag) && /rel="noopener"/.test(tag)), 'External CTA links must open safely');

const localReferences = [...page.matchAll(/\b(?:src|data-src)="([^"]+)"/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'))
  .filter((reference) => !/^(?:data:|https?:|\/\/)/.test(reference))
  .map((reference) => reference.split(/[?#]/)[0]);
for (const reference of localReferences) {
  assert.ok(existsSync(resolve(root, reference)), `Missing local page asset: ${reference}`);
}
assert.doesNotMatch(page, /https:\/\/lltv28\.github\.io\/kodara-success-portal\/img\//, 'Critical testimonial portraits must be self-hosted');

console.log('Release checks passed.');
