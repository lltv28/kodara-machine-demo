const APPROVED_REGIONS = new Set([
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec',
  'Saskatchewan',
]);

const STORAGE_KEY = 'kodara:visitor-region';

export const GENERIC_COPY = 'We’re currently helping health and wellness business owners build the AI Version of their expertise.';

export function isApprovedRegion(region) {
  return typeof region === 'string' && APPROVED_REGIONS.has(region);
}

export function copyForRegion(region) {
  return isApprovedRegion(region)
    ? `We’re currently helping health and wellness business owners in ${region} build the AI Version of their expertise.`
    : GENERIC_COPY;
}

export function analyticsProperties(context) {
  const region = context?.personalization === 'region' && isApprovedRegion(context.visitor_region)
    ? context.visitor_region
    : null;
  return {
    personalization: region ? 'region' : 'generic',
    visitor_region: region,
  };
}

function track(context) {
  const analytics = window.posthog;
  if (analytics && typeof analytics.capture === 'function') {
    analytics.capture('visitor_region_personalization', analyticsProperties(context));
  }
}

async function initialize() {
  if (document.documentElement.classList.contains('embed-mode')) return;
  const subheadline = document.getElementById('hero-region-subheadline');
  if (!subheadline) return;

  try {
    const cachedRegion = sessionStorage.getItem(STORAGE_KEY);
    if (isApprovedRegion(cachedRegion)) {
      subheadline.textContent = copyForRegion(cachedRegion);
      track({ personalization: 'region', visitor_region: cachedRegion });
      return;
    }
  } catch {}

  let context = { personalization: 'generic', visitor_region: null };
  try {
    const response = await fetch('/api/visitor-region', {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (response.ok) context = analyticsProperties(await response.json());
  } catch {}

  if (context.personalization === 'region') {
    subheadline.textContent = copyForRegion(context.visitor_region);
    try { sessionStorage.setItem(STORAGE_KEY, context.visitor_region); } catch {}
  }
  track(context);
}

if (typeof document !== 'undefined') initialize();
