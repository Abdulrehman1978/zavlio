import { describe, expect, it } from 'vitest';
import {
  ACTIVE_SCORE_MODEL,
  BUSINESS_TIME_ZONE,
  METRICS_DEFINITION_VERSION,
  bucketInterval,
  closedWinRate,
  conversionRate,
  coverageRate,
  formatCurrency,
  groupCurrencyAmounts,
  metricComparison,
  normalizeSource,
  parseAnalyticsRange,
  shapeChartData,
} from '@zavlio/crm';

const now = new Date('2026-09-28T12:00:00.000Z');

describe('Packet 12 reporting domain', () => {
  it('publishes the stable metric contract', () => {
    expect(METRICS_DEFINITION_VERSION).toBe(1);
    expect(BUSINESS_TIME_ZONE).toBe('Asia/Kolkata');
    expect(ACTIVE_SCORE_MODEL).toBe('ZAVLIO_LEAD_V1');
  });

  it('uses a 30-day default with Kolkata [start,end) boundaries', () => {
    const range = parseAnalyticsRange({}, { now });
    expect(range.start).toBe('2026-08-29T18:30:00.000Z');
    expect(range.end).toBe('2026-09-28T18:30:00.000Z');
    expect(range.days).toBe(30);
  });

  it('uses the prior calendar month for last-month comparison', () => {
    const range = parseAnalyticsRange({ range: 'last_month' }, { now });
    expect(range.start).toBe('2026-07-31T18:30:00.000Z');
    expect(range.end).toBe('2026-08-31T18:30:00.000Z');
    expect(range.previousStart).toBe('2026-06-30T18:30:00.000Z');
  });

  it('parses custom dates inclusively for people and exclusively for SQL', () => {
    const range = parseAnalyticsRange(
      { range: 'custom', from: '2026-09-01', to: '2026-09-30' },
      { now },
    );
    expect(range.start).toBe('2026-08-31T18:30:00.000Z');
    expect(range.end).toBe('2026-09-30T18:30:00.000Z');
  });

  it('rejects invalid and oversized custom ranges', () => {
    expect(() =>
      parseAnalyticsRange({ range: 'custom', from: '2026-02-30', to: '2026-03-02' }, { now }),
    ).toThrow('invalid');
    expect(() =>
      parseAnalyticsRange({ range: 'custom', from: '2020-01-01', to: '2026-01-01' }, { now }),
    ).toThrow('730');
  });

  it('uses a non-misleading zero-denominator comparison', () => {
    expect(metricComparison(5, 0)).toMatchObject({ percentChange: null, label: 'New' });
    expect(metricComparison(0, 0)).toMatchObject({ percentChange: null, label: '—' });
  });

  it('calculates conversion and coverage without inventing zero', () => {
    expect(conversionRate(2, 10)).toBe(20);
    expect(coverageRate(5, 0)).toBeNull();
  });

  it('uses closed outcomes only for win rate', () => {
    expect(closedWinRate(3, 2)).toBe(60);
    expect(closedWinRate(0, 0)).toBeNull();
  });

  it('keeps currencies separate and exposes unknown values', () => {
    expect(
      groupCurrencyAmounts([
        { currency: 'INR', amount: 1000 },
        { currency: 'USD', amount: 20 },
        { currency: 'INR', amount: null },
      ]),
    ).toEqual([
      { currency: 'INR', amount: 1000, knownCount: 1, unknownCount: 1 },
      { currency: 'USD', amount: 20, knownCount: 1, unknownCount: 0 },
    ]);
  });

  it('normalizes missing source as unattributed rather than direct', () => {
    expect(normalizeSource(null)).toBe('unattributed');
    expect(normalizeSource(' LinkedIn ')).toBe('linkedin');
  });

  it('chooses bounded trend intervals', () => {
    expect(bucketInterval(31)).toBe('day');
    expect(bucketInterval(32)).toBe('week');
    expect(bucketInterval(181)).toBe('month');
  });

  it('shapes chart contracts deterministically', () => {
    expect(shapeChartData([{ source: 'direct', people: '2' }], 'source', 'people')).toEqual([
      { label: 'direct', value: 2 },
    ]);
  });

  it('uses Indian grouping for INR', () => {
    expect(formatCurrency(1250000, 'INR')).toContain('12,50,000');
  });
});
