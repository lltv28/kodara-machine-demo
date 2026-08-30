import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const pagePath = resolve(root, 'index.html');
const page = readFileSync(pagePath, 'utf8');

assert.ok(statSync(pagePath).size <= 140 * 1024, 'Landing page exceeds the 140KB release budget');

// Design-system invariants.
assert.match(page, /--rail-wide:1240px/, 'Desktop content rail must stay at 1240px');
assert.match(page, /--type-hero:clamp\(3\.25rem,5\.4vw,4\.75rem\)/, 'Hero must use the approved healthcare display scale');
assert.match(page, /--type-section:clamp\(3rem,4\.6vw,3\.75rem\)/, 'Section headings must retain the approved 48px to 60px scale');
assert.match(page, /--type-body:1\.3125rem;--type-body-large:1\.5rem/, 'Desktop body text must retain the readable 21px and 24px tiers');
assert.match(page, /@media\(max-width:720px\)[\s\S]*--type-body:1\.1875rem;--type-body-large:1\.375rem/, 'Mobile body text must retain the readable 19px and 22px tiers');
assert.match(page, /--tracking-body:0;--tracking-heading:-2px;--tracking-display:-2px;--tracking-stat:-1px/, 'Heading tracking must use the shared -2px treatment');
assert.match(page, /--space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:24px;--space-6:32px;--space-7:48px/, 'Internal spacing must use the shared 4px scale');
assert.match(page, /--radius-sm:8px/, 'Compact surfaces need the 8px radius tier');
assert.match(page, /--radius:16px;--radius-lg:16px/, 'Support surfaces need the 16px radius tier');
assert.match(page, /--radius-xl:24px/, 'Featured surfaces need the 24px radius tier');
assert.match(page, /--page:#fff;--panel:#fff;--bg:#fff;--surface:#fff/, 'Neutral page surfaces must stay white');
assert.doesNotMatch(page, /#FCFDFC|#F1F6F5|#E6EFED/i, 'Light green page backgrounds must not return');
assert.match(page, /--ink:#20362D;--ink-2:#304E42;--ink-3:#567066/, 'Text must use the healthcare green-black palette');
assert.match(page, /--accent:#106844;--accent-hover:#0C5537;--accent-ink:#106844;--accent-dark:#0C4F34/, 'Actions must use the Kodara green palette');
assert.doesNotMatch(page, /section-band--green|section-band--framed/, 'Alternate feature backgrounds and framing must not return');
assert.match(page, /\.cta-btn\{[^}]*display:flex;[^}]*width:max-content;[^}]*font-weight:700;[^}]*font-size:var\(--type-button\)/, 'CTA buttons must stay on their own line with bold, readable type');
assert.match(page, /--type-button:1\.625rem/, 'Primary CTA type must remain prominent for the over-40 audience');
assert.match(page, /\.cta-btn\{[^}]*min-height:64px;[^}]*padding:16px 36px/, 'Primary CTA buttons must keep a large desktop target');
assert.match(page, /prefers-reduced-motion:reduce/, 'The page must honor reduced-motion preferences');
assert.doesNotMatch(page, /[—–]/, 'Visible copy must not contain em or en dashes');
assert.match(page, /\.site-hero\{display:flex;[^}]*flex-direction:column;[^}]*text-align:center/, 'Hero must use the centered cinema stack');
assert.match(page, /\.hero-vsl-stage\{[^}]*max-width:1000px;[^}]*aspect-ratio:16\/9/, 'Hero VSL stage must reserve a stable 16:9 canvas');
assert.match(page, /class="cta-btn qualification-link hero-vsl-cta"/, 'Hero application CTA must sit below the VSL stage');
assert.match(page, /class="cta-btn qualification-link hero-vsl-cta"[^>]*>[^<]+<\/a>\s*<p class="hero-guarantee">/, 'Hero guarantee must sit below the application CTA');
const primaryNav = page.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
assert.equal((primaryNav.match(/<a\b/g) ?? []).length, 3, 'Primary navigation must stay limited to three orientation links');
assert.match(primaryNav, />How It Works<[^]*>Results<[^]*>FAQ</, 'Primary navigation must use the agreed labels and order');

