-- Zavlio Packet 12: RLS-safe, read-only CRM analytics reporting.

create or replace function public.assert_crm_analytics_range(p_start timestamptz, p_end timestamptz)
returns void
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not public.is_active_staff() then
    raise exception 'active staff authorization is required' using errcode = '42501';
  end if;
  if p_start is null or p_end is null or p_start >= p_end then
    raise exception 'invalid analytics range' using errcode = '22023';
  end if;
  if p_end - p_start > interval '730 days' then
    raise exception 'analytics range exceeds 730 days' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.crm_analytics_overview(
  p_start timestamptz, p_end timestamptz,
  p_previous_start timestamptz, p_previous_end timestamptz
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare result jsonb;
begin
  perform public.assert_crm_analytics_range(p_start, p_end);
  perform public.assert_crm_analytics_range(p_previous_start, p_previous_end);
  with
  selected_sessions as (
    select s.* from public.sessions s where s.started_at >= p_start and s.started_at < p_end
  ),
  previous_sessions as (
    select s.* from public.sessions s where s.started_at >= p_previous_start and s.started_at < p_previous_end
  ),
  tracked_people as (
    select distinct p.id
    from public.people p
    where p.merged_into_person_id is null and p.lifecycle_stage <> 'ARCHIVED'
      and p.created_at >= p_start and p.created_at < p_end
      and exists (
        select 1 from public.anonymous_visitors av
        where av.linked_person_id = p.id
          and exists (select 1 from selected_sessions ss where ss.visitor_id = av.id)
      )
  ),
  tracked_opportunities as (
    select distinct o.id, o.person_id from public.opportunities o join tracked_people tp on tp.id = o.person_id
  ),
  current_metrics as (
    select jsonb_build_object(
      'trackedVisitors', (select count(distinct visitor_id) from selected_sessions),
      'trackedSessions', (select count(*) from selected_sessions),
      'returningTrackedVisitors', (select count(distinct ss.visitor_id) from selected_sessions ss where exists (select 1 from public.sessions prior where prior.visitor_id = ss.visitor_id and prior.started_at < ss.started_at)),
      'trackedPageViews', (select count(*) from public.events e where e.event_name = 'page_viewed' and e.occurred_at >= p_start and e.occurred_at < p_end),
      'enquiries', (select count(*) from public.form_submissions f where f.status = 'PROCESSED' and f.submitted_at >= p_start and f.submitted_at < p_end),
      'startProjectEnquiries', (select count(*) from public.form_submissions f where f.status = 'PROCESSED' and f.form_type = 'START_A_PROJECT' and f.submitted_at >= p_start and f.submitted_at < p_end),
      'contactEnquiries', (select count(*) from public.form_submissions f where f.status = 'PROCESSED' and f.form_type = 'CONTACT' and f.submitted_at >= p_start and f.submitted_at < p_end),
      'newPeople', (select count(*) from public.people p where p.merged_into_person_id is null and p.lifecycle_stage <> 'ARCHIVED' and p.created_at >= p_start and p.created_at < p_end),
      'attributedPeople', (select count(*) from tracked_people),
      'opportunitiesCreated', (select count(*) from public.opportunities o where o.created_at >= p_start and o.created_at < p_end),
      'wonTransitions', (select count(*) from public.opportunity_stage_history h join public.pipeline_stages st on st.id = h.to_stage_id where st.is_won and h.changed_at >= p_start and h.changed_at < p_end),
      'lostTransitions', (select count(*) from public.opportunity_stage_history h join public.pipeline_stages st on st.id = h.to_stage_id where st.is_closed and not st.is_won and h.changed_at >= p_start and h.changed_at < p_end),
      'overdueTasksNow', (select count(*) from public.tasks t where t.status in ('OPEN','IN_PROGRESS') and t.due_at < timezone('utc', now()))
    ) value
  ),
  previous_metrics as (
    select jsonb_build_object(
      'trackedVisitors', (select count(distinct visitor_id) from previous_sessions),
      'trackedSessions', (select count(*) from previous_sessions),
      'enquiries', (select count(*) from public.form_submissions f where f.status = 'PROCESSED' and f.submitted_at >= p_previous_start and f.submitted_at < p_previous_end),
      'newPeople', (select count(*) from public.people p where p.merged_into_person_id is null and p.lifecycle_stage <> 'ARCHIVED' and p.created_at >= p_previous_start and p.created_at < p_previous_end),
      'opportunitiesCreated', (select count(*) from public.opportunities o where o.created_at >= p_previous_start and o.created_at < p_previous_end),
      'wonTransitions', (select count(*) from public.opportunity_stage_history h join public.pipeline_stages st on st.id = h.to_stage_id where st.is_won and h.changed_at >= p_previous_start and h.changed_at < p_previous_end)
    ) value
  ),
  open_values as (
    select o.currency, count(*) filter (where o.estimated_value is not null) known_count,
      count(*) filter (where o.estimated_value is null) unknown_count,
      coalesce(sum(o.estimated_value), 0) amount
    from public.opportunities o join public.pipeline_stages st on st.id = o.stage_id
    where not st.is_closed group by o.currency order by o.currency
  ),
  won_values as (
    select o.currency, count(*) filter (where o.estimated_value is not null) known_count,
      count(*) filter (where o.estimated_value is null) unknown_count,
      coalesce(sum(o.estimated_value), 0) amount
    from public.opportunity_stage_history h
    join public.pipeline_stages st on st.id = h.to_stage_id and st.is_won
    join public.opportunities o on o.id = h.opportunity_id
    where h.changed_at >= p_start and h.changed_at < p_end
    group by o.currency order by o.currency
  ),
  trend_days as (
    select generate_series(
      date_trunc('day', timezone('Asia/Kolkata', p_start)),
      date_trunc('day', timezone('Asia/Kolkata', p_end - interval '1 microsecond')),
      interval '1 day'
    )::date as report_day
  ),
  session_trend as (
    select timezone('Asia/Kolkata', s.started_at)::date report_day, count(*) sessions
    from public.sessions s where s.started_at >= p_start and s.started_at < p_end group by 1
  ),
  enquiry_trend as (
    select timezone('Asia/Kolkata', f.submitted_at)::date report_day, count(*) enquiries
    from public.form_submissions f where f.status='PROCESSED' and f.submitted_at >= p_start and f.submitted_at < p_end group by 1
  ),
  opportunity_trend as (
    select timezone('Asia/Kolkata', o.created_at)::date report_day, count(*) opportunities
    from public.opportunities o where o.created_at >= p_start and o.created_at < p_end group by 1
  ),
  won_trend as (
    select timezone('Asia/Kolkata', h.changed_at)::date report_day, count(*) won
    from public.opportunity_stage_history h join public.pipeline_stages st on st.id=h.to_stage_id and st.is_won
    where h.changed_at >= p_start and h.changed_at < p_end group by 1
  ),
  trend as (
    select d.report_day,
      coalesce(s.sessions,0) sessions, coalesce(e.enquiries,0) enquiries,
      coalesce(o.opportunities,0) opportunities, coalesce(w.won,0) won
    from trend_days d
    left join session_trend s using(report_day)
    left join enquiry_trend e using(report_day)
    left join opportunity_trend o using(report_day)
    left join won_trend w using(report_day)
  )
  select jsonb_build_object(
    'definitionVersion', 1,
    'current', (select value from current_metrics),
    'previous', (select value from previous_metrics),
    'openPipelineValue', coalesce((select jsonb_agg(jsonb_build_object('currency',currency,'amount',amount,'knownCount',known_count,'unknownCount',unknown_count)) from open_values), '[]'::jsonb),
    'wonOpportunityValue', coalesce((select jsonb_agg(jsonb_build_object('currency',currency,'amount',amount,'knownCount',known_count,'unknownCount',unknown_count)) from won_values), '[]'::jsonb),
    'trackedFunnel', jsonb_build_object(
      'trackedVisitors', (select count(distinct visitor_id) from selected_sessions),
      'attributedPeople', (select count(*) from tracked_people),
      'peopleWithOpportunity', (select count(distinct person_id) from tracked_opportunities),
      'wonPeople', (select count(distinct t.person_id) from tracked_opportunities t where exists (select 1 from public.opportunity_stage_history h join public.pipeline_stages st on st.id=h.to_stage_id and st.is_won where h.opportunity_id=t.id))
    ),
    'trend', coalesce((select jsonb_agg(jsonb_build_object('date',report_day,'sessions',sessions,'enquiries',enquiries,'opportunities',opportunities,'won',won) order by report_day) from trend), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.crm_analytics_acquisition(p_start timestamptz, p_end timestamptz)
returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare result jsonb;
begin
  perform public.assert_crm_analytics_range(p_start, p_end);
  with
  first_touch as (
    select coalesce(nullif(lower(trim(av.first_source)),''),'unattributed') source,
      count(*) tracked_visitors,
      count(distinct av.linked_person_id) filter (where av.linked_person_id is not null) attributed_people
    from public.anonymous_visitors av
    where av.first_seen_at >= p_start and av.first_seen_at < p_end
    group by 1 order by count(*) desc, 1 limit 25
  ),
  latest_touch as (
    select coalesce(nullif(lower(trim(s.utm_source)),''), case when s.referrer is null then 'direct' else 'referral' end) source,
      count(*) sessions, count(distinct s.visitor_id) tracked_visitors
    from public.sessions s where s.started_at >= p_start and s.started_at < p_end
    group by 1 order by count(*) desc, 1 limit 25
  ),
  self_reported as (
    select coalesce(nullif(lower(trim(p.lead_source)),''),'unattributed') source, count(*) people
    from public.people p where p.merged_into_person_id is null and p.lifecycle_stage <> 'ARCHIVED'
      and p.created_at >= p_start and p.created_at < p_end group by 1 order by count(*) desc, 1 limit 25
  ),
  utm as (
    select coalesce(nullif(lower(trim(s.utm_source)),''),'none') source,
      coalesce(nullif(lower(trim(s.utm_medium)),''),'none') medium,
      coalesce(nullif(trim(s.utm_campaign),''),'none') campaign,
      count(*) sessions, count(distinct s.visitor_id) tracked_visitors
    from public.sessions s where s.started_at >= p_start and s.started_at < p_end
    group by 1,2,3 order by count(*) desc, 1,2,3 limit 50
  ),
  landing as (
    select coalesce(nullif(s.landing_page,''),'unknown') path, count(*) sessions, count(distinct s.visitor_id) tracked_visitors
    from public.sessions s where s.started_at >= p_start and s.started_at < p_end
    group by 1 order by count(*) desc, 1 limit 25
  ),
  content as (
    select e.event_name,
      coalesce(e.metadata->>'serviceSlug', e.metadata->>'projectSlug', e.metadata->>'insightSlug', e.page_path, 'unknown') content,
      count(*) views, count(distinct e.visitor_id) tracked_visitors
    from public.events e where e.occurred_at >= p_start and e.occurred_at < p_end
      and e.event_name in ('service_viewed','project_viewed','lab_project_viewed','insight_viewed')
    group by 1,2 order by count(*) desc, 1,2 limit 50
  )
  select jsonb_build_object(
    'firstTouch', coalesce((select jsonb_agg(to_jsonb(first_touch)) from first_touch), '[]'::jsonb),
    'latestTouch', coalesce((select jsonb_agg(to_jsonb(latest_touch)) from latest_touch), '[]'::jsonb),
    'selfReported', coalesce((select jsonb_agg(to_jsonb(self_reported)) from self_reported), '[]'::jsonb),
    'utm', coalesce((select jsonb_agg(to_jsonb(utm)) from utm), '[]'::jsonb),
    'landingPages', coalesce((select jsonb_agg(to_jsonb(landing)) from landing), '[]'::jsonb),
    'content', coalesce((select jsonb_agg(to_jsonb(content)) from content), '[]'::jsonb)
  ) into result;
  return result;
end; $$;

create or replace function public.crm_analytics_leads(p_start timestamptz, p_end timestamptz)
returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare result jsonb;
begin
  perform public.assert_crm_analytics_range(p_start, p_end);
  with
  active_model as (
    -- Packet 12's metric contract deliberately pins the approved active scoring model.
    -- VIEWER may read score outcomes but not the sensitive scoring configuration table.
    select 'ZAVLIO_LEAD_V1'::text model_version
  ),
  canonical as (
    select p.*, score.score, score.intent_level, score.service_interest, score.calculated_at,
      score.calculated_at < timezone('utc', now()) - interval '24 hours' is_stale
    from public.people p
    left join lateral (
      select ls.* from public.lead_scores ls, active_model am
      where ls.person_id=p.id and ls.model_version=am.model_version
      order by ls.calculated_at desc, ls.id desc limit 1
    ) score on true
    where p.merged_into_person_id is null and p.lifecycle_stage <> 'ARCHIVED'
  ),
  period_people as (select * from canonical where created_at >= p_start and created_at < p_end),
  source_quality as (
    select coalesce(nullif(lower(trim(p.first_touch_source)),''),nullif(lower(trim(p.lead_source)),''),'unattributed') source,
      count(*) leads, count(p.score) scored_leads, round(avg(p.score),1) average_score,
      percentile_cont(0.5) within group (order by p.score) median_score,
      count(*) filter (where p.intent_level in ('HIGH','PRIORITY')) high_plus,
      count(*) filter (where p.intent_level='PRIORITY') priority,
      count(*) filter (where exists(select 1 from public.opportunities o where o.person_id=p.id)) people_with_opportunity,
      count(*) filter (where exists(select 1 from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id and st.is_won where o.person_id=p.id)) won_people
    from period_people p group by 1 order by count(*) desc, 1 limit 25
  ),
  intent as (
    select coalesce(intent_level,'UNSCORED') intent, count(*) people from canonical group by 1 order by 1
  ),
  declared as (
    select service, count(distinct f.person_id) people
    from public.form_submissions f
    cross join lateral jsonb_array_elements_text(case when jsonb_typeof(f.payload->'services')='array' then f.payload->'services' else '[]'::jsonb end) service
    where f.status='PROCESSED' and f.submitted_at >= p_start and f.submitted_at < p_end
    group by service order by count(distinct f.person_id) desc, service
  ),
  affinity as (
    select service_interest->>'primary' service, count(*) people from canonical
    where service_interest->>'primary' is not null group by 1 order by count(*) desc, 1
  ),
  crm_funnel as (
    select count(*) people,
      count(*) filter (where exists(select 1 from public.opportunities o where o.person_id=p.id)) people_with_opportunity,
      count(*) filter (where exists(select 1 from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id and st.is_won where o.person_id=p.id)) won_people
    from period_people p
  )
  select jsonb_build_object(
    'scoreModel', (select model_version from active_model),
    'currentPopulation', (select count(*) from canonical),
    'currentScored', (select count(score) from canonical),
    'currentStale', (select count(*) from canonical where is_stale),
    'currentUnscored', (select count(*) from canonical where score is null),
    'intentDistribution', coalesce((select jsonb_agg(to_jsonb(intent)) from intent), '[]'::jsonb),
    'leadQualityBySource', coalesce((select jsonb_agg(to_jsonb(source_quality)) from source_quality), '[]'::jsonb),
    'declaredServices', coalesce((select jsonb_agg(to_jsonb(declared)) from declared), '[]'::jsonb),
    'currentPrimaryAffinity', coalesce((select jsonb_agg(to_jsonb(affinity)) from affinity), '[]'::jsonb),
    'crmFunnel', (select to_jsonb(crm_funnel) from crm_funnel)
  ) into result;
  return result;
end; $$;

create or replace function public.crm_analytics_pipeline(p_start timestamptz, p_end timestamptz)
returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare result jsonb;
begin
  perform public.assert_crm_analytics_range(p_start, p_end);
  with
  current_stage as (
    select st.name, st.slug, st.sort_order, st.is_closed, st.is_won, count(*) opportunities,
      percentile_cont(0.5) within group (order by extract(epoch from (timezone('utc',now()) - coalesce(last_stage.changed_at,o.created_at)))/86400.0) median_stage_age_days
    from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id
    left join lateral (select h.changed_at from public.opportunity_stage_history h where h.opportunity_id=o.id and h.to_stage_id=o.stage_id order by h.changed_at desc limit 1) last_stage on true
    group by st.id,st.name,st.slug,st.sort_order,st.is_closed,st.is_won order by st.sort_order
  ),
  current_values as (
    select st.slug, o.currency, count(*) filter(where o.estimated_value is not null) known_count,
      count(*) filter(where o.estimated_value is null) unknown_count, coalesce(sum(o.estimated_value),0) amount
    from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id
    group by st.slug,o.currency order by st.slug,o.currency
  ),
  transitions as (
    select st.name, st.slug, st.is_won, st.is_closed, count(*) transitions
    from public.opportunity_stage_history h join public.pipeline_stages st on st.id=h.to_stage_id
    where h.changed_at >= p_start and h.changed_at < p_end
    group by st.id,st.name,st.slug,st.is_won,st.is_closed,st.sort_order order by st.sort_order
  ),
  outcomes as (
    select
      count(*) filter(where st.is_won) won,
      count(*) filter(where st.is_closed and not st.is_won) lost
    from public.opportunity_stage_history h join public.pipeline_stages st on st.id=h.to_stage_id
    where h.changed_at >= p_start and h.changed_at < p_end
  ),
  lost_reasons as (
    select coalesce(nullif(h.metadata->>'lost_reason',''),nullif(h.reason,''),nullif(o.lost_reason,''),'UNSPECIFIED') reason, count(*) losses
    from public.opportunity_stage_history h join public.pipeline_stages st on st.id=h.to_stage_id and st.is_closed and not st.is_won
    join public.opportunities o on o.id=h.opportunity_id
    where h.changed_at >= p_start and h.changed_at < p_end group by 1 order by count(*) desc,1 limit 25
  ),
  velocity as (
    select extract(epoch from (h.changed_at-o.created_at))/86400.0 close_days
    from public.opportunity_stage_history h join public.pipeline_stages st on st.id=h.to_stage_id and st.is_closed
    join public.opportunities o on o.id=h.opportunity_id
    where h.changed_at >= p_start and h.changed_at < p_end and h.changed_at >= o.created_at
  )
  select jsonb_build_object(
    'opportunitiesCreated', (select count(*) from public.opportunities o where o.created_at >= p_start and o.created_at < p_end),
    'currentOpenOpportunities', (select count(*) from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id where not st.is_closed),
    'currentWonOpportunities', (select count(*) from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id where st.is_won),
    'currentLostOpportunities', (select count(*) from public.opportunities o join public.pipeline_stages st on st.id=o.stage_id where st.is_closed and not st.is_won),
    'wonTransitions', (select won from outcomes), 'lostTransitions', (select lost from outcomes),
    'closedWinRate', (select case when won+lost=0 then null else round(won::numeric*100/(won+lost),1) end from outcomes),
    'medianCloseDays', (select round(percentile_cont(0.5) within group(order by close_days)::numeric,1) from velocity),
    'stages', coalesce((select jsonb_agg(to_jsonb(current_stage)) from current_stage), '[]'::jsonb),
    'stageValues', coalesce((select jsonb_agg(to_jsonb(current_values)) from current_values), '[]'::jsonb),
    'transitions', coalesce((select jsonb_agg(to_jsonb(transitions)) from transitions), '[]'::jsonb),
    'lostReasons', coalesce((select jsonb_agg(to_jsonb(lost_reasons)) from lost_reasons), '[]'::jsonb)
  ) into result;
  return result;
end; $$;

create or replace function public.crm_analytics_operations(p_start timestamptz, p_end timestamptz)
returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare result jsonb;
begin
  perform public.assert_crm_analytics_range(p_start, p_end);
  with task_rows as (
    select coalesce(sp.name,'Unassigned') assignee,
      count(*) filter(where t.status in ('OPEN','IN_PROGRESS')) open_tasks,
      count(*) filter(where t.status in ('OPEN','IN_PROGRESS') and t.due_at < timezone('utc',now())) overdue_now,
      count(*) filter(where t.status in ('OPEN','IN_PROGRESS') and timezone('Asia/Kolkata',t.due_at)::date=timezone('Asia/Kolkata',now())::date) due_today,
      count(*) filter(where t.status='COMPLETED' and t.completed_at >= p_start and t.completed_at < p_end) completed_in_period
    from public.tasks t left join public.staff_profiles sp on sp.id=t.assigned_to
    group by sp.id,sp.name order by overdue_now desc,assignee
  )
  select jsonb_build_object(
    'openTasksNow', (select count(*) from public.tasks where status in ('OPEN','IN_PROGRESS')),
    'overdueTasksNow', (select count(*) from public.tasks where status in ('OPEN','IN_PROGRESS') and due_at < timezone('utc',now())),
    'dueTodayNow', (select count(*) from public.tasks where status in ('OPEN','IN_PROGRESS') and timezone('Asia/Kolkata',due_at)::date=timezone('Asia/Kolkata',now())::date),
    'unassignedTasksNow', (select count(*) from public.tasks where status in ('OPEN','IN_PROGRESS') and assigned_to is null),
    'completedInPeriod', (select count(*) from public.tasks where status='COMPLETED' and completed_at >= p_start and completed_at < p_end),
    'byAssignee', coalesce((select jsonb_agg(to_jsonb(task_rows)) from task_rows), '[]'::jsonb)
  ) into result;
  return result;
end; $$;

revoke all on function public.assert_crm_analytics_range(timestamptz,timestamptz) from public, anon;
revoke all on function public.crm_analytics_overview(timestamptz,timestamptz,timestamptz,timestamptz) from public, anon;
revoke all on function public.crm_analytics_acquisition(timestamptz,timestamptz) from public, anon;
revoke all on function public.crm_analytics_leads(timestamptz,timestamptz) from public, anon;
revoke all on function public.crm_analytics_pipeline(timestamptz,timestamptz) from public, anon;
revoke all on function public.crm_analytics_operations(timestamptz,timestamptz) from public, anon;
grant execute on function public.assert_crm_analytics_range(timestamptz,timestamptz) to authenticated;
grant execute on function public.crm_analytics_overview(timestamptz,timestamptz,timestamptz,timestamptz) to authenticated;
grant execute on function public.crm_analytics_acquisition(timestamptz,timestamptz) to authenticated;
grant execute on function public.crm_analytics_leads(timestamptz,timestamptz) to authenticated;
grant execute on function public.crm_analytics_pipeline(timestamptz,timestamptz) to authenticated;
grant execute on function public.crm_analytics_operations(timestamptz,timestamptz) to authenticated;

create index if not exists sessions_started_visitor_reporting_idx on public.sessions (started_at, visitor_id);
create index if not exists form_submissions_submitted_processed_reporting_idx on public.form_submissions (submitted_at, form_type, person_id) where status='PROCESSED';
create index if not exists people_created_canonical_reporting_idx on public.people (created_at, id) where merged_into_person_id is null and lifecycle_stage <> 'ARCHIVED';
create index if not exists opportunities_created_stage_reporting_idx on public.opportunities (created_at, stage_id);
create index if not exists opportunity_history_changed_stage_reporting_idx on public.opportunity_stage_history (changed_at, to_stage_id, opportunity_id);
create index if not exists tasks_completed_reporting_idx on public.tasks (completed_at, assigned_to) where status='COMPLETED';

-- Preserve the exact active-staff RLS predicate while allowing PostgreSQL to evaluate
-- the stable authorization function once per statement instead of once per report row.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'anonymous_visitors','sessions','events','form_submissions','people','lead_scores',
    'pipeline_stages','opportunities','opportunity_stage_history','tasks'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_active_staff_select', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select public.is_active_staff()))',
      table_name || '_active_staff_select', table_name
    );
  end loop;
end $$;
