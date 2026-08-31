import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const homepage = readFileSync(resolve(root, 'index.html'), 'utf8');
const confirmation = readFileSync(resolve(root, 'confirmation/index.html'), 'utf8');

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

test('homepage follows the approved qualification narrative', () => {
  const content = body(homepage);
  const orderedMarkers = [
    'class="site-hero"',
    'class="homepage-stats"',
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

test('homepage stat row uses the four approved verified figures', () => {
  const content = body(homepage);
  const stats = content.match(/<section class="homepage-stats"[\s\S]*?<\/section>/u)?.[0] ?? '';

  assert.equal((stats.match(/class="homepage-stat(?:\s[^"]*)?"/gu) ?? []).length, 4, 'Homepage needs exactly four stat cards');
  assert.match(stats, />350\+<\/strong>/u);
  assert.match(stats, />100,000\+<\/strong>/u);
  assert.match(stats, />30 days<\/strong>/u);
  assert.match(stats, />10<\/strong>/u);
  assert.match(stats, /qualifying clients/iu, 'Offer-timeline stats must retain their qualifying-client boundary');
});

test('homepage keeps the approved integrations and one final qualification action', () => {
  const content = body(homepage);
  assert.match(homepage, /https:\/\/t\.kodarahealth\.com\/v1\//u, 'Click tracking must remain in the page');
  assert.match(content, /id="vidalytics_embed_CA0308FsT4_Z8w5E"/u, 'The approved VSL must remain');
  assert.match(content, /id="kodara-triager"/u, 'The live qualification widget target must remain');
  assert.match(content, /https:\/\/embed\.kodara\.com\/v1\/widget\.js/u, 'The live qualification widget script must remain');

  const qualificationLinks = [...content.matchAll(/<a\b[^>]*class="[^"]*qualification-link[^"]*"[^>]*>/gu)].map((match) => match[0]);
  assert.equal(qualificationLinks.length, 1, 'Homepage must use one final qualification action outside the live widget');
  assert.match(qualificationLinks[0], /href="#kodara-triager"/u, 'The final qualification action must return to the live widget');
});

test('approved process and client proof remain visible', () => {
  const content = body(homepage);
  const process = content.match(/<section class="mechanism-features"[\s\S]*?<\/section>/u)?.[0] ?? '';
  assert.doesNotMatch(process, /\shidden(?:\s|>)/u, 'The three-step process must be visible');
  assert.match(process, /Share what you know\./u);
  assert.match(process, /Review what we build\./u);
  assert.match(process, /Launch and onboard users\./u);

  for (const proof of ['Sandra Parker', 'Leanne Ellington', 'Dr. Vora', 'Ashley']) {
    assert.match(content, new RegExp(proof.replace('.', '\\.')), `Client proof must retain ${proof}`);
  }
});