// Core page structure.
for (const className of ['site-header', 'site-hero', 'proof-snapshot', 'education-section', 'primary-demo', 'mechanism-features', 'midpage-action', 'alternatives-section', 'case-studies', 'process-section', 'audience-section', 'founder-highlight', 'credibility-section', 'faq', 'cta', 'site-footer']) {
  assert.match(page, new RegExp(`class="[^"]*${className}`), `Missing ${className} section`);
}
assert.ok(page.indexOf('class="site-hero"') < page.indexOf('class="card proof-snapshot"'), 'Authority proof must follow the hero');
assert.ok(page.indexOf('class="card proof-snapshot"') < page.indexOf('class="education-section"'), 'Category education must follow authority proof');
assert.ok(page.indexOf('class="education-section"') < page.indexOf('class="card primary-demo"'), 'The replacement demo slot must follow category education');
assert.ok(page.indexOf('class="card primary-demo"') < page.indexOf('class="card mechanism-features'), 'Product overview must follow the primary demo');
assert.ok(page.indexOf('class="card mechanism-features') < page.indexOf('class="alternatives-section"'), 'Alternatives framing must follow the product overview');
assert.ok(page.indexOf('class="alternatives-section"') < page.indexOf('class="card case-studies"'), 'Client proof must follow the alternatives framing');
assert.ok(page.indexOf('class="card case-studies"') < page.indexOf('class="process-section'), 'Launch process must follow client proof');
assert.ok(page.indexOf('class="process-section') < page.indexOf('class="audience-section"'), 'Audience pathways must follow the launch process');
assert.ok(page.indexOf('class="card case-studies"') < page.indexOf('class="card founder-highlight"'), 'The concise founder story must follow client proof');
assert.ok(page.indexOf('class="card founder-highlight"') < page.indexOf('class="credibility-section'), 'Institutional credibility must follow the founder story');
assert.ok(page.indexOf('class="card faq"') < page.indexOf('class="card cta"'), 'FAQ must precede the final CTA');
assert.doesNotMatch(page, /class="[^"]*founder-letter/, 'The long-form founder letter must not return');

// Current VSL offer language.
assert.match(page, /<h1[^>]*>The AI Version of You, built and launched in 30 days\.<\/h1>/, 'Hero must lead with the complete 30-day AI Version promise');
assert.match(page, /Give us about one hour per week\.[^<]*\$500-\$2,000 digital programs[^<]*entirely online/, 'Hero must state the time, price, and online-delivery boundaries');
assert.match(page, /first 10 beta users within 30 days or you receive a full refund/, 'Hero must state the qualifying-client guarantee');
assert.match(page, /Less than 28%/, 'Demand narrative must include the healthcare-trust signal');
assert.match(page, /260 million health and wellness messages/, 'Demand narrative must include the current AI-demand signal');
assert.match(page, /major opportunity for independent health and wellness experts/, 'Demand narrative must connect the signals to the expert opportunity');
assert.match(page, /Thousands of clients and patients can access your approved educational programs at once across the open Internet/, 'The page must state the scale and open-Internet outcome without implying medical care');
assert.match(page, /do not imply endorsement, affiliation, client status, or purchase history/, 'The authority wall must state every proof boundary');
assert.match(page, /Your signed agreement controls eligibility, timing, definitions, and the exact remedy/, 'The offer panel must state the signed-agreement boundary');
assert.match(page, /more than 100,000 healthcare leads/, 'Client discovery must name the healthcare data foundation');
assert.match(page, /live search and demand signals/, 'Client discovery must explain the live-demand mechanism');
assert.match(page, /first 10 beta users will be onboarded, or you receive a full refund/, 'FAQ must state the current qualifying-client guarantee');
assert.match(page, /Dr\. Vora[\s\S]{0,500}client-discovery model[\s\S]{0,500}30 patients[\s\S]{0,500}first five weeks/, 'Client proof must include Dr. Vora and the VSL mechanism');
assert.match(page, /Ashley[\s\S]{0,500}client-discovery model[\s\S]{0,500}fully transitioned[\s\S]{0,500}in-person classes[\s\S]{0,500}two months/, 'Client proof must include Ashley and the VSL mechanism');
assert.match(page, /AI engineers and operators with decades of healthcare experience/, 'Team credibility must match the VSL');
assert.match(page, /More than 100,000 healthcare leads generated online were used to train Kodara/, 'The healthcare-data claim must match the VSL exactly');
assert.doesNotMatch(page, /purchased through AI systems built by our team/, 'The authority wall must not imply proof absent from the VSL');
assert.doesNotMatch(page, /first 10 real users|or you do not pay/i, 'Old guarantee language must not return');
assert.doesNotMatch(page, /Apply for a Free Live Demo|free live demo/i, 'The page must not promise an unverified free live demo');
assert.doesNotMatch(page, /professional, clinical, and compliance boundaries|data-handling and privacy requirements/i, 'Unsupported safety and privacy claims must not return');
assert.doesNotMatch(page, /AI sales department|paid assessment|self-funding|highest-level service|smaller digital offers/i, 'Legacy sales-department copy must not return');

const ctaLinks = [...page.matchAll(/<a\b[^>]*class="[^"]*cta-btn[^"]*"[^>]*>/g)].map((match) => match[0]);
assert.equal(ctaLinks.length, 4, 'Header, hero, product overview, and final sections must contain one primary button each');
const qualificationLinks = [...page.matchAll(/<a\b[^>]*class="[^"]*qualification-link[^"]*"[^>]*>/g)].map((match) => match[0]);
assert.equal(qualificationLinks.length, 5, 'Qualification links must appear in the header, hero, mid-page action, final CTA, and footer');
assert.ok(qualificationLinks.every((tag) => /href="https:\/\/app\.iclosed\.io\/e\/kodara\/strategy-call"/.test(tag)), 'Qualification links must use the live scheduler');
assert.ok(qualificationLinks.every((tag) => /target="_blank"/.test(tag) && /rel="noopener"/.test(tag)), 'External qualification links must open safely');
assert.equal((page.match(/>See If You Qualify/g) ?? []).length, 5, 'Every qualification link must use one concise action label');

