import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  GENERIC_COPY,
  analyticsProperties,
  copyForRegion,
  isApprovedRegion,
} from '../assets/js/region-personalization.mjs';

test('approved regions produce exact personalized copy', () => {
  assert.equal(
    copyForRegion('California'),
    'We’re currently helping health and wellness business owners in California build the AI Version of their expertise.',
  );
  assert.equal(isApprovedRegion('Newfoundland and Labrador'), true);
});

test('unknown region produces exact generic copy', () => {
  assert.equal(copyForRegion('England'), GENERIC_COPY);
  assert.equal(
    GENERIC_COPY,
    'We’re currently helping health and wellness business owners build the AI Version of their expertise.',
  );
});

test('analytics accepts only personalization and approved visitor region', () => {
  const result = analyticsProperties({
    personalization: 'region',
    visitor_region: 'California',
    ip: '198.51.100.42',
    clientIp: '198.51.100.42',
  });

  assert.deepEqual(result, {
    personalization: 'region',
    visitor_region: 'California',
  });
  assert.equal(JSON.stringify(result).includes('198.51.100.42'), false);
});

test('invalid analytics context is reduced to generic fields', () => {
  assert.deepEqual(analyticsProperties({
    personalization: 'region',
    visitor_region: 'England',
  }), {
    personalization: 'generic',
    visitor_region: null,
  });
});

test('public production files contain no API secret or server environment reference', async () => {
  const publicFiles = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../assets/js/region-personalization.mjs', import.meta.url), 'utf8'),
  ]);
  const bundle = publicFiles.join('\n');

  assert.doesNotMatch(bundle, /IPWHOIS_API_KEY|kodara-triager-ipwhois|test-secret|key=/);
});
