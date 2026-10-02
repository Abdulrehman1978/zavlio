import {
  BUSINESS_TIME_ZONE,
  formatCount,
  formatCurrency,
  formatPercent,
  metricComparison,
  parseAnalyticsRange,
  type AnalyticsTab,
} from '@zavlio/crm';
import { AnalyticsChart, type AnalyticsChartRow } from '../../../components/analytics-chart';
import { CrmShell } from '../../../components/crm-shell';
import { loadAnalyticsReport } from '../../../lib/crm/analytics';
import { requireCrmPage } from '../../../lib/crm/page';
import { serverEnv } from '../../../lib/env/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const tabs: Array<[AnalyticsTab, string]> = [
  ['overview', 'Overview'],
  ['acquisition', 'Acquisition'],
  ['leads', 'Leads'],
  ['pipeline', 'Pipeline'],
  ['operations', 'Operations'],
];
const presets = [
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['90d', 'Last 90 days'],
  ['this_month', 'This month'],
  ['last_month', 'Last month'],
  ['this_quarter', 'This quarter'],
  ['ytd', 'Year to date'],
  ['custom', 'Custom'],
] as const;

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Row => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
const record = (value: unknown): Row =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
const number = (value: unknown): number => (typeof value === 'number' ? value : Number(value ?? 0));
const text = (value: unknown): string =>
  value === null || value === undefined ? '—' : String(value);

function Stat({
  label,
  value,
  context,
  href,
}: Readonly<{ label: string; value: string; context: string; href?: string }>) {
  const body = (
    <>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{context}</small>
    </>
  );
  return href ? (
    <a className="crm-stat" href={href}>
      {body}
    </a>
  ) : (
    <div className="crm-stat">{body}</div>
  );
}

function ComparisonStat({
  label,
  current,
  previous,
}: Readonly<{ label: string; current: number; previous: number }>) {
  const comparison = metricComparison(current, previous);
  return (
    <Stat
      label={label}
      value={formatCount(current)}
      context={`Previous ${formatCount(previous)} · ${comparison.label}`}
    />
  );
}

