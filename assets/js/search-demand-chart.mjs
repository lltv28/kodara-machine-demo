export const CHART_SCALE = Object.freeze({ minimum: 70, maximum: 1050 });
export const LANDING_SEQUENCE_DURATION_MS = 16000;

const COMPLETE_HOLD_MS = 2000;
const RESET_DURATION_MS = 500;

export const QUARTER_PATTERNS = Object.freeze([
  Object.freeze([0.025, -0.018, 0.035]),
  Object.freeze([-0.015, 0.03, -0.012]),
  Object.freeze([0.018, -0.026, 0.028]),
]);

export function expandQuarterly(anchors, seriesIndex) {
  const values = [];
  anchors.slice(0, -1).forEach((start, yearIndex) => {
    const end = anchors[yearIndex + 1];
    const pattern = QUARTER_PATTERNS[(seriesIndex + yearIndex) % QUARTER_PATTERNS.length];
    values.push(start);
    for (let quarter = 1; quarter < 4; quarter += 1) {
      const base = start + ((end - start) * quarter) / 4;
      const varied = Math.round(base * (1 + pattern[quarter - 1]));
      const finalStep = end - Math.max(2, Math.round((end - start) * 0.08));
      values.push(Math.max(75, Math.min(finalStep, varied)));
    }
  });
  values.push(anchors.at(-1));
  return values;
}

export function buildSearchSeries(payload) {
  if (payload?.display_scale?.minimum !== CHART_SCALE.minimum || payload?.display_scale?.maximum !== CHART_SCALE.maximum) {
    throw new Error('Search chart must retain the shared 70-1050 scale.');
  }
  const series = payload.series.map((item, index) => ({
    name: item.keyword,
    values: expandQuarterly(item.annual_anchor_values, index),
  }));
  if (!series.every((item) => item.values.length === 41 && item.values.at(-1) > item.values.at(-2) && item.values.at(-1) / item.values[0] >= 5)) {
    throw new Error('Search series must contain 41 quarterly points, end with an increase, and show at least 5x illustrative growth.');
  }
  return series;
}

export function getCueOffsetsMs(payload) {
  const sequence = payload?.search_sequence;
  const offsets = sequence?.estimated_keyword_cues?.map(({ relative_start: seconds }) => Math.round(seconds * 1000));
  const durationMs = Math.round(sequence?.duration * 1000);
  const isValid = Array.isArray(offsets)
    && offsets.length > 0
    && offsets.every((offset, index) => Number.isFinite(offset) && offset >= 0 && (index === 0 || offset > offsets[index - 1]))
    && Number.isFinite(durationMs)
    && offsets.at(-1) < durationMs;
  if (!isValid) throw new Error('Search chart cues must be finite, ordered, and complete before the sequence ends.');
  return offsets;
}

