import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHART_SCALE,
  QUARTER_PATTERNS,
  buildSearchSeries,
  getCueOffsetsMs,
} from '../assets/js/search-demand-chart.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const estimatesPath = resolve(root, 'assets/data/search-estimates.json');
const cuesPath = resolve(root, 'assets/data/motion-cues.json');
const estimatesSource = readFileSync(estimatesPath, 'utf8');
const cuesSource = readFileSync(cuesPath, 'utf8');
const chartModuleSource = readFileSync(resolve(root, 'assets/js/search-demand-chart.mjs'), 'utf8');
const estimates = JSON.parse(estimatesSource);
const cues = JSON.parse(cuesSource);

const digest = (source) => createHash('sha256').update(source).digest('hex');

test('chart assets preserve the supplied illustrative data and motion cues exactly', () => {
  assert.equal(digest(estimatesSource), 'ec531fe1f20ee1136006b05ff46b6bd22840acea83eed5cb011741e530de8574');
  assert.equal(digest(cuesSource), '4c2d57a333d50425fc4588d13c845e45e5c01177d0c3eb72cc0e38bec8aaa142');
});

test('chart model keeps the source scale, quarterly variation, and all nine series', () => {
  assert.deepEqual(CHART_SCALE, { minimum: 70, maximum: 1050 });
  assert.deepEqual(QUARTER_PATTERNS, [
    [0.025, -0.018, 0.035],
    [-0.015, 0.03, -0.012],
    [0.018, -0.026, 0.028],
  ]);

  const series = buildSearchSeries(estimates);
  assert.deepEqual(series.map(({ name }) => name), [
    'Anxiety',
    'ADHD',
    'Depression',
    'Vitamin deficiencies',
    'GLP-1s',
    'Peptides',
    'Diabetes and metabolic health',
    'Hormonal health',
    'Autoimmune diseases',
  ]);
  assert.ok(series.every(({ values }) => values.length === 41));
  assert.ok(series.every(({ values }) => values[0] === 100));
  assert.ok(series.every(({ values }) => values.some((value, index) => index > 0 && value < values[index - 1])));
  assert.deepEqual(series.map(({ values }) => values.at(-1)), [520, 710, 510, 610, 1000, 860, 650, 760, 550]);
});

test('chart schedule follows the supplied transcript-relative cue order and duration', () => {
  assert.deepEqual(getCueOffsetsMs(cues), [1710, 2710, 3710, 4710, 6110, 7110, 8010, 9710, 10910]);
  assert.equal(cues.search_sequence.duration, 12.53);
  assert.equal(cues.motion_language.easing, 'cubic-bezier(0.16, 1, 0.3, 1)');
});

test('chart rejects cue schedules that are unordered or outlast the sequence', () => {
  const unordered = structuredClone(cues);
  unordered.search_sequence.estimated_keyword_cues[1].relative_start = 1;
  assert.throws(() => getCueOffsetsMs(unordered), /finite, ordered/u);

  const incomplete = structuredClone(cues);
  incomplete.search_sequence.duration = 10;
  assert.throws(() => getCueOffsetsMs(incomplete), /before the sequence ends/u);
});

test('chart runtime triggers once in view and completes immediately for reduced motion', () => {
  assert.match(chartModuleSource, /new IntersectionObserver/u);
  assert.match(chartModuleSource, /observer\.disconnect\(\)/u);
  assert.match(chartModuleSource, /prefers-reduced-motion: reduce/u);
  assert.match(chartModuleSource, /setSearchStep\(series\.length, false\)/u);
  assert.match(chartModuleSource, /nextNarrow === renderedNarrow/u);
  assert.match(chartModuleSource, /classList\.contains\('embed-mode'\)/u);
  assert.doesNotMatch(chartModuleSource, /addEventListener\(['"]scroll/u);
});
