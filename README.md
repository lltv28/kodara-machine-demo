# Kodara Machine Demo

Mobile-test deployment of the self-contained Kodara sales flywheel demo.

Live site: https://lltv28.github.io/kodara-machine-demo/

## Release checks

Run the dependency-free checks before publishing:

```sh
node tools/check-release.mjs
node tools/check-triager-lattice.mjs
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