function DataTable({
  caption,
  columns,
  data,
}: Readonly<{ caption: string; columns: Array<[string, string]>; data: Row[] }>) {
  if (data.length === 0)
    return (
      <p className="crm-empty-inline">
        No {caption.toLowerCase()} data is available for this period.
      </p>
    );
  return (
    <div className="crm-table-wrap">
      <table className="crm-table analytics-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={`${text(row[columns[0]![0]])}-${index}`}>
              {columns.map(([key]) => (
                <td key={key}>{text(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CurrencyCards({
  title,
  values,
  context,
}: Readonly<{ title: string; values: Row[]; context: string }>) {
  if (values.length === 0) return <Stat label={title} value="—" context="No known value" />;
  return (
    <>
      {values.map((value) => (
        <Stat
          key={text(value.currency)}
          label={`${title} — ${text(value.currency)}`}
          value={formatCurrency(number(value.amount), text(value.currency))}
          context={`${formatCount(number(value.knownCount))} valued · ${formatCount(number(value.unknownCount))} without value · ${context}`}
        />
      ))}
    </>
  );
}

function Overview({ data }: Readonly<{ data: Row }>) {
  const current = record(data.current);
  const previous = record(data.previous);
  const funnel = record(data.trackedFunnel);
  const trend = rows(data.trend);
  const trendData = trend.map((item) => ({
    date: text(item.date).slice(5),
    sessions: number(item.sessions),
    enquiries: number(item.enquiries),
    opportunities: number(item.opportunities),
    won: number(item.won),
  }));
  return (
    <>
      <div className="crm-stat-grid">
        <ComparisonStat
          label="Tracked visitors"
          current={number(current.trackedVisitors)}
          previous={number(previous.trackedVisitors)}
        />
        <ComparisonStat
          label="Tracked sessions"
          current={number(current.trackedSessions)}
          previous={number(previous.trackedSessions)}
        />
        <ComparisonStat
          label="Enquiries"
          current={number(current.enquiries)}
          previous={number(previous.enquiries)}
        />
        <ComparisonStat
          label="New identified people"
          current={number(current.newPeople)}
          previous={number(previous.newPeople)}
        />
        <ComparisonStat
          label="Opportunities created"
          current={number(current.opportunitiesCreated)}
          previous={number(previous.opportunitiesCreated)}
        />
        <ComparisonStat
          label="Won transitions"
          current={number(current.wonTransitions)}
          previous={number(previous.wonTransitions)}
        />
        <CurrencyCards
          title="Open pipeline value now"
          values={rows(data.openPipelineValue)}
          context="current snapshot"
        />
        <CurrencyCards
          title="Won opportunity value"
          values={rows(data.wonOpportunityValue)}
          context="transitions in period; not revenue"
        />
        <Stat
          label="Overdue tasks now"
          value={formatCount(number(current.overdueTasksNow))}
          context="current snapshot"
          href="/crm/tasks?scope=overdue"
        />
      </div>
      <section className="crm-card" aria-labelledby="tracked-funnel-title">
        <h2 id="tracked-funnel-title">Tracked visitor funnel</h2>
        <p className="crm-note">
          Only selected-period tracked visitors and canonical people linked to that cohort are
          included downstream.
        </p>
        <ol className="analytics-funnel">
          <li>
            <strong>{formatCount(number(funnel.trackedVisitors))}</strong> Tracked visitors
          </li>
          <li>
            <strong>{formatCount(number(funnel.attributedPeople))}</strong> Attributed people
          </li>
          <li>
            <strong>{formatCount(number(funnel.peopleWithOpportunity))}</strong> People with
            opportunity
          </li>
          <li>
            <strong>{formatCount(number(funnel.wonPeople))}</strong> Won people
          </li>
        </ol>
      </section>
      <AnalyticsChart
        title="Selected-period activity"
        description="Tracked sessions, successful enquiries, opportunities created, and Won transitions by Asia/Kolkata day."
        data={trendData as AnalyticsChartRow[]}
        xKey="date"
        kind="line"
        series={[
          { key: 'sessions', label: 'Sessions', color: '#175b9d' },
          { key: 'enquiries', label: 'Enquiries', color: '#7a4b12' },
          { key: 'opportunities', label: 'Opportunities', color: '#5c3b8a' },
          { key: 'won', label: 'Won transitions', color: '#21603a' },
        ]}
      />
      <DataTable
        caption="Exact activity trend values"
        data={trend}
        columns={[
          ['date', 'Date'],
          ['sessions', 'Tracked sessions'],
          ['enquiries', 'Enquiries'],
          ['opportunities', 'Opportunities created'],
          ['won', 'Won transitions'],
        ]}
      />
    </>
  );
}

function Acquisition({ data }: Readonly<{ data: Row }>) {
  const first = rows(data.firstTouch);
  const chart = first.map((item) => ({
    source: text(item.source),
    visitors: number(item.tracked_visitors),
  }));
  return (
    <div className="analytics-sections">
      <section>
        <h2>First-touch acquisition</h2>
        <p className="crm-note">Browser first source. Descriptive attribution, not causality.</p>
        <AnalyticsChart
          title="Tracked visitors by first touch"
          description="Consented tracked browser visitors first seen in the selected period."
          data={chart as AnalyticsChartRow[]}
          xKey="source"
          series={[{ key: 'visitors', label: 'Tracked visitors', color: '#175b9d' }]}
        />
        <DataTable
          caption="First-touch source"
          data={first}
          columns={[
            ['source', 'Source'],
            ['tracked_visitors', 'Tracked visitors'],
            ['attributed_people', 'Attributed people'],
          ]}
        />
      </section>
      <section>
        <h2>Latest tracked session source</h2>
        <DataTable
          caption="Latest-touch session source"
          data={rows(data.latestTouch)}
          columns={[
            ['source', 'Source'],
            ['sessions', 'Sessions'],
            ['tracked_visitors', 'Tracked visitors'],
          ]}
        />
      </section>
      <section>
        <h2>Self-reported / intake source</h2>
        <DataTable
          caption="Self-reported source"
          data={rows(data.selfReported)}
          columns={[
            ['source', 'Source'],
            ['people', 'New people'],
          ]}
        />
      </section>
      <section>
        <h2>UTM campaigns</h2>
        <DataTable
          caption="UTM source, medium, and campaign"
          data={rows(data.utm)}
          columns={[
            ['source', 'Source'],
            ['medium', 'Medium'],
            ['campaign', 'Campaign'],
            ['sessions', 'Sessions'],
            ['tracked_visitors', 'Tracked visitors'],
          ]}
        />
      </section>
      <section>
        <h2>Landing pages</h2>
        <DataTable
          caption="Session landing pages"
          data={rows(data.landingPages)}
          columns={[
            ['path', 'Landing page'],
            ['sessions', 'Sessions'],
            ['tracked_visitors', 'Tracked visitors'],
          ]}
        />
      </section>
      <section>
        <h2>Public content engagement</h2>
        <DataTable
          caption="Consented content engagement"
          data={rows(data.content)}
          columns={[
            ['event_name', 'Event'],
            ['content', 'Content'],
            ['views', 'Views'],
            ['tracked_visitors', 'Tracked visitors'],
          ]}
        />
      </section>
    </div>
  );
}

function Leads({ data }: Readonly<{ data: Row }>) {
  const intent = rows(data.intentDistribution);
  const chart = intent.map((item) => ({ intent: text(item.intent), people: number(item.people) }));
  const population = number(data.currentPopulation),
    scored = number(data.currentScored);
  return (
    <div className="analytics-sections">
      <div className="crm-stat-grid">
        <Stat
          label="Current-model score coverage"
          value={formatPercent(population ? (scored / population) * 100 : null)}
          context={`${formatCount(scored)} of ${formatCount(population)} canonical people · ${text(data.scoreModel)}`}
        />
        <Stat
          label="Unscored people"
          value={formatCount(number(data.currentUnscored))}
          context="current snapshot"
        />
        <Stat
          label="Stale scores"
          value={formatCount(number(data.currentStale))}
          context="older than 24 hours"
        />
      </div>
      <section>
        <h2>Current score distribution</h2>
        <AnalyticsChart
          title="Intent distribution"
          description={`Latest ${text(data.scoreModel)} score for each canonical, non-archived person.`}
          data={chart as AnalyticsChartRow[]}
          xKey="intent"
          series={[{ key: 'people', label: 'People', color: '#5c3b8a' }]}
        />
        <DataTable
          caption="Current intent distribution"
          data={intent}
          columns={[
            ['intent', 'Intent'],
            ['people', 'People'],
          ]}
        />
      </section>
      <section>
        <h2>Lead quality by source</h2>
        <p className="crm-note">
          Sample size is always visible. Unscored people are excluded from averages, never treated
          as zero.
        </p>
        <DataTable
          caption="Lead quality by first-touch fallback source"
          data={rows(data.leadQualityBySource)}
          columns={[
            ['source', 'Source'],
            ['leads', 'Leads (N)'],
            ['scored_leads', 'Scored'],
            ['average_score', 'Average score'],
            ['median_score', 'Median score'],
            ['high_plus', 'HIGH+'],
            ['priority', 'PRIORITY'],
            ['people_with_opportunity', 'People with opportunity'],
            ['won_people', 'Won people'],
          ]}
        />
      </section>
      <section>
        <h2>Service interest</h2>
        <DataTable
          caption="Declared enquiries by service"
          data={rows(data.declaredServices)}
          columns={[
            ['service', 'Service'],
            ['people', 'People'],
          ]}
        />
        <DataTable
          caption="Current primary affinity"
          data={rows(data.currentPrimaryAffinity)}
          columns={[
            ['service', 'Service'],
            ['people', 'People'],
          ]}
        />
      </section>
      <section>
        <h2>CRM lead funnel</h2>
        <p className="crm-note">
          All canonical people created in the period, including non-consent and direct CRM leads.
        </p>
        <DataTable
          caption="CRM lead funnel"
          data={[record(data.crmFunnel)]}
          columns={[
            ['people', 'New people'],
            ['people_with_opportunity', 'People with opportunity'],
            ['won_people', 'Won people'],
          ]}
        />
      </section>
    </div>
  );
}

function Pipeline({ data }: Readonly<{ data: Row }>) {
  const stages = rows(data.stages);
  const chart = stages.map((item) => ({
    stage: text(item.name),
    opportunities: number(item.opportunities),
  }));
  return (
    <div className="analytics-sections">
      <div className="crm-stat-grid">
        <Stat
          label="Opportunities created"
          value={formatCount(number(data.opportunitiesCreated))}
          context="selected period"
        />
        <Stat
          label="Won transitions"
          value={formatCount(number(data.wonTransitions))}
          context="selected period; reopened outcomes remain historical"
        />
        <Stat
          label="Lost transitions"
          value={formatCount(number(data.lostTransitions))}
          context="selected period"
        />
        <Stat
          label="Closed win rate"
          value={formatPercent(data.closedWinRate === null ? null : number(data.closedWinRate))}
          context="Won ÷ (Won + Lost) transitions"
        />
        <Stat
          label="Median close duration"
          value={data.medianCloseDays === null ? '—' : `${text(data.medianCloseDays)} days`}
          context="created to closed transition"
        />
      </div>
      <section>
        <h2>Current pipeline snapshot</h2>
        <AnalyticsChart
          title="Current opportunities by stage"
          description="Current stage now; this is not a historical pipeline snapshot."
          data={chart as AnalyticsChartRow[]}
          xKey="stage"
          series={[{ key: 'opportunities', label: 'Opportunities', color: '#175b9d' }]}
        />
        <DataTable
          caption="Current pipeline stage distribution"
          data={stages}
          columns={[
            ['name', 'Stage'],
            ['opportunities', 'Current opportunities'],
            ['median_stage_age_days', 'Median stage age (days)'],
          ]}
        />
        <DataTable
          caption="Known stage value by currency"
          data={rows(data.stageValues)}
          columns={[
            ['slug', 'Stage'],
            ['currency', 'Currency'],
            ['amount', 'Known value'],
            ['known_count', 'With value'],
            ['unknown_count', 'Without value'],
          ]}
        />
      </section>
      <section>
        <h2>Stage transitions</h2>
        <DataTable
          caption="Transitions in selected period"
          data={rows(data.transitions)}
          columns={[
            ['name', 'Stage entered'],
            ['transitions', 'Transitions'],
            ['is_won', 'Won stage'],
            ['is_closed', 'Closed stage'],
          ]}
        />
      </section>
      <section>
        <h2>Lost reasons</h2>
        <DataTable
          caption="Historical Lost transitions in selected period"
          data={rows(data.lostReasons)}
          columns={[
            ['reason', 'Reason'],
            ['losses', 'Lost transitions'],
          ]}
        />
      </section>
    </div>
  );
}

function Operations({ data }: Readonly<{ data: Row }>) {
  const byAssignee = rows(data.byAssignee);
  const chart = byAssignee.map((item) => ({
    assignee: text(item.assignee),
    open: number(item.open_tasks),
    overdue: number(item.overdue_now),
  }));
  return (
    <div className="analytics-sections">
      <div className="crm-stat-grid">
        <Stat
          label="Open tasks now"
          value={formatCount(number(data.openTasksNow))}
          context="current snapshot"
        />
        <Stat
          label="Overdue now"
          value={formatCount(number(data.overdueTasksNow))}
          context="current snapshot"
          href="/crm/tasks?scope=overdue"
        />
        <Stat
          label="Due today"
          value={formatCount(number(data.dueTodayNow))}
          context="Asia/Kolkata today"
          href="/crm/tasks?scope=today"
        />
        <Stat
          label="Unassigned now"
          value={formatCount(number(data.unassignedTasksNow))}
          context="current snapshot"
          href="/crm/tasks?scope=unassigned"
        />
        <Stat
          label="Completed tasks"
          value={formatCount(number(data.completedInPeriod))}
          context="completed_at in selected period"
          href="/crm/tasks?scope=completed"
        />
      </div>
      <section>
        <h2>Operational workload by assignee</h2>
        <p className="crm-note">
          Workload facts only; this is not an employee performance ranking.
        </p>
        <AnalyticsChart
          title="Current task workload"
          description="Open and overdue tasks by assignee."
          data={chart as AnalyticsChartRow[]}
          xKey="assignee"
          series={[
            { key: 'open', label: 'Open', color: '#175b9d' },
            { key: 'overdue', label: 'Overdue', color: '#7a4b12' },
          ]}
        />
        <DataTable
          caption="Task workload by assignee"
          data={byAssignee}
          columns={[
            ['assignee', 'Assignee'],
            ['open_tasks', 'Open now'],
            ['overdue_now', 'Overdue now'],
            ['due_today', 'Due today'],
            ['completed_in_period', 'Completed in period'],
          ]}
        />
      </section>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireCrmPage('/crm/analytics');
  const raw = await searchParams;
  const one = (key: string) => (Array.isArray(raw[key]) ? raw[key]?.[0] : raw[key]);
  const requestedTab = one('tab');
  const tab = tabs.some(([key]) => key === requestedTab)
    ? (requestedTab as AnalyticsTab)
    : 'overview';
  const range = parseAnalyticsRange(
    { range: one('range'), from: one('from'), to: one('to') },
    {
      defaultDays: serverEnv.CRM_ANALYTICS_DEFAULT_RANGE_DAYS,
      maxDays: serverEnv.CRM_ANALYTICS_MAX_RANGE_DAYS,
    },
  );
  const data = await loadAnalyticsReport(await createServerSupabaseClient(), tab, range);
  return (
    <CrmShell role={staff.staff.role}>
      <section aria-labelledby="analytics-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Trusted reporting · definition v1</p>
            <h1 id="analytics-title">CRM analytics</h1>
            <p>
              {range.startDate} – {range.endDateInclusive} · {BUSINESS_TIME_ZONE} · query-time
              current
            </p>
          </div>
        </header>
        <p className="analytics-caveat">
          <strong>Consent scope:</strong> tracked traffic covers only browsers that permitted
          first-party analytics. It is not total website traffic, and a visitor ID is not guaranteed
          to be one human.
        </p>
        <nav className="analytics-tabs" aria-label="Analytics sections">
          {tabs.map(([key, label]) => (
            <a
              key={key}
              aria-current={tab === key ? 'page' : undefined}
              href={`/crm/analytics?tab=${key}&range=${range.preset}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <form className="crm-filter-bar" method="get">
          <input type="hidden" name="tab" value={tab} />
          <label>
            Range
            <select name="range" defaultValue={range.preset}>
              {presets.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input name="from" type="date" defaultValue={one('from') ?? range.startDate} />
          </label>
          <label>
            To
            <input name="to" type="date" defaultValue={one('to') ?? range.endDateInclusive} />
          </label>
          <button type="submit">Apply range</button>
        </form>
        <p className="crm-note">
          Period metrics use [start, end) boundaries. Cards marked “now” are current snapshots and
          do not pretend to be historical.
        </p>
        {tab === 'overview' ? (
          <Overview data={data} />
        ) : tab === 'acquisition' ? (
          <Acquisition data={data} />
        ) : tab === 'leads' ? (
          <Leads data={data} />
        ) : tab === 'pipeline' ? (
          <Pipeline data={data} />
        ) : (
          <Operations data={data} />
        )}
      </section>
    </CrmShell>
  );
}
