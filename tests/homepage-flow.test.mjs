import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const homepage = readFileSync(resolve(root, 'index.html'), 'utf8');
const confirmation = readFileSync(resolve(root, 'confirmation/index.html'), 'utf8');
const confirmationStyles = readFileSync(resolve(root, 'confirmation/styles.css'), 'utf8');

function body(source) {
  return source.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
}

function header(source) {
  return body(source).match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[1] ?? '';
}

function position(source, marker) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `Missing expected page marker: ${marker}`);
  return index;
}

test('both public pages use a centered logo-only header', () => {
  for (const [name, source] of [['homepage', homepage], ['confirmation', confirmation]]) {
    const content = header(source);
    assert.match(content, /class="brand"/u, `${name} header must retain the linked Kodara brand`);
    assert.equal((content.match(/<a\b/gu) ?? []).length, 1, `${name} header must contain only the brand link`);
    assert.doesNotMatch(content, /<nav\b|cta-btn|header-state/u, `${name} header must not contain navigation, an action, or status text`);
  }
});

test('both public pages use the compact shared header-to-hero rhythm', () => {
  assert.match(homepage, /\.site-header\{[^}]*margin-bottom:var\(--space-4\)/u);
  assert.match(homepage, /\.site-hero\{[^}]*padding:var\(--space-6\) 0 clamp\(32px,5vw,64px\)/u);
  assert.match(
    homepage,
    /@media\(max-width:720px\)[\s\S]*?\.site-header\{min-height:56px;margin-bottom:var\(--space-4\)\}[\s\S]*?\.site-hero\{padding:var\(--space-5\) 0 var\(--space-7\)\}/u,
  );

  assert.match(confirmationStyles, /\.wrap\{[^}]*padding:var\(--space-4\) 0 var\(--space-9\)/u);
  assert.match(confirmationStyles, /\.confirmation-hero\{[^}]*padding:var\(--space-6\) 0 clamp\(32px,5vw,64px\)/u);
  assert.match(
    confirmationStyles,
    /@media\(max-width:720px\)[\s\S]*?\.wrap\{padding-top:var\(--space-4\)\}[\s\S]*?\.confirmation-hero\{padding:var\(--space-5\) 0 var\(--space-7\)\}/u,
  );
});

test('homepage follows the approved qualification narrative', () => {
  const content = body(homepage);
  const orderedMarkers = [
    'class="site-hero"',
    'class="homepage-stats"',
    'class="search-demand-section"',
    'class="mechanism-features"',
    'class="case-studies"',
    'class="founder-highlight"',
    'class="faq"',
    'class="card cta"',
    'class="site-footer"',
  ];

  const positions = orderedMarkers.map((marker) => position(content, marker));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'Homepage sections must follow the approved order');

  for (const removedSection of ['education-section', 'audience-section', 'credibility-section', 'proof-snapshot']) {
    assert.doesNotMatch(content, new RegExp(`<section class="${removedSection}"`), `${removedSection} must not remain in the visible homepage flow`);
  }
  assert.doesNotMatch(content, /class="section-cta"/u, 'Intermediate qualification actions must be removed');
});

test('homepage presents the supplied animated online-demand chart before the build process', () => {
  const content = body(homepage);
  const section = content.match(/<section class="search-demand-section"[\s\S]*?<\/section>/u)?.[0] ?? '';

  assert.match(section, /Health and wellness demand is exploding online\./u);
  assert.match(section, /People are already searching online for answers, options, and experts they can trust\./u);
  assert.match(section, /data-search-demand-chart/u);
  assert.match(section, /data-estimates-url="assets\/data\/search-estimates\.json"/u);
  assert.match(section, /data-cues-url="assets\/data\/motion-cues\.json"/u);
  assert.match(section, /<svg[^>]*data-search-demand-plot[^>]*role="img"[^>]*aria-labelledby="search-demand-keyword search-demand-description"/u);
  assert.match(section, /Illustrative estimates\. Search interest indexed to 2016 = 100\./u);
  assert.doesNotMatch(section, /<iframe|<canvas/u, 'The chart must remain native SVG');
  assert.match(homepage, /<script type="module" src="assets\/js\/search-demand-chart\.mjs"><\/script>/u);
  assert.ok(position(content, 'class="homepage-stats"') < position(content, 'class="search-demand-section"'));
  assert.ok(position(content, 'class="search-demand-section"') < position(content, 'class="mechanism-features"'));
});