// Demo retirement and replacement contract.
assert.doesNotMatch(page, /<ios-notification-demo\b/, 'The previous notification demo must not remain mounted');
assert.doesNotMatch(page, /assets\/ios-notification-demo\/(?:model|component)\.js/, 'The previous notification runtime must not load');
assert.doesNotMatch(page, /<iframe\b[^>]*mechanism-player|data-player-src|setupMechanismDemos|DEMO_RENDERER_BUILD/, 'Previous mechanism demos and playback controller must be removed');
assert.doesNotMatch(page, /data-demo-placeholder|data-placeholder|placeholder/i, 'Visible placeholder content must not ship');
assert.equal((page.match(/class="mechanism-proof"/g) ?? []).length, 3, 'The mechanism must use three finished proof visuals');
assert.match(page, /class="offer-demo"/, 'Primary offer visual must replace the empty demo slot');
assert.match(page, /class="founder-proof"/, 'Founder proof must replace the empty portrait slot');

// Homepage information architecture.
assert.equal((page.match(/class="audience-path"/g) ?? []).length, 4, 'Expected four clear audience pathways');
assert.equal((page.match(/class="delivery-model(?: |")/g) ?? []).length, 2, 'Expected the current-versus-future delivery comparison');
assert.equal((page.match(/class="alternative-item"/g) ?? []).length, 3, 'Expected three alternatives and bottlenecks');
assert.equal((page.match(/class="process-step"/g) ?? []).length, 3, 'Expected a three-step launch process');
assert.equal((page.match(/class="credibility-item"/g) ?? []).length, 3, 'Expected three institutional credibility signals');
assert.equal((page.match(/class="footer-group"/g) ?? []).length, 4, 'Expected four footer navigation groups');
assert.equal((page.match(/class="footer-disclaimer"/g) ?? []).length, 3, 'Expected three important footer disclaimers');
assert.match(page, /<h3>Earnings Disclaimer<\/h3>/, 'Footer must include the earnings disclaimer');
assert.match(page, /<h3>Medical Information Disclaimer<\/h3>/, 'Footer must include the medical information disclaimer');
assert.match(page, /<h3>AI Disclaimer<\/h3>/, 'Footer must include the AI disclaimer');
assert.match(page, /beta-user guarantee concerns onboarding beta users and is not a guarantee of sales, revenue, or profit/, 'Earnings disclaimer must limit the beta-user guarantee');
assert.match(page, /does not practice medicine or provide medical advice, diagnosis, or treatment/, 'Medical disclaimer must state the medical-information boundary');
assert.match(page, /AI-generated information may be incomplete, inaccurate, or outdated/, 'AI disclaimer must state the model-output boundary');
assert.equal((page.match(/class="[^"]*section-band[^"]*"/g) ?? []).length, 3, 'Expected three restrained full-width section bands');
assert.match(page, /<h2 id="founder-highlight-title">Why Kodara exists\.<\/h2>/, 'Founder section must use the concise company-story framing');
assert.match(page, /class="founder-principle"/, 'Founder section must end with the guiding principle');
assert.match(page, /id="review-approval"/, 'The review-and-approval section needs an intent-revealing anchor');
assert.match(page, /href="#review-approval">Review &amp; Approval<\/a>/, 'Footer navigation must link to review and approval');

// Proof, FAQ, and accessibility.
assert.equal((page.match(/class="proof-snapshot-logo proof-snapshot-logo--/g) ?? []).length, 6, 'Authority wall must contain six healthcare logos');
for (const brand of ['Massage Envy', 'Gameday Men’s Health', 'Visiting Angels', 'Ellie Mental Health', 'Mayo Clinic', 'Johns Hopkins University']) {
  assert.ok(page.includes(`alt="${brand}"`), `Authority wall must include ${brand}`);
}
const wistiaPlayers = [...page.matchAll(/<wistia-player\b[^>]*>/g)].map((match) => match[0]);
assert.equal(wistiaPlayers.length, 2, 'Expected the two healthcare testimonial videos');
assert.ok(wistiaPlayers.every((tag) => /aria-label="[^"]+"/.test(tag)), 'Every testimonial video needs an accessible name');
assert.equal((page.match(/class="faq-item"/g) ?? []).length, 9, 'Expected nine offer FAQs');
assert.match(page, /function setupFaqAccordion\(\)/, 'FAQ motion controller is missing');
assert.match(page, /matchMedia\('\(prefers-reduced-motion:reduce\)'\)/, 'FAQ motion must respect reduced motion');

const localReferences = [...page.matchAll(/\b(?:src|data-src)="([^"]+)"/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'))
  .filter((reference) => !/^(?:data:|https?:|\/\/)/.test(reference))
  .map((reference) => reference.split(/[?#]/)[0]);
for (const reference of localReferences) {
  assert.ok(existsSync(resolve(root, reference)), `Missing local page asset: ${reference}`);
}

console.log('Release checks passed.');