export function scaleCueOffsetsMs(payload, durationMs = LANDING_SEQUENCE_DURATION_MS) {
  const sourceDurationMs = Math.round(payload?.search_sequence?.duration * 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0 || !Number.isFinite(sourceDurationMs) || sourceDurationMs <= 0) {
    throw new Error('Search chart playback durations must be positive and finite.');
  }
  return getCueOffsetsMs(payload).map((offset) => Math.round((offset * durationMs) / sourceDurationMs));
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const DESKTOP_LAYOUT = Object.freeze({
  width: 1680,
  height: 650,
  left: 82,
  right: 1620,
  bottom: 518,
  verticalSpan: 491,
  yearLabelY: 570,
  axisTitleY: 630,
  axisFontSize: 26,
  years: [2016, 2018, 2020, 2022, 2024, 2026],
});
const MOBILE_LAYOUT = Object.freeze({
  width: 680,
  height: 560,
  left: 70,
  right: 650,
  bottom: 438,
  verticalSpan: 388,
  yearLabelY: 500,
  axisTitleY: 545,
  axisFontSize: 24,
  years: [2016, 2020, 2024, 2026],
});
const GRID_VALUES = Object.freeze([100, 400, 700, 1000]);

const svgElement = (name, attributes = {}) => {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  Object.entries(attributes).forEach(([attribute, value]) => element.setAttribute(attribute, String(value)));
  return element;
};

const yPosition = (value, layout) => layout.bottom
  - ((value - CHART_SCALE.minimum) / (CHART_SCALE.maximum - CHART_SCALE.minimum)) * layout.verticalSpan;

const xPosition = (index, layout) => layout.left + ((layout.right - layout.left) / 40) * index;

function renderAxes(svg, layout) {
  const grid = svgElement('g', { class: 'chart-grid', 'aria-hidden': 'true' });
  GRID_VALUES.forEach((value) => {
    const y = yPosition(value, layout);
    grid.appendChild(svgElement('line', { x1: layout.left, y1: y, x2: layout.right, y2: y }));
  });
  svg.appendChild(grid);
  svg.appendChild(svgElement('line', {
    class: 'chart-baseline',
    x1: layout.left,
    y1: yPosition(100, layout),
    x2: layout.right,
    y2: yPosition(100, layout),
    'aria-hidden': 'true',
  }));

  const axis = svgElement('g', { class: 'chart-axis', 'aria-hidden': 'true' });
  GRID_VALUES.forEach((value) => {
    const label = svgElement('text', {
      class: 'chart-axis-label',
      x: layout.left - 22,
      y: yPosition(value, layout) + 9,
      'font-size': layout.axisFontSize,
      'text-anchor': 'end',
    });
    label.textContent = value.toLocaleString('en-US');
    axis.appendChild(label);
  });
  layout.years.forEach((year) => {
    const index = (year - 2016) * 4;
    const label = svgElement('text', {
      class: 'chart-axis-label',
      x: xPosition(index, layout),
      y: layout.yearLabelY,
      'font-size': layout.axisFontSize,
      'text-anchor': year === 2016 ? 'start' : year === 2026 ? 'end' : 'middle',
    });
    label.textContent = String(year);
    axis.appendChild(label);
  });
  const title = svgElement('text', {
    class: 'chart-axis-label',
    x: layout.left,
    y: layout.axisTitleY,
    'font-size': layout.axisFontSize,
    'text-anchor': 'start',
  });
  title.textContent = 'Relative search-interest index';
  axis.appendChild(title);
  svg.appendChild(axis);
}

function renderSeries(svg, series, layout) {
  const root = svgElement('g', { class: 'chart-trends' });
  svg.appendChild(root);
  series.forEach((item, index) => {
    const points = item.values
      .map((value, pointIndex) => `${xPosition(pointIndex, layout)},${yPosition(value, layout).toFixed(1)}`)
      .join(' ');
    const line = svgElement('polyline', {
      class: 'trend-line',
      points,
      'data-series': index,
      'aria-label': `${item.name} estimated search-interest trend`,
    });
    root.appendChild(line);
    const length = line.getTotalLength();
    line.dataset.length = String(length);
    line.style.strokeDasharray = String(length);
    line.style.strokeDashoffset = String(length);

    root.appendChild(svgElement('circle', {
      class: 'trend-dot',
      cx: xPosition(40, layout),
      cy: yPosition(item.values.at(-1), layout),
      r: 12,
      'data-dot': index,
      'aria-hidden': 'true',
    }));
  });
}

function drawChart(root, svg, series, step) {
  const narrow = root.getBoundingClientRect().width <= 620;
  const layout = narrow ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
  root.dataset.chartLayout = narrow ? 'mobile' : 'desktop';
  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  svg.replaceChildren(svg.querySelector('desc'));
  renderAxes(svg, layout);
  renderSeries(svg, series, layout);
  return step;
}

export async function initSearchDemandChart(root) {
  const svg = root.querySelector('[data-search-demand-plot]');
  const keyword = root.querySelector('[data-search-demand-keyword]');
  const multiple = root.querySelector('[data-search-demand-multiple]');
  const fallback = root.querySelector('[data-search-demand-fallback]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timers = [];
  let currentStep = 0;
  let isInPlaybackRange = false;
  let observer = null;

  const clearTimers = () => {
    timers.forEach(window.clearTimeout);
    timers = [];
  };

  try {
    const [estimatesResponse, cuesResponse] = await Promise.all([
      fetch(root.dataset.estimatesUrl),
      fetch(root.dataset.cuesUrl),
    ]);
    if (!estimatesResponse.ok || !cuesResponse.ok) throw new Error('Search chart data could not be loaded.');

    const [estimates, cues] = await Promise.all([estimatesResponse.json(), cuesResponse.json()]);
    const series = buildSearchSeries(estimates);
    const cueOffsetsMs = scaleCueOffsetsMs(cues);
    const cueNames = cues.search_sequence.estimated_keyword_cues.map(({ keyword: name }) => name);
    if (cueOffsetsMs.length !== series.length || cueNames.some((name, index) => name !== series[index].name)) {
      throw new Error('Search chart cue order must match all nine series.');
    }

    const setSearchStep = (step, animate = true) => {
      const bounded = Math.max(0, Math.min(series.length, step));
      currentStep = bounded;
      root.dataset.chartStep = String(bounded);
      svg.querySelectorAll('.trend-line').forEach((line, index) => {
        line.classList.toggle('is-visible', index < bounded);
        line.classList.toggle('is-current', index === bounded - 1);
        const length = line.dataset.length;
        if (index < bounded) {
          if (animate && index === bounded - 1) {
            requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
          } else {
            line.style.strokeDashoffset = '0';
          }
        } else {
          line.style.strokeDashoffset = length;
        }
      });
      svg.querySelectorAll('.trend-dot').forEach((dot, index) => {
        dot.classList.toggle('is-current', index === bounded - 1);
      });

      if (bounded === 0) {
        keyword.textContent = 'Search demand is rising';
        multiple.textContent = 'Across every category';
        return;
      }
      const item = series[bounded - 1];
      keyword.textContent = item.name;
      multiple.textContent = `${(item.values.at(-1) / item.values[0]).toFixed(1)}x since 2016`;
      if (animate && typeof keyword.animate === 'function') {
        [keyword, multiple].forEach((element) => element.animate([
          { opacity: 0.35, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }));
      }
    };

    const redraw = () => {
      drawChart(root, svg, series, currentStep);
      setSearchStep(currentStep, false);
    };
    redraw();
    root.dataset.chartState = 'ready';

    const scheduleCycle = () => {
      clearTimers();
      root.classList.remove('is-resetting');
      root.dataset.chartState = 'playing';
      setSearchStep(0, false);
      cueOffsetsMs.forEach((offset, index) => {
        timers.push(window.setTimeout(() => setSearchStep(index + 1), offset));
      });
      timers.push(window.setTimeout(() => {
        root.dataset.chartState = 'complete';
      }, LANDING_SEQUENCE_DURATION_MS));
      timers.push(window.setTimeout(() => {
        if (!isInPlaybackRange) return;
        root.dataset.chartState = 'resetting';
        root.classList.add('is-resetting');
      }, LANDING_SEQUENCE_DURATION_MS + COMPLETE_HOLD_MS));
      timers.push(window.setTimeout(() => {
        if (isInPlaybackRange) scheduleCycle();
      }, LANDING_SEQUENCE_DURATION_MS + COMPLETE_HOLD_MS + RESET_DURATION_MS));
    };

    let renderedNarrow = root.getBoundingClientRect().width <= 620;
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? root.getBoundingClientRect().width;
      const nextNarrow = nextWidth <= 620;
      if (nextNarrow === renderedNarrow) return;
      renderedNarrow = nextNarrow;
      redraw();
    }) : null;
    resizeObserver?.observe(root);

    if (reduceMotion.matches) {
      root.dataset.chartState = 'complete';
      setSearchStep(series.length, false);
    } else if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        const nextInPlaybackRange = entries.some((entry) => entry.isIntersecting);
        if (nextInPlaybackRange === isInPlaybackRange) return;
        isInPlaybackRange = nextInPlaybackRange;
        if (isInPlaybackRange) {
          scheduleCycle();
        } else {
          clearTimers();
          [keyword, multiple].forEach((element) => element.getAnimations?.().forEach((animation) => animation.cancel()));
          root.classList.remove('is-resetting');
          root.dataset.chartState = 'paused';
        }
      }, { rootMargin: '180px 0px', threshold: 0.01 });
      observer.observe(root);
    } else {
      isInPlaybackRange = true;
      scheduleCycle();
    }

    window.addEventListener('pagehide', () => {
      clearTimers();
      observer?.disconnect();
      resizeObserver?.disconnect();
    }, { once: true });
  } catch (error) {
    root.dataset.chartState = 'error';
    svg.hidden = true;
    fallback.hidden = false;
  }
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-search-demand-chart]');
  const isEmbeddedWidget = document.documentElement.classList.contains('embed-mode');
  if (root && !isEmbeddedWidget) initSearchDemandChart(root);
}
