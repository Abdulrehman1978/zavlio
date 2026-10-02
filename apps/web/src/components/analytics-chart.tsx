'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type AnalyticsChartRow = Record<string, number | string>;

export function AnalyticsChart({
  title,
  description,
  data,
  xKey,
  series,
  kind = 'bar',
}: Readonly<{
  title: string;
  description: string;
  data: AnalyticsChartRow[];
  xKey: string;
  series: Array<{ key: string; label: string; color: string }>;
  kind?: 'bar' | 'line';
}>) {
  if (data.length === 0)
    return <p className="crm-empty-inline">No data is available for this period.</p>;
  const Chart = kind === 'line' ? LineChart : BarChart;
  return (
    <figure className="analytics-chart" aria-labelledby={`${xKey}-chart-title`}>
      <figcaption>
        <strong id={`${xKey}-chart-title`}>{title}</strong>
        <span>{description}</span>
      </figcaption>
      <div role="img" aria-label={`${title}. ${description}`} className="analytics-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            {series.map((item) =>
              kind === 'line' ? (
                <Line
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  isAnimationActive={false}
                />
              ) : (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  isAnimationActive={false}
                />
              ),
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
