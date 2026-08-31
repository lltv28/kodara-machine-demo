import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const pagePath = resolve(root, 'index.html');
const page = readFileSync(pagePath, 'utf8');
const confirmationPath = resolve(root, 'confirmation/index.html');
const confirmationStylesPath = resolve(root, 'confirmation/styles.css');
const confirmation = readFileSync(confirmationPath, 'utf8');
const confirmationStyles = readFileSync(confirmationStylesPath, 'utf8');

function cssToken(source, name) {
  return source.match(new RegExp(`${name}:([^;}]+)`))?.[1];
}

assert.ok(statSync(pagePath).size <= 140 * 1024, 'Landing page exceeds the 140KB release budget');
assert.match(page, /<head>[\s\S]*?https:\/\/t\.kodarahealth\.com\/v1\/7f7c1f59890e8b25c13e26ffca667c2709a446cbd68a53bc0bd06ca3d4b782a9\?tag=!clicked&ref_url=[\s\S]*?<\/head>/, 'Kodara click tracking must load from the document head');

// Post-booking confirmation page.
assert.ok(statSync(confirmationPath).size <= 64 * 1024, 'Confirmation page exceeds the 64KB release budget');
assert.ok(statSync(confirmationStylesPath).size <= 32 * 1024, 'Confirmation styles exceed the 32KB release budget');
assert.ok(existsSync(resolve(root, 'assets/fonts/instrument-sans-latin.woff2')), 'Missing reusable Instrument Sans font asset');
assert.match(confirmation, /<meta name="robots" content="noindex,nofollow">/, 'Confirmation page must stay out of search results');
assert.match(confirmation, /<head>[\s\S]*?https:\/\/t\.kodarahealth\.com\/v1\/7f7c1f59890e8b25c13e26ffca667c2709a446cbd68a53bc0bd06ca3d4b782a9\?tag=!clicked&ref_url=[\s\S]*?<\/head>/, 'Confirmation tracking must load from the document head');
assert.match(confirmation, /id="call-confirmation" class="vsl-stage confirmation-video" data-video-slot="call-confirmation"/, 'Confirmation page needs the call-confirmation video frame');
assert.match(confirmation, /id="vidalytics_embed_VNXQCkfkzn95oP5v"/, 'Confirmation page needs the approved call-confirmation video');
assert.match(confirmation, /https:\/\/fast\.vidalytics\.com\/embeds\/U18KMfDU\/VNXQCkfkzn95oP5v\//, 'Call-confirmation video must use the approved Vidalytics source');
assert.match(confirmation, /class="call-details-widget" data-url="https:\/\/app\.iclosed\.io\/embed" style="width:100%;height:340px"/, 'iClosed call details must appear below the confirmation video');
assert.match(confirmation, /<script src="https:\/\/app\.iclosed\.io\/assets\/widget\.js" async><\/script>/, 'Confirmation page must load the iClosed widget');
assert.match(confirmation, /class="call-details-widget"[\s\S]*?<script src="https:\/\/app\.iclosed\.io\/assets\/widget\.js" async><\/script>\s*<div class="proof-snapshot-logos confirmation-proof-logos"/, 'Confirmation authority logos must appear immediately below the iClosed widget');
assert.match(confirmation, /<p class="proof-snapshot-logo-label">Trusted by companies like:<\/p>/, 'Confirmation authority strip must use the approved title');
assert.equal((confirmation.match(/class="proof-snapshot-logo proof-snapshot-logo--/g) ?? []).length, 6, 'Confirmation authority strip must contain six healthcare logos');
assert.doesNotMatch(confirmation, /Organization names are shown for market context/, 'Confirmation authority strip must not show the removed organization disclaimer');
assert.doesNotMatch(confirmation, /Reserved space for the call confirmation video|This media slot is ready for the final video embed/, 'Call-confirmation placeholder content must not remain');
assert.match(confirmation, /data-video-slot="case-study"/, 'Confirmation page needs the case-study video slot');
assert.doesNotMatch(confirmation, /Before we speak\.|class="prepare"|class="prepare-list"/, 'Confirmation page must not restore the redundant preparation section');
assert.match(confirmation, /<section id="case-study" aria-labelledby="case-study-title">[\s\S]*?<header class="section-head">[\s\S]*?<div class="featured-video case-study-video" data-video-slot="case-study">/, 'Case study must use the shared centered one-column video layout');
assert.equal((confirmation.match(/data-video-slot="faq-[0-9]{2}"/g) ?? []).length, 10, 'Confirmation page needs ten FAQ video slots');
assert.equal((confirmation.match(/class="faq-video-card"/g) ?? []).length, 10, 'Confirmation page needs ten visible FAQ video cards');
assert.doesNotMatch(confirmation, /<details class="faq-video-item"/, 'Confirmation FAQ videos must not be hidden in accordions');
const faqMediaIds = ['r2pkkov5rg', 'e47ppehwjh', 'l7fyqetxpn', 's7951l4xa5', 'sw43ey69ww', 'dn09mavlp6', 'jc5cxpk769', 'ckuwnunnj1', 'usi9w4dm7f', '8dfm3p5r86'];
const confirmationPlayers = [...confirmation.matchAll(/<wistia-player\b[^>]*>/g)].map((match) => match[0]);
const faqPlayers = confirmationPlayers.filter((tag) => faqMediaIds.some((mediaId) => tag.includes(`media-id="${mediaId}"`)));
assert.equal(faqPlayers.length, 10, 'Confirmation page needs all ten approved Kodara FAQ videos');
assert.ok(faqPlayers.every((tag) => /aspect="1\.7777777777777777"/.test(tag)), 'Every FAQ video must reserve its native 16:9 frame');
assert.ok(faqPlayers.every((tag) => /aria-label="FAQ video: [^"]+"/.test(tag)), 'Every FAQ video needs an accessible question');
for (const mediaId of faqMediaIds) {
  assert.equal((confirmation.match(new RegExp(`media-id="${mediaId}"`, 'g')) ?? []).length, 1, `FAQ media ${mediaId} must be embedded exactly once`);
  assert.match(confirmation, new RegExp(`https:\\/\\/fast\\.wistia\\.com\\/embed\\/'?\\+mediaId\\+'?\\.js|['"]${mediaId}['"]`), `FAQ media ${mediaId} must be lazy loaded`);
}
assert.doesNotMatch(confirmation, /FAQ Video|Video answer will appear here\./, 'FAQ placeholder content must not remain');
assert.match(confirmation, /id="vidalytics_embed_CA0308FsT4_Z8w5E"/, 'Confirmation page must replay the approved Vidalytics presentation');
assert.match(confirmation, /https:\/\/fast\.vidalytics\.com\/embeds\/U18KMfDU\/CA0308FsT4_Z8w5E\//, 'Confirmation page must use the approved Vidalytics source');
assert.equal((confirmation.match(/id="vidalytics_embed_[^"]+"/g) ?? []).length, 2, 'Confirmation page needs the call-confirmation video and full-presentation replay');
assert.equal((confirmation.match(/media-id="1mynmgx2fa"/g) ?? []).length, 1, 'Confirmation page needs the approved case study video exactly once');
assert.match(confirmation, /https:\/\/fast\.wistia\.com\/embed\/1mynmgx2fa\.js/, 'Case study video must load from the approved Wistia source');
assert.match(confirmation, /<wistia-player media-id="1mynmgx2fa" aspect="1\.7777777777777777" aria-label="[^"]+">/, 'Case study video needs a stable 16:9 frame and accessible name');
assert.equal(confirmationPlayers.length, 13, 'Confirmation page needs one case study, two testimonial, and ten FAQ videos');
assert.equal((confirmation.match(/data-press-slot="press-[0-9]{2}"/g) ?? []).length, 4, 'Confirmation page needs four replaceable press slots');
assert.equal((confirmation.match(/class="press-card"/g) ?? []).length, 4, 'Confirmation page needs four visible press cards');
const pressFeatures = [
  ['Business Insider', 'assets/press/business-insider.svg', 'assets/press/business-insider-article.jpg', 'markets.businessinsider.com/news/currencies/kodara-announces-new-ai-product-building-service-for-established-experts-1036482546'],
  ['Yahoo Finance', 'assets/press/yahoo-finance.svg', 'assets/press/yahoo-finance-article.jpg', 'finance.yahoo.com/technology/ai/articles/established-experts-racing-clone-knowledge-112500919.html'],
  ['AP News', 'assets/press/ap-news.svg', 'assets/press/ap-news-article.jpg', 'apnews.com/press-release/getnews/press-release-ec5d282d406940b070c752d01d70e383'],
  ['MSN', 'assets/press/msn.svg', 'assets/press/msn-article.jpg', 'msn.com/en-us/news/other/what-separates-the-5-percent-of-ai-projects-that-actually-make-money/ar-AA28XP85'],
];
for (const [publisher, wordmark, capture, articlePath] of pressFeatures) {
  assert.ok(existsSync(resolve(root, wordmark)), `Missing ${publisher} press wordmark`);
  assert.ok(existsSync(resolve(root, capture)), `Missing ${publisher} article capture`);
  assert.ok(confirmation.includes(`../${wordmark}`), `${publisher} wordmark is not wired into the confirmation page`);
  assert.ok(confirmation.includes(`../${capture}`), `${publisher} article capture is not wired into the confirmation page`);
  assert.ok(confirmation.includes(articlePath), `${publisher} press card is not linked to the verified article`);
}
assert.equal((confirmation.match(/class="press-logo"/g) ?? []).length, 4, 'Every press card needs a stable logo area');
assert.equal((confirmation.match(/assets\/press\/[a-z-]+-article\.jpg" width="1185" height="667"/g) ?? []).length, 4, 'Every press card needs a dimensioned 16:9 article capture');
assert.equal((confirmation.match(/<a class="press-card"[^>]*target="_blank" rel="noopener noreferrer"/g) ?? []).length, 4, 'Every press feature must be one safe external link');
assert.doesNotMatch(confirmation, /Press Feature|Publication name|Interview or article title|will be added here/, 'Press placeholders must not remain');
assert.match(confirmationStyles, /--rail-wide:1240px/, 'Confirmation page must use the shared 1240px content rail');
assert.match(confirmationStyles, /--rail-media:1000px/, 'Confirmation page must use the shared 1000px media rail');
assert.match(confirmationStyles, /--rail-reading:760px/, 'Confirmation page must use the shared 760px reading rail');
assert.match(confirmationStyles, /--measure-display:22ch/, 'Confirmation page must use the shared display measure');
assert.match(confirmationStyles, /--measure-body:62ch/, 'Confirmation page must use the shared body measure');
assert.match(confirmationStyles, /--measure-card-body:42ch/, 'Confirmation page must use the shared card-body measure');
assert.doesNotMatch(confirmationStyles, /max-width:(?:1000px|1100px|13ch|16ch|22ch|30ch|54ch|58ch|78ch)/, 'Confirmation page must not restore legacy one-off content widths');
assert.match(confirmationStyles, /\.featured-video\{[^}]*max-width:var\(--rail-media\)/, 'Confirmation featured video must use the media rail');
assert.match(confirmationStyles, /\.section-head h2\{max-width:var\(--measure-display\)/, 'Confirmation section headings must use the display measure');
assert.match(confirmationStyles, /\.section-head p\{max-width:var\(--measure-body\)/, 'Confirmation section copy must use the body measure');
assert.match(confirmationStyles, /\.press-library\{max-width:var\(--rail-wide\)/, 'Confirmation press grid must use the wide rail');
assert.match(confirmationStyles, /\.faq-video-library\{max-width:var\(--rail-wide\)/, 'Confirmation FAQ grid must use the wide rail');
assert.match(confirmationStyles, /--accent:#106844/, 'Confirmation page must use the shared Kodara green');
for (const token of ['--shadow-sm', '--shadow-md', '--space-8', '--space-9', '--type-section', '--type-card', '--type-body', '--type-body-large', '--type-question', '--type-label', '--type-meta', '--type-legal', '--tracking-heading', '--tracking-display']) {
  assert.equal(cssToken(confirmationStyles, token), cssToken(page, token), `Confirmation page must share root token ${token}`);
}
assert.match(confirmationStyles, /body\{[\s\S]*?line-height:1\.6;/, 'Confirmation body must share the root line height');
assert.match(confirmationStyles, /\.final-reminder\{[^}]*border-radius:var\(--radius\);[^}]*background:var\(--accent-dark\)/, 'Confirmation reminder must use the root CTA surface');
assert.match(confirmationStyles, /\.site-footer-inner\{[^}]*grid-template-columns:minmax\(240px,\.75fr\) minmax\(0,2\.25fr\);[^}]*gap:var\(--space-7\)/, 'Confirmation footer must share root desktop geometry');
assert.match(confirmationStyles, /\.brand:focus-visible,\.site-footer-brand:focus-visible\{outline:3px solid var\(--accent-dark\)/, 'Confirmation brand links need the shared focus treatment');
assert.match(confirmationStyles, /\.press-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'Confirmation press features must use a two-column desktop grid');
assert.match(confirmationStyles, /@media\(max-width:899px\)[\s\S]*\.press-grid\{grid-template-columns:1fr\}/, 'Confirmation press features must stack on smaller screens');
assert.match(confirmationStyles, /\.press-card-media\{overflow:hidden;/, 'Press captures need a stable clipped media frame');
assert.match(confirmationStyles, /\.press-card-media>img\{display:block;width:100%;height:auto\}/, 'Press captures must preserve their intrinsic aspect ratio');
assert.doesNotMatch(confirmationStyles, /\.press-card-media>img\{[^}]*height:100%/, 'Press captures must not be stretched to a forced height');
assert.match(confirmationStyles, /\.press-card h3\{[^}]*font-size:clamp\(1\.35rem,1\.9vw,1\.75rem\)/, 'Press headlines must remain legible across desktop and mobile');
assert.match(confirmationStyles, /\.faq-video-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'Confirmation FAQ videos must use a two-column desktop grid');
assert.match(confirmationStyles, /@media\(max-width:899px\)[\s\S]*\.faq-video-grid\{grid-template-columns:1fr\}/, 'Confirmation FAQ videos must stack on smaller screens');
assert.match(confirmationStyles, /\.faq-video-media\{aspect-ratio:16\/9;/, 'Confirmation FAQ videos must reserve a stable 16:9 frame');
assert.match(confirmationStyles, /\.proof-snapshot-logo-row\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/, 'Confirmation authority logos must use the shared six-column desktop layout');
assert.match(confirmationStyles, /@media\(max-width:720px\)[\s\S]*\.proof-snapshot-logo-row\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'Confirmation authority logos must use the shared two-column mobile layout');
assert.doesNotMatch(confirmation + confirmationStyles, /[—–]/, 'Confirmation page must not contain em or en dashes');

// Official Kodara brand assets.
const brandAssets = [
  'assets/brand/kodara-wordmark.svg',
  'assets/brand/favicon-32.png',
  'assets/brand/favicon-48.png',
  'assets/brand/apple-touch-icon-180.png',
  'assets/brand/favicon-192.png',
  'assets/brand/favicon-512.png',
];
for (const asset of brandAssets) {
  assert.ok(existsSync(resolve(root, asset)), `Missing official brand asset: ${asset}`);
  assert.ok(page.includes(asset), `Official brand asset is not wired into the page: ${asset}`);
}
assert.equal((page.match(/assets\/brand\/kodara-wordmark\.svg/g) ?? []).length, 2, 'Official wordmark must appear in the header and footer');
assert.doesNotMatch(page, /assets\/favicon\.svg/, 'The previous generated favicon must not remain in use');

// Design-system invariants.
assert.match(page, /--rail-wide:1240px;--rail-media:1000px;--rail-reading:760px/, 'The page must use the approved wide, media, and reading rails');
assert.match(page, /--measure-display:22ch;--measure-body:62ch;--measure-card-body:42ch/, 'The page must use one display, body, and card text measure');
assert.doesNotMatch(page, /--hero-primary-width|--measure-display-long|--measure-card-title|--measure-faq/, 'Legacy one-off width tokens must not return');
assert.match(page, /--type-hero:clamp\(3rem,3\.8vw,3\.25rem\)/, 'Hero must use the approved 48px to 52px long-headline scale');
assert.match(page, /--type-section:clamp\(2\.75rem,4vw,3\.25rem\)/, 'Section headings must retain the approved 44px to 52px scale');
assert.match(page, /--type-section-long:clamp\(2\.75rem,3\.8vw,3\.25rem\)/, 'Long section headings must stay within the 44px to 52px section tier');
assert.match(page, /--type-card-small:clamp\(1\.875rem,2\.2vw,2\.125rem\)/, 'Supporting card headings must stay within the 30px to 34px tier');
assert.match(page, /--type-body:1\.25rem;--type-body-large:1\.375rem/, 'Desktop body text must retain the readable 20px and 22px tiers');
assert.match(page, /@media\(max-width:720px\)[\s\S]*--type-body:1\.125rem;--type-body-large:1\.25rem/, 'Mobile body text must retain the readable 18px and 20px tiers');
assert.match(page, /--type-hero-eyebrow:1\.3rem;--type-hero-subheadline:1\.7875rem/, 'Hero eyebrow and guarantee must retain their approved 30% desktop increase');
assert.match(page, /@media\(max-width:720px\)[\s\S]*--type-hero-subheadline:1\.625rem/, 'Hero guarantee must retain its approved 30% mobile increase');
assert.match(page, /\.hero-region-eyebrow\{[^}]*font-size:var\(--type-hero-eyebrow\)/, 'Hero audience line must use its dedicated type token');
assert.match(page, /#hero-region-subheadline\{[^}]*font-size:var\(--type-hero-subheadline\)/, 'Hero guarantee must use its dedicated type token');
assert.match(page, /@media\(max-width:720px\)[\s\S]*?#hero-region-subheadline\{[^}]*font-size:var\(--type-hero-subheadline\)/, 'Mobile hero guarantee must not fall back to the shared body tier');
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
assert.doesNotMatch(page, /\.section-band::before/, 'Full-width divider bands must not return');
assert.match(page, /\.faq-list\{display:grid;[^}]*gap:var\(--space-3\)/, 'FAQ items must use spaced cards instead of divider rows');
assert.match(page, /\.faq\{width:100%;max-width:var\(--rail-reading\)\}/, 'FAQ must keep one stable reading width in open and closed states');
assert.match(page, /\.homepage-stats\{display:grid;width:100%;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'Homepage stats must use one balanced four-card desktop row');
assert.match(page, /@media\(max-width:720px\)[\s\S]*?\.homepage-stats,\.mechanism-grid\{grid-template-columns:1fr;gap:var\(--space-4\)\}/, 'Homepage stats and process must stack before mobile cards become cramped');
assert.match(page, /\.founder-highlight h2\{max-width:var\(--measure-display\)/, 'Founder heading must use the shared display measure');
assert.match(page, /\.case-title\{max-width:var\(--measure-display\)/, 'Case-study headings must use the shared display measure');
assert.match(page, /\.faq-answer\{width:100%;max-width:var\(--measure-body\)/, 'FAQ answers must use the shared body measure');
assert.match(page, /\.site-footer\{width:auto;margin:var\(--space-9\) calc\(var\(--page-gutter\) \* -1\) 0/, 'Full-width footer must align to the page gutter without scrollbar overflow');
assert.doesNotMatch(page, /\.site-footer\{width:100vw/, 'Footer must not use viewport width that includes the scrollbar');
assert.match(page, /<section class="mechanism-features" id="how-it-works" aria-labelledby="mechanism-title">/, 'The approved three-step process must be visible');
assert.doesNotMatch(page, /<section class="(?:education-section|audience-section|credibility-section|proof-snapshot)|<section class="card primary-demo"/, 'Removed narrative chapters must not return to the homepage');
assert.match(page, /\.faq-item summary::after\{[^}]*right:var\(--space-5\);display:grid;width:32px;height:32px;place-items:center/, 'FAQ icons must use a fixed, centered desktop alignment box');
assert.match(page, /@media\(max-width:720px\)[\s\S]*?\.faq-item summary\{padding:var\(--space-4\) calc\(var\(--space-7\) \+ var\(--space-2\)\) var\(--space-4\) var\(--space-4\)\}[\s\S]*?\.faq-item summary::after\{right:var\(--space-4\)\}/, 'FAQ questions and icons must keep aligned mobile insets');
assert.doesNotMatch(page, /@media\(max-width:390px\)\{[^}]*\.faq-item summary\{padding-right:/, 'Narrow screens must not override the shared FAQ icon column');
assert.match(page, /\.cta-btn\{[^}]*display:flex;[^}]*width:max-content;[^}]*font-weight:700;[^}]*font-size:var\(--type-button\)/, 'CTA buttons must stay on their own line with bold, readable type');
assert.match(page, /--type-button:1\.375rem/, 'Primary CTA type must remain prominent without overpowering the page');
assert.match(page, /\.cta-btn\{[^}]*min-height:60px;[^}]*padding:15px 32px/, 'Primary CTA buttons must keep a readable desktop target');
assert.match(page, /prefers-reduced-motion:reduce/, 'The page must honor reduced-motion preferences');
assert.doesNotMatch(page, /[—–]/, 'Visible copy must not contain em or en dashes');
assert.match(page, /\.site-hero\{display:flex;[^}]*flex-direction:column;[^}]*text-align:center/, 'Hero must use the centered cinema stack');
assert.match(page, /\.site-hero h1\{width:100%;max-width:var\(--rail-media\)/, 'Hero headline must share the media rail');
assert.match(page, /#hero-region-subheadline\{width:100%;max-width:min\(var\(--rail-media\),var\(--measure-body\)\)/, 'Hero subheadline must align to the media rail without exceeding the body measure');
assert.match(page, /\.hero-vsl-stage\{[^}]*max-width:var\(--rail-media\);[^}]*aspect-ratio:16\/9/, 'Hero VSL stage must reserve a stable 16:9 canvas at the media rail');
assert.match(page, /id="vidalytics_embed_CA0308FsT4_Z8w5E"/, 'Hero must contain the production Vidalytics VSL');
assert.match(page, /https:\/\/fast\.vidalytics\.com\/embeds\/U18KMfDU\/CA0308FsT4_Z8w5E\//, 'Hero must load the approved Vidalytics VSL source');
assert.doesNotMatch(page, /class="hero-vsl-poster"/, 'Branded VSL placeholder must be removed');
assert.match(page, /<h2 class="hero-triager-title">See if you qualify:<\/h2>\s*<div id="kodara-triager"><\/div>/, 'Hero must introduce the triager with the approved qualification heading');
assert.match(page, /class="hero-vsl-stage"[\s\S]*?<div class="proof-snapshot-logos hero-proof-logos">[\s\S]*?<h2 class="hero-triager-title">See if you qualify:<\/h2>/, 'Authority logos must appear between the VSL and qualification widget');
assert.doesNotMatch(page, /Organization names are shown for market context/, 'Homepage authority strip must not show the removed organization disclaimer');
assert.match(page, /\.hero-proof-logos\{width:100%;margin-top:var\(--space-7\);padding-top:0\}/, 'Hero authority logos need deliberate desktop spacing without a duplicate top inset');
assert.match(page, /@media\(max-width:720px\)[\s\S]*?\.hero-proof-logos\{margin-top:var\(--space-6\);padding:0\}/, 'Hero authority logos need compact mobile spacing');
assert.match(page, /\.hero-triager-title\{[^}]*font-size:var\(--type-card\);[^}]*text-wrap:balance/, 'Triager heading must use the shared card-heading tier');
assert.match(page, /<div id="kodara-triager"><\/div>\s*<script\s+src="https:\/\/embed\.kodara\.com\/v1\/widget\.js"\s+data-target="kodara-triager"\s+data-widget-id="lucas-codex-testing">\s*<\/script>/, 'Hero must load the approved Kodara triager widget');
assert.doesNotMatch(page, /class="hero-guarantee"/, 'Duplicate post-widget guarantee must not return');
assert.doesNotMatch(page, /hero-vsl-cta/, 'Replaced hero qualification button must not remain');
const homepageHeader = page.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? '';
const confirmationHeader = confirmation.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? '';
for (const [name, header] of [['homepage', homepageHeader], ['confirmation page', confirmationHeader]]) {
  assert.equal((header.match(/<a\b/g) ?? []).length, 1, `${name} header must contain only the linked Kodara logo`);
  assert.doesNotMatch(header, /<nav\b|cta-btn|header-state/, `${name} header must not contain navigation, an action, or status text`);
}
assert.match(page, /\.site-header\{[^}]*align-items:center;justify-content:center;/, 'Homepage logo-only header must stay centered');
assert.match(confirmationStyles, /\.site-header\{[\s\S]*?align-items:center;\s*justify-content:center;/, 'Confirmation logo-only header must stay centered');

// Core page structure.
for (const className of ['site-header', 'site-hero', 'homepage-stats', 'mechanism-features', 'case-studies', 'founder-highlight', 'faq', 'cta', 'site-footer']) {
  assert.match(page, new RegExp(`class="[^"]*${className}`), `Missing ${className} section`);
}
const sectionIndex = (className) => page.search(new RegExp(`<(?:section|header|footer) class="[^"]*\\b${className}\\b`));
assert.ok(sectionIndex('site-hero') < sectionIndex('homepage-stats'), 'Four verified stats must immediately follow the qualification hero');
assert.ok(sectionIndex('homepage-stats') < sectionIndex('mechanism-features'), 'The launch process must follow the stat row');
assert.ok(sectionIndex('mechanism-features') < sectionIndex('case-studies'), 'Client proof must follow the product and launch chapters');
assert.ok(sectionIndex('case-studies') < sectionIndex('founder-highlight'), 'The concise founder story must follow client proof');
assert.ok(sectionIndex('faq') < sectionIndex('cta'), 'FAQ must precede the final CTA');
assert.doesNotMatch(page, /class="[^"]*founder-letter/, 'The long-form founder letter must not return');

// Current VSL offer language.
assert.match(page, /<h1[^>]*>Give Us 30 Days To Turn Your Health Expertise Into An AI That Can Sell Itself To Clients &amp; Patients Online<\/h1>/, 'Hero must lead with the approved online AI offer');
assert.match(page, /<p class="hero-region-eyebrow" id="hero-region-eyebrow">Limited Availability for Health &amp; Wellness Experts<\/p>\s*<h1/, 'Hero must place the generic regional availability line above the headline');
assert.match(page, /<p id="hero-region-subheadline">If we don't get your first 10 beta users in the first month, you get a full refund!<\/p>/, 'Hero must server-render the approved guarantee');
assert.match(page, /\.hero-region-eyebrow\{[^}]*min-block-size:1\.4em[^}]*text-wrap:balance/, 'Hero audience personalization must reserve its desktop height and balance wrapping');
assert.match(page, /#hero-region-subheadline\{[^}]*min-block-size:3em[^}]*text-wrap:balance/, 'Static hero guarantee must reserve only its rendered desktop height');
assert.match(page, /\.hero-vsl-stage\{[^}]*margin-top:var\(--space-5\)/, 'Desktop VSL must sit close to the guarantee without crowding it');
assert.match(page, /@media\(max-width:720px\)[\s\S]*?\.hero-region-eyebrow\{[^}]*min-block-size:2\.8em[\s\S]*?#hero-region-subheadline\{[^}]*min-block-size:6em/, 'Hero personalization must reserve both mobile text areas');
assert.match(page, /@media\(max-width:720px\)[\s\S]*?\.hero-vsl-stage\{margin-top:var\(--space-4\)/, 'Mobile VSL must use a compact gap below the guarantee');
assert.match(page, /@media\(max-width:340px\)\{\.hero-region-eyebrow\{min-block-size:4\.2em\}#hero-region-subheadline\{min-block-size:7\.5em\}\}/, 'Hero personalization must reserve its narrow-mobile text heights');
assert.match(page, /<script type="module" src="assets\/js\/region-personalization\.mjs"><\/script>/, 'Hero regional personalization client is not loaded');
assert.match(page, /Qualifying clients are protected by the 30-day refund terms in their signed agreement/, 'Launch process must state the qualifying-client guarantee boundary');
assert.match(page, /<strong>350\+<\/strong>\s*<span>Health and wellness experts running their businesses online with Kodara<\/span>/, 'Stat row must lead with the verified expert claim');
assert.match(page, /<strong>\$50M\+<\/strong>\s*<span>Revenue generated by our team for online knowledge-based products<\/span>/, 'Stat row must include the verified revenue claim');
assert.match(page, /<strong>105,000\+<\/strong>\s*<span>Leads &amp; consultations generated by our team and used to train the Kodara AI model<\/span>/, 'Stat row must retain the lead-and-consultation data foundation');
assert.match(page, /<strong>30\+<\/strong>\s*<span>Health, wellness, and medical modalities where we have helped clients create their AI<\/span>/, 'Stat row must include the verified modality claim');
assert.doesNotMatch(page, /class="mechanism-demo"/, 'The three-step process must not use decorative image boxes');
assert.match(page, /Your signed agreement controls eligibility, timing, definitions, and the exact remedy/, 'The offer panel must state the signed-agreement boundary');
assert.match(page, /more than 100,000 healthcare leads/, 'Client discovery must name the healthcare data foundation');
assert.match(page, /live search and demand signals/, 'Client discovery must explain the live-demand mechanism');
assert.match(page, /first 10 beta users will be onboarded, or you receive a full refund/, 'FAQ must state the current qualifying-client guarantee');
assert.match(page, /Dr\. Vora[\s\S]{0,500}Enrolled 30\+ patients in his first five weeks[\s\S]{0,500}client-discovery model/, 'Client proof must include Dr. Vora and the VSL mechanism');
assert.match(page, /Ashley[\s\S]{0,500}Replaced her in-person classes within two months[\s\S]{0,500}AI business/, 'Client proof must include Ashley and the VSL mechanism');
assert.equal((page.match(/class="client-result-card"/g) ?? []).length, 4, 'Client proof must use four consistent result-summary cards');
assert.equal((page.match(/class="client-result-points"/g) ?? []).length, 4, 'Each result-summary card must contain concise supporting facts');
const clientResultCards = [...page.matchAll(/<article class="client-result-card">([\s\S]*?)<\/article>/g)].map((match) => match[1]);
assert.ok(clientResultCards.every((card) => (card.match(/<li>/g) ?? []).length === 2), 'Each result-summary card must contain exactly two supporting facts');
assert.match(page, /class="testimonial-sparkles" aria-hidden="true">(?:<span>✦<\/span>){5}<\/div>/, 'Client proof must include five decorative brand stars');
assert.match(page, /\.client-results-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'Client results must use a balanced two-column desktop grid');
assert.match(page, /@media\(max-width:899px\)\{\.client-results-grid\{grid-template-columns:1fr\}\}/, 'Client results must stack cleanly at tablet and mobile widths');
assert.match(page, /\.client-result-points\{[^}]*padding:0/, 'Client result facts must align with their card headings');
assert.doesNotMatch(page, /purchased through AI systems built by our team/, 'The authority wall must not imply proof absent from the VSL');
assert.doesNotMatch(page, /first 10 real users|or you do not pay/i, 'Old guarantee language must not return');
assert.doesNotMatch(page, /Apply for a Free Live Demo|free live demo/i, 'The page must not promise an unverified free live demo');
assert.doesNotMatch(page, /professional, clinical, and compliance boundaries|data-handling and privacy requirements/i, 'Unsupported safety and privacy claims must not return');
assert.doesNotMatch(page, /AI sales department|paid assessment|self-funding|highest-level service|smaller digital offers/i, 'Legacy sales-department copy must not return');

const ctaLinks = [...page.matchAll(/<a\b[^>]*class="[^"]*cta-btn[^"]*"[^>]*>/g)].map((match) => match[0]);
assert.equal(ctaLinks.length, 1, 'The simplified homepage must contain one final qualification button outside the live widget');
const qualificationLinks = [...page.matchAll(/<a\b[^>]*class="[^"]*qualification-link[^"]*"[^>]*>/g)].map((match) => match[0]);
assert.equal(qualificationLinks.length, 1, 'Only the final CTA must repeat the live qualification action');
assert.ok(qualificationLinks.every((tag) => /href="#kodara-triager"/.test(tag)), 'Every qualification link must return visitors to the triager widget');
assert.ok(qualificationLinks.every((tag) => !/target=|rel=|opens in a new tab/.test(tag)), 'In-page qualification links must remain in the current page');
assert.doesNotMatch(page, /app\.iclosed\.io\/e\/kodara\/strategy-call/, 'The retired external scheduler destination must not remain');
assert.match(page, /#kodara-triager\{[^}]*scroll-margin-top:clamp\(24px,6vh,64px\)/, 'The triager anchor must land with comfortable viewport spacing');
assert.doesNotMatch(page, /fdCtaIntent:'strategy-call'/, 'Embed mode must not override the triager scroll path');
assert.equal((page.match(/>See If You Qualify/g) ?? []).length, 1, 'The final qualification link must use one concise action label');
assert.doesNotMatch(page, /class="section-cta"/, 'Intermediate qualification actions must not return');

// Demo retirement and replacement contract.
assert.doesNotMatch(page, /<ios-notification-demo\b/, 'The previous notification demo must not remain mounted');
assert.doesNotMatch(page, /assets\/ios-notification-demo\/(?:model|component)\.js/, 'The previous notification runtime must not load');
assert.doesNotMatch(page, /<iframe\b[^>]*mechanism-player|data-player-src|setupMechanismDemos|DEMO_RENDERER_BUILD/, 'Previous mechanism demos and playback controller must be removed');
assert.doesNotMatch(page, /data-demo-placeholder|data-placeholder|placeholder/i, 'Visible placeholder content must not ship');
assert.equal((page.match(/class="mechanism-feature"/g) ?? []).length, 3, 'The mechanism must use exactly three process cards');
assert.equal((page.match(/class="mechanism-step"/g) ?? []).length, 3, 'Every process card must include a clear step label');
assert.match(page, /class="founder-media"/, 'Founder section must include an authentic founder portrait');
assert.match(page, /src="assets\/lucas-tyson\.jpg"/, 'Founder portrait must use the approved local image');
assert.match(page, /\.founder-media img\{[^}]*width:100%;height:auto;aspect-ratio:1\/1;[^}]*object-fit:cover/, 'Founder portrait must keep a square, responsive edge-to-edge crop');
assert.equal((page.match(/class="founder-credential"/g) ?? []).length, 2, 'Founder credentials must support the human story without replacing it');
assert.match(page, /@media\(max-width:899px\)\{[\s\S]*?\.founder-highlight\{grid-template-columns:1fr/, 'Founder presentation must stack before tablet copy becomes cramped');

// Homepage information architecture.
assert.doesNotMatch(page, /delivery-comparison|delivery-model/, 'Removed delivery comparison must not return');
assert.equal((page.match(/class="mechanism-step"/g) ?? []).length, 3, 'Expected the launch process to be merged into three product chapters');
assert.doesNotMatch(page, /class="(?:midpage-action|alternatives-section|process-section)"/, 'Redundant mid-page action, alternatives, and process sections must stay removed');
assert.equal((page.match(/class="homepage-stat(?: |")/g) ?? []).length, 4, 'Expected four verified proof and delivery stat cards');
assert.equal((page.match(/class="case-kicker"/g) ?? []).length, 2, 'Video testimonials must use a consistent client-story label');
assert.equal((page.match(/class="case-fact"/g) ?? []).length, 2, 'Video testimonials must explain what Kodara helped build');
assert.equal((page.match(/class="client-result-role"/g) ?? []).length, 4, 'Every result summary must include consistent role context');
assert.equal((page.match(/class="footer-group"/g) ?? []).length, 0, 'Footer navigation groups must stay removed');
assert.doesNotMatch(page, /<footer[\s\S]*?<nav\b/, 'Footer must contain company information and disclaimers only');
assert.match(page, /class="site-footer-brand-block"[\s\S]*© 2026 Kodara LLC\. All rights reserved\.[\s\S]*class="site-footer-legal"/, 'Footer must place Kodara LLC information before the legal columns');
for (const [name, document] of [['homepage', page], ['confirmation page', confirmation]]) {
  assert.match(document, /<p class="footer-policy-links"><a href="https:\/\/www\.kodara\.com\/terms">Terms<\/a><a href="https:\/\/www\.kodara\.com\/privacy-policy">Privacy Policy<\/a><\/p>/, `${name} footer must link to the official terms and privacy policy`);
}
assert.match(page, /\.footer-policy-links\{display:flex;flex-wrap:wrap;gap:var\(--space-2\) var\(--space-4\);[^}]*font-size:\.75rem!important/, 'Homepage policy links must use compact, wrapping footer typography');
assert.match(confirmationStyles, /\.footer-policy-links\{display:flex;flex-wrap:wrap;gap:var\(--space-2\) var\(--space-4\);[^}]*font-size:\.75rem!important/, 'Confirmation policy links must match the homepage footer treatment');
assert.doesNotMatch(page, /<footer[\s\S]*qualification-link/, 'Footer must not repeat the primary application action');
assert.doesNotMatch(page, /class="[^"]*disclaimer/i, 'Footer legal copy must avoid blocker-sensitive disclaimer class names');
assert.equal((page.match(/class="site-footer-note"/g) ?? []).length, 3, 'Expected three important footer notes');
assert.match(page, /<section class="site-footer-legal" aria-label="Legal disclaimers">\s*<div class="site-footer-notes">/, 'Footer disclaimers must remain complete and permanently visible without a visible section heading');
assert.doesNotMatch(page, />Important disclaimers</, 'Footer must not show an Important disclaimers heading');
assert.match(page, /\.site-footer-note\{display:block;visibility:visible;font-size:\.625rem;font-weight:400;line-height:1\.25\}/, 'Footer note line boxes must stay visibly rendered with compact, unbolded fine-print typography');
assert.match(page, /\.site-footer-note h3\{display:inline;color:inherit;font:inherit\}/, 'Footer note headings must inherit the parent fine-print line box');
assert.match(page, /<h3>Earnings Disclaimer<\/h3>/, 'Footer must include the earnings disclaimer');
assert.match(page, /<h3>Medical Information Disclaimer<\/h3>/, 'Footer must include the medical information disclaimer');
assert.match(page, /<h3>AI Disclaimer<\/h3>/, 'Footer must include the AI disclaimer');
assert.match(page, /beta-user guarantee concerns onboarding beta users and is not a guarantee of sales, revenue, or profit/, 'Earnings disclaimer must limit the beta-user guarantee');
assert.match(page, /does not practice medicine or provide medical advice, diagnosis, or treatment/, 'Medical disclaimer must state the medical-information boundary');
assert.match(page, /AI-generated information may be incomplete, inaccurate, or outdated/, 'AI disclaimer must state the model-output boundary');
assert.equal((page.match(/<section class="[^"]*card[^"]*"/g) ?? []).length, 1, 'The closing CTA must remain the only section-level card');
assert.match(page, /<h2 id="founder-highlight-title">Why Kodara exists\.<\/h2>/, 'Founder section must use the concise company-story framing');
assert.match(page, /class="founder-principle"/, 'Founder section must end with the guiding principle');

// Proof, FAQ, and accessibility.
assert.equal((page.match(/class="proof-snapshot-logo proof-snapshot-logo--/g) ?? []).length, 6, 'Authority wall must contain six healthcare logos');
assert.match(page, /<p class="proof-snapshot-logo-label">Trusted by companies like:<\/p>/, 'Homepage authority strip must use the approved title');
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
