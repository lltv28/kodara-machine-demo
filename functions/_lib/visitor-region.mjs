const LOOKUP_TIMEOUT_MS = 350;
const IPWHOIS_PAID_ENDPOINT = 'https://ipwhois.pro';
const REQUESTED_FIELDS = 'success,country_code,region_code,region,security';

const SUBDIVISION_NAMES = {
  US: {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
    KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
    MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
    NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
    NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
    OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  },
  CA: {
    AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
    NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', ON: 'Ontario',
    PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan',
  },
};

export const GENERIC_RESULT = Object.freeze({
  personalization: 'generic',
  visitor_region: null,
});

function approvedSubdivision(countryCode, regionCode) {
  return SUBDIVISION_NAMES[countryCode]?.[regionCode.toUpperCase()] ?? null;
}

function parseProviderResult(value) {
  if (!value || typeof value !== 'object' || value.success !== true) return null;
  if (!['US', 'CA'].includes(value.country_code)) return null;
  if (typeof value.region_code !== 'string' || !/^\w{2,3}$/.test(value.region_code.trim())) return null;
  if (typeof value.region !== 'string' || value.region.trim().length < 2 || value.region.trim().length > 80) return null;
  if (value.security && typeof value.security === 'object' && Object.values(value.security).some(Boolean)) return null;
  return approvedSubdivision(value.country_code, value.region_code.trim());
}

export async function lookupVisitorRegion(ip, options = {}) {
  const apiKey = options.apiKey?.trim();
  if (!apiKey || typeof ip !== 'string' || !ip.trim() || ip.length > 64) return null;

  const controller = new AbortController();
  let timeout;
  const timedOut = new Promise((resolve) => {
    timeout = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, options.timeoutMs ?? LOOKUP_TIMEOUT_MS);
  });

  const url = new URL(`${IPWHOIS_PAID_ENDPOINT}/${encodeURIComponent(ip.trim())}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('fields', REQUESTED_FIELDS);

  const requested = (options.fetch ?? globalThis.fetch)(url.toString(), {
    headers: { accept: 'application/json' },
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) return null;
    return parseProviderResult(await response.json());
  }).catch(() => null);

  try {
    return await Promise.race([requested, timedOut]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveVisitorRegion(request, env, options = {}) {
  const ip = request.headers.get('CF-Connecting-IP')?.trim();
  if (!ip) return GENERIC_RESULT;
  const region = await lookupVisitorRegion(ip, {
    ...options,
    apiKey: env?.IPWHOIS_API_KEY,
  });
  return region
    ? { personalization: 'region', visitor_region: region }
    : GENERIC_RESULT;
}
