import { z } from 'zod';

export const METRICS_DEFINITION_VERSION = 1 as const;
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata' as const;
export const ACTIVE_SCORE_MODEL = 'ZAVLIO_LEAD_V1' as const;
export const ANALYTICS_PRESETS = [
  '7d',
  '30d',
  '90d',
  'this_month',
  'last_month',
  'this_quarter',
  'ytd',
  'custom',
] as const;
export type AnalyticsPreset = (typeof ANALYTICS_PRESETS)[number];
export type AnalyticsTab = 'overview' | 'acquisition' | 'leads' | 'pipeline' | 'operations';

const DAY = 86_400_000;
const KOLKATA_OFFSET = 330 * 60_000;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export type AnalyticsRange = {
  preset: AnalyticsPreset;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  startDate: string;
  endDateInclusive: string;
  days: number;
};

export type MetricComparison = {
  current: number;
  previous: number;
  delta: number;
  percentChange: number | null;
  label: string;
};

export type CurrencyAmount = {
  currency: string;
  amount: number;
  knownCount: number;
  unknownCount: number;
};
export type ChartDatum = { label: string; value: number; secondary?: number };

function kolkataDateParts(now: Date) {
  const shifted = new Date(now.getTime() + KOLKATA_OFFSET);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function utcBoundary(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - KOLKATA_OFFSET);
}

function dateString(date: Date): string {
  const shifted = new Date(date.getTime() + KOLKATA_OFFSET);
  return shifted.toISOString().slice(0, 10);
}

function parseDateBoundary(value: string): Date {
  if (!isoDate.test(value)) throw new Error('Dates must use YYYY-MM-DD.');
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const boundary = utcBoundary(year, month - 1, day);
  if (dateString(boundary) !== value) throw new Error('The custom date is invalid.');
  return boundary;
}

export function parseAnalyticsRange(
  input: { range?: string; from?: string; to?: string },
  options: { now?: Date; defaultDays?: number; maxDays?: number } = {},
): AnalyticsRange {
  const now = options.now ?? new Date();
  const defaultDays = options.defaultDays ?? 30;
  const maxDays = options.maxDays ?? 730;
  const preset = ANALYTICS_PRESETS.includes(input.range as AnalyticsPreset)
    ? (input.range as AnalyticsPreset)
    : (`${defaultDays}d` as AnalyticsPreset);
  const today = kolkataDateParts(now);
  const tomorrow = utcBoundary(today.year, today.month, today.day + 1);
  let start: Date;
  let end = tomorrow;
  let previousStart: Date;
  let previousEnd: Date;

  if (preset === 'custom') {
    if (!input.from || !input.to) throw new Error('Custom ranges require from and to dates.');
    start = parseDateBoundary(input.from);
    end = new Date(parseDateBoundary(input.to).getTime() + DAY);
    previousEnd = start;
    previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  } else if (preset === 'this_month') {
    start = utcBoundary(today.year, today.month, 1);
    previousStart = utcBoundary(today.year, today.month - 1, 1);
    previousEnd = start;
  } else if (preset === 'last_month') {
    start = utcBoundary(today.year, today.month - 1, 1);
    end = utcBoundary(today.year, today.month, 1);
    previousStart = utcBoundary(today.year, today.month - 2, 1);
    previousEnd = start;
  } else if (preset === 'this_quarter') {
    const quarter = Math.floor(today.month / 3) * 3;
    start = utcBoundary(today.year, quarter, 1);
    previousStart = utcBoundary(today.year, quarter - 3, 1);
    previousEnd = start;
  } else if (preset === 'ytd') {
    start = utcBoundary(today.year, 0, 1);
    previousStart = utcBoundary(today.year - 1, 0, 1);
    previousEnd = utcBoundary(today.year - 1, today.month, today.day + 1);
  } else {
    const days = Number.parseInt(preset, 10);
    start = new Date(end.getTime() - days * DAY);
    previousEnd = start;
    previousStart = new Date(start.getTime() - days * DAY);
  }

  if (start >= end) throw new Error('The report start must be before its end.');
  const days = Math.ceil((end.getTime() - start.getTime()) / DAY);
  if (days > maxDays) throw new Error(`Analytics ranges cannot exceed ${maxDays} days.`);
  return {
    preset,
    start: start.toISOString(),
    end: end.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(),
    startDate: dateString(start),
    endDateInclusive: dateString(new Date(end.getTime() - DAY)),
    days,
  };
}

export function metricComparison(current: number, previous: number): MetricComparison {
  const delta = current - previous;
  const percentChange = previous === 0 ? null : (delta / previous) * 100;
  return {
    current,
    previous,
    delta,
    percentChange,
    label:
      previous === 0 && current > 0
        ? 'New'
        : percentChange === null
          ? '—'
          : `${percentChange.toFixed(1)}%`,
  };
}

export function conversionRate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : (numerator / denominator) * 100;
}

export function closedWinRate(won: number, lost: number): number | null {
  return conversionRate(won, won + lost);
}

export function coverageRate(known: number, population: number): number | null {
  return conversionRate(known, population);
}

export function bucketInterval(days: number): 'day' | 'week' | 'month' {
  return days <= 31 ? 'day' : days <= 180 ? 'week' : 'month';
}

export function normalizeSource(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized || 'unattributed';
}

export function groupCurrencyAmounts(
  rows: Array<{ currency: string; amount: number | string | null }>,
): CurrencyAmount[] {
  const grouped = new Map<string, CurrencyAmount>();
  for (const row of rows) {
    const currency = row.currency.toUpperCase();
    const current = grouped.get(currency) ?? {
      currency,
      amount: 0,
      knownCount: 0,
      unknownCount: 0,
    };
    if (row.amount === null) current.unknownCount += 1;
    else {
      current.amount += Number(row.amount);
      current.knownCount += 1;
    }
    grouped.set(currency, current);
  }
  return [...grouped.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

export function shapeChartData(
  rows: Array<Record<string, unknown>>,
  labelKey: string,
  valueKey: string,
): ChartDatum[] {
  return rows.map((row) => ({
    label: z.string().parse(row[labelKey]),
    value: z.coerce.number().parse(row[valueKey]),
  }));
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number | null): string {
  return value === null
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 1 }).format(
        value / 100,
      );
}

export function formatCurrency(value: number, currency: string, compact = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}
