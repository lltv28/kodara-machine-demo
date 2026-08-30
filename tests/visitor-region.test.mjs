import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GENERIC_RESULT,
  lookupVisitorRegion,
  resolveVisitorRegion,
} from '../functions/_lib/visitor-region.mjs';

const okJson = (body) => ({ ok: true, json: async () => body });

test('configured API key selects paid endpoint and exact requested fields', async () => {
  let requestedUrl;
  const fetch = async (url) => {
    requestedUrl = new URL(url);
    return okJson({ success: true, country_code: 'US', region_code: 'CA', region: 'California' });
  };

  const result = await lookupVisitorRegion('198.51.100.42', { apiKey: 'test-secret', fetch });

  assert.equal(result, 'California');
  assert.equal(requestedUrl.origin, 'https://ipwhois.pro');
  assert.equal(requestedUrl.pathname, '/198.51.100.42');
  assert.equal(requestedUrl.searchParams.get('key'), 'test-secret');
  assert.equal(requestedUrl.searchParams.get('fields'), 'success,country_code,region_code,region,security');
  assert.deepEqual([...requestedUrl.searchParams.keys()].sort(), ['fields', 'key']);
});

test('returns an allowlisted United States state', async () => {
  const fetch = async () => okJson({ success: true, country_code: 'US', region_code: 'NY', region: 'New York' });
  assert.equal(await lookupVisitorRegion('198.51.100.42', { apiKey: 'key', fetch }), 'New York');
});

test('returns an allowlisted Canadian province', async () => {
  const fetch = async () => okJson({ success: true, country_code: 'CA', region_code: 'NL', region: 'Newfoundland and Labrador' });
  assert.equal(await lookupVisitorRegion('2001:db8::1', { apiKey: 'key', fetch }), 'Newfoundland and Labrador');
});

test('missing security data does not block an approved region', async () => {
  const fetch = async () => okJson({ success: true, country_code: 'CA', region_code: 'ON', region: 'Ontario' });
  assert.equal(await lookupVisitorRegion('203.0.113.1', { apiKey: 'key', fetch }), 'Ontario');
});

test('unsupported country falls back to generic', async () => {
  const fetch = async () => okJson({ success: true, country_code: 'GB', region_code: 'ENG', region: 'England' });
  assert.equal(await lookupVisitorRegion('198.51.100.42', { apiKey: 'key', fetch }), null);
});

test('invalid provider response falls back to generic', async () => {
  const fetch = async () => okJson({ success: true, country_code: 'US', region_code: 'CA' });
  assert.equal(await lookupVisitorRegion('198.51.100.42', { apiKey: 'key', fetch }), null);
});

test('lookup exceeding timeout falls back to generic', async () => {
  const fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
  assert.equal(await lookupVisitorRegion('198.51.100.42', { apiKey: 'key', fetch, timeoutMs: 5 }), null);
});

test('missing environment key skips provider and returns generic', async () => {
  let called = false;
  const fetch = async () => { called = true; return okJson({}); };
  const request = new Request('https://example.com/api/visitor-region', {
    headers: { 'CF-Connecting-IP': '198.51.100.42' },
  });
  assert.deepEqual(await resolveVisitorRegion(request, {}, { fetch }), GENERIC_RESULT);
  assert.equal(called, false);
});

test('environment key selects paid endpoint and only Cloudflare trusted connecting IP is used', async () => {
  let requestedUrl;
  const fetch = async (url) => {
    requestedUrl = new URL(url);
    return okJson({ success: true, country_code: 'US', region_code: 'CA', region: 'California' });
  };
  const request = new Request('https://example.com/api/visitor-region', {
    headers: {
      'CF-Connecting-IP': '198.51.100.42',
      'X-Forwarded-For': '203.0.113.99',
    },
  });

  const result = await resolveVisitorRegion(request, { IPWHOIS_API_KEY: 'key' }, { fetch });

  assert.equal(requestedUrl.origin, 'https://ipwhois.pro');
  assert.equal(requestedUrl.pathname, '/198.51.100.42');
  assert.equal(requestedUrl.searchParams.get('key'), 'key');
  assert.deepEqual(result, { personalization: 'region', visitor_region: 'California' });
});

test('missing trusted IP returns generic without consulting forwarding headers', async () => {
  let called = false;
  const request = new Request('https://example.com/api/visitor-region', {
    headers: { 'X-Forwarded-For': '198.51.100.42' },
  });
  const result = await resolveVisitorRegion(request, { IPWHOIS_API_KEY: 'key' }, {
    fetch: async () => { called = true; return okJson({}); },
  });

  assert.deepEqual(result, GENERIC_RESULT);
  assert.equal(called, false);
});