test('homepage stat row uses the four approved verified figures', () => {
  const content = body(homepage);
  const stats = content.match(/<section class="homepage-stats"[\s\S]*?<\/section>/u)?.[0] ?? '';

  assert.equal((stats.match(/class="homepage-stat(?:\s[^"]*)?"/gu) ?? []).length, 4, 'Homepage needs exactly four stat cards');
  assert.match(stats, />350\+<\/strong>/u);
  assert.match(stats, />\$50M\+<\/strong>/u);
  assert.match(stats, />105,000\+<\/strong>/u);
  assert.match(stats, />30\+<\/strong>/u);
  assert.match(stats, /running their businesses online with Kodara/iu);
  assert.match(stats, /Revenue generated by our team for online knowledge-based products/iu);
  assert.match(stats, /Leads &amp; consultations generated by our team and used to train the Kodara AI model/iu);
  assert.match(stats, /Health, wellness, and medical modalities where we have helped clients create their AI/iu);
  assert.match(stats, /<article class="homepage-stat homepage-stat--compact">\s*<strong>105,000\+<\/strong>/u, 'The longest stat needs its compact display treatment');
});

test('homepage keeps the approved integrations and one final qualification action', () => {
  const content = body(homepage);
  assert.match(homepage, /https:\/\/t\.kodarahealth\.com\/v1\//u, 'Click tracking must remain in the page');
  assert.match(content, /id="vidalytics_embed_0r6h3jNKkbcixe_K"/u, 'The approved VSL must remain');
  assert.match(content, /id="kodara-triager"/u, 'The live qualification widget target must remain');
  assert.match(content, /https:\/\/embed\.kodara\.com\/v1\/widget\.js/u, 'The live qualification widget script must remain');

  const qualificationLinks = [...content.matchAll(/<a\b[^>]*class="[^"]*qualification-link[^"]*"[^>]*>/gu)].map((match) => match[0]);
  assert.equal(qualificationLinks.length, 1, 'Homepage must use one final qualification action outside the live widget');
  assert.match(qualificationLinks[0], /href="#kodara-triager"/u, 'The final qualification action must return to the live widget');
});

test('approved process and client proof remain visible', () => {
  const content = body(homepage);
  const demand = content.match(/<section class="search-demand-section"[\s\S]*?<\/section>/u)?.[0] ?? '';
  const process = content.match(/<section class="mechanism-features"[\s\S]*?<\/section>/u)?.[0] ?? '';
  const stories = content.match(/<section class="case-studies"[\s\S]*?<\/section>/u)?.[0] ?? '';
  const faq = content.match(/<section class="faq"[\s\S]*?<\/section>/u)?.[0] ?? '';
  assert.match(demand, /Health and wellness demand is exploding online\./u);
  assert.doesNotMatch(process, /\shidden(?:\s|>)/u, 'The three-step process must be visible');
  assert.doesNotMatch(process, /class="mechanism-demo"/u, 'The three-step process must not use decorative image boxes');
  assert.match(process, /Give us one hour a week\. We handle the build, launch, and beta-user onboarding\./u);
  assert.match(process, /Share what you know\./u);
  assert.match(process, /Review what we build\./u);
  assert.match(process, /Launch and onboard users\./u);
  assert.equal((process.match(/class="mechanism-step"/gu) ?? []).length, 3, 'Each process card needs a clear step label');

  assert.match(stories, /Results From Other Health &amp; Wellness Experts We've Worked With/u);
  assert.match(stories, /See what became possible when these experts turned their knowledge into something that could reach more people without requiring more one-to-one work\./u);
  assert.match(faq, /Everything you need to know before you apply\./u);
  assert.match(faq, /What we build, how it works, what we need from you, and what happens next\./u);

  const resultCards = [...stories.matchAll(/<article class="client-result-card(?:\s[^"]*)?">([\s\S]*?)<\/article>/gu)].map((match) => match[1]);
  assert.equal(resultCards.length, 2, 'Only Dr. Vora and Ashley should retain concise result summaries');
  assert.equal((stories.match(/class="client-result-points"/gu) ?? []).length, 2, 'Each result summary needs its own supporting facts');
  assert.equal((stories.match(/class="client-result-person"/gu) ?? []).length, 2, 'Each result summary needs a client identity row');
  assert.equal((stories.match(/class="client-result-avatar(?:\s[^"]*)?"/gu) ?? []).length, 2, 'Each result summary needs a circular client avatar');
  assert.match(stories, /class="client-result-avatar client-result-avatar--mirrored" src="assets\/testimonials\/amit-vora\.jpg"[^>]*alt="Amit N\. Vora"/u, 'Dr. Vora must use the approved mirrored portrait');
  assert.match(stories, /class="client-result-avatar client-result-avatar--mirrored" src="assets\/testimonials\/ashley-holly\.jpg"[^>]*alt="Ashley"/u, 'Ashley must use the approved mirrored portrait without publishing her last name');
  for (const card of resultCards) {
    assert.equal((card.match(/<li>/gu) ?? []).length, 2, 'Each result summary must contain exactly two supporting facts');
  }
  assert.match(stories, /class="testimonial-stars" aria-hidden="true">(?:<span>★<\/span>){5}<\/div>/u, 'The testimonial bridge must contain five decorative gold star icons');
  assert.match(stories, /I’m now on track to make double what I made last year\. My business feels consistent now, and I’m able to enjoy it more\./u, 'The testimonial bridge must use Sandra’s approved combined quote');
  assert.ok(position(stories, 'class="testimonial-spotlight"') < position(stories, 'class="case-support-grid"'), 'The featured quote must introduce the deeper video stories');
  assert.doesNotMatch(stories, /class="client-results-grid"/u, 'Result summaries should share the video-story grid instead of forming a separate section');
  const videoStories = stories.match(/<div class="case-support-grid" aria-label="Client stories and results">([\s\S]*?)<\/div>\s*<p class="case-studies-close"/u)?.[1] ?? '';
  assert.equal((videoStories.match(/<article class="case-support(?:\s[^"]*)?"/gu) ?? []).length, 4, 'Sandra, Dr. Mike, Leanne, and Martyn need distinct video-story cards');
  assert.equal((videoStories.match(/<article class="client-result-card(?:\s[^"]*)?">/gu) ?? []).length, 2, 'Dr. Vora and Ashley must sit in the same proof grid as the videos');
  assert.match(videoStories, /<article class="case-support case-support--portrait"[^>]*>[\s\S]*?media-id="6oj2gj3wqt"/u, 'Sandra’s story must use the taller portrait-card treatment');
  assert.match(videoStories, /media-id="6oj2gj3wqt"/u, 'Sandra’s video must remain in the paired story grid');
  assert.match(videoStories, /class="case-media case-media--portrait-fit">\s*<div class="case-portrait-player">\s*<wistia-player media-id="6oj2gj3wqt"/u, 'Sandra’s portrait video must retain a dedicated 3:4 frame instead of being cropped into widescreen');
  assert.match(videoStories, /class="case-portrait-player case-portrait-player--nine-sixteen">\s*<wistia-player media-id="b3djcgwuvz" aspect="0\.5625" aria-label="Dr\. Mike client testimonial video">/u, 'Dr. Mike’s approved Wistia testimonial must retain its portrait frame and accessible name');
  assert.match(videoStories, /On track to double last year without adding a hundred more calls\./u, 'Sandra’s story must lead with her supported growth and fewer-calls outcome');
  assert.match(videoStories, /After failing with 4 competitors, he launched in 30 days with us\./u, 'Dr. Mike’s story must lead with the approved implementation milestone');
  assert.match(videoStories, /<strong>Dr\. Mike<\/strong><span>Power-Up Sports Psychology<\/span>/u, 'Dr. Mike’s story must identify his business');
  assert.doesNotMatch(videoStories, /\$100,?000/u, 'Dr. Mike’s future revenue goal must not be presented as a testimonial result');
  assert.match(videoStories, /<article class="case-support case-support--paired"[^>]*>[\s\S]*?media-id="fay3lgo8op"/u, 'Leanne’s story must begin the paired desktop proof row');
  assert.match(videoStories, /A virtual business that gave her time to pursue the work she really wanted\./u);
  assert.match(videoStories, /<strong>Leanne Ellington<\/strong><span>Neuroscience educator<\/span>/u, 'Leanne’s story must use the approved role');
  assert.match(videoStories, /<article class="case-support case-support--paired"[^>]*aria-labelledby="martyn-case-title">[\s\S]*?media-id="fhngly43sb"/u, 'Martyn’s portrait story must sit beside Leanne in the paired desktop proof row');
  assert.match(videoStories, /Turned five years of ideas into a launched first prototype\./u, 'Martyn’s story must use the transcript-supported outcome');
  assert.match(videoStories, /<strong>Martyn Buffler<\/strong><span>CEO, The Cancer Battle Plan<\/span>/u, 'Martyn’s story must use the approved business role');
  assert.equal((videoStories.match(/<span>What changed<\/span>/gu) ?? []).length, 4, 'Every video story must frame the build around the client’s desired change');
  assert.match(stories, /30\+ patients enrolled in five weeks, beyond the limits of his appointment calendar\./u);
  assert.match(stories, /Replaced in-person classes with an AI business in two months\./u);
  assert.match(stories, /You already have the expertise\. The next step is turning it into something that can work beyond your calendar\./u);

  assert.match(homepage, /@media\(max-width:720px\)\{[\s\S]*?\.client-result-card--ashley\{order:1\}[\s\S]*?\.client-result-card--vora\{order:2\}/u, 'Mobile proof summaries must show Ashley before Dr. Vora');
  for (const proof of ['Sandra Parker', 'Leanne Ellington', 'Martyn Buffler', 'Dr. Vora', 'Ashley']) {
    assert.match(content, new RegExp(proof.replace('.', '\\.')), `Client proof must retain ${proof}`);
  }
});

test('confirmation page follows the approved proof-first post-booking flow', () => {
  const content = body(confirmation);
  const orderedMarkers = [
    'class="confirmation-hero"',
    'id="case-study"',
    'id="client-stories"',
    'class="press-library"',
    'class="faq-video-library"',
    'id="full-presentation"',
    'class="final-reminder"',
  ];
  const positions = orderedMarkers.map((marker) => position(content, marker));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'Confirmation sections must follow the approved post-booking order');

  for (const marker of [
    'id="call-confirmation"',
    'class="call-details-widget"',
    'media-id="1mynmgx2fa"',
    'id="vidalytics_embed_CA0308FsT4_Z8w5E"',
    'class="press-library"',
    'class="site-footer"',
  ]) assert.match(content, new RegExp(marker), `Confirmation flow must preserve ${marker}`);

  assert.equal((content.match(/class="faq-video-card"/gu) ?? []).length, 10, 'Confirmation must retain all ten FAQ videos');
  assert.match(content, /Real Results: Real Behind-the-Scenes Numbers From One of Our Clients\./u);
  assert.match(content, /See what we built, how it was launched, and the real client numbers behind the result\./u);
  assert.doesNotMatch(content, /class="confirmation-stats"|class="search-demand-section"|class="mechanism-features"|class="founder-highlight"/u, 'The focused confirmation sequence must not restore homepage education sections');
  assert.doesNotMatch(content, /id="kodara-triager"|region-personalization/iu, 'Post-booking confirmation must not add the homepage qualification or personalization runtime');
});

test('confirmation page uses the current six-client proof', () => {
  const content = body(confirmation);
  const stories = content.match(/<section class="case-studies"[\s\S]*?<\/section>/u)?.[0] ?? '';
  assert.match(stories, /Results From Other Health &amp; Wellness Experts We've Worked With/u);
  assert.match(stories, /class="testimonial-stars" aria-hidden="true">(?:<span>★<\/span>){5}<\/div>/u);
  assert.match(stories, /I’m now on track to make double what I made last year/u);
  assert.equal((stories.match(/<article class="case-support(?:\s[^"]*)?"/gu) ?? []).length, 4);
  assert.equal((stories.match(/<article class="client-result-card(?:\s[^"]*)?">/gu) ?? []).length, 2);
  for (const mediaId of ['6oj2gj3wqt', 'b3djcgwuvz', 'fay3lgo8op', 'fhngly43sb']) assert.match(stories, new RegExp(`media-id="${mediaId}"`));
  assert.match(stories, /After failing with 4 competitors, he launched in 30 days with us\./u);
  assert.match(stories, /Power-Up Sports Psychology/u);
  assert.match(stories, /Neuroscience educator/u);
  assert.match(stories, /Turned five years of ideas into a launched first prototype\./u);
  assert.match(stories, /Martyn Buffler/u);
  assert.match(stories, /CEO, The Cancer Battle Plan/u);
  assert.match(stories, /Dr\. Vora/u);
  assert.match(stories, /Ashley/u);

});

test('confirmation page shares current visual tokens and small assets', () => {
  const styles = readFileSync(resolve(root, 'confirmation/styles.css'), 'utf8');
  assert.match(confirmation, /href="styles\.css\?v=20260901-martyn-proof"/u, 'Confirmation stylesheet changes must bypass stale browser caches');
  for (const token of ['--border-subtle:#DCE8E5', '--border-default:#CBDCDA', '--border-strong:#A9C5C1', '--line-2:var(--border-default)']) {
    assert.match(styles, new RegExp(token.replace(/[()]/gu, '\\$&')));
  }
  assert.match(styles, /\.homepage-stat\{[^}]*border:1px solid var\(--line-2\)/u);
  assert.match(styles, /\.case-support\{[^}]*border:1px solid var\(--line-2\)/u);
  assert.match(styles, /\.press-logo\{[^}]*height:clamp\(46px,5vw,64px\)/u, 'Press logo slot must visibly exceed the previous 40px cap');
  assert.match(styles, /\.press-wordmark\{[^}]*height:auto;[^}]*max-width:78%;[^}]*max-height:100%/u, 'Press wordmarks must override intrinsic HTML heights while preserving aspect ratio');
  assert.match(styles, /@media\(max-width:390px\)[\s\S]*?\.brand img\{width:104px\}/u);
  for (const size of ['48', '192', '512']) assert.match(confirmation, new RegExp(`favicon-${size}\\.png`));
  assert.doesNotMatch(body(confirmation), /[—–]/u, 'Confirmation visible copy must not contain em or en dashes');
});
