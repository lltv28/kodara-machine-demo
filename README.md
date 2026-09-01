# Kodara AI Version of You Landing Page

Kodara's healthcare landing page, hosted on Cloudflare Pages.

Live site: https://kodarahealth.com/

Post-booking page: `/confirmation/`

The confirmation page uses the approved Vidalytics call-confirmation video, iClosed call-details widget, production Vidalytics presentation, one Wistia case study, three Wistia client stories, and ten Wistia FAQ videos from the Kodara project. It also shares the homepage's four proof stats, illustrative search-demand chart, three-step process, five-client proof system, founder story, and core visual tokens.

The confirmation page press grid links to four verified features from Business Insider, Yahoo Finance, AP News, and MSN using local article captures and publisher wordmarks.

The hero uses a Cloudflare Pages Function at `/api/visitor-region` to resolve an allowlisted US state or Canadian province. The function reads only Cloudflare's trusted `CF-Connecting-IP` header and keeps `IPWHOIS_API_KEY` in the server environment. The browser receives only the approved region name or a generic result.

## Release checks

Run the dependency-free checks before publishing:

```sh
node tools/check-release.mjs
node tools/check-triager-lattice.mjs
node --test tests/*.test.mjs
```

Production budgets:

- Largest Contentful Paint: 2.5 seconds or faster at the 75th percentile.
- Interaction to Next Paint: 200 milliseconds or faster at the 75th percentile.
- Cumulative Layout Shift: 0.1 or lower at the 75th percentile.
- `index.html`: 140 KiB maximum.
- `tools/video-capture.html`: 205 KiB maximum.

Pre-publish browser matrix:

- iPhone Safari at 360px and 390px.
- Android Chrome at 360px and 390px.
- iPad portrait.
- Edge, Chrome, and Firefox desktop.
- 320px reflow, 200% zoom, increased text spacing, keyboard-only navigation, and reduced motion.
- Slow-network loading and the mobile scheduler path.
