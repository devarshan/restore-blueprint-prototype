create index if not exists survey_events_campaign_timestamp_idx on public.survey_events (campaign_id, "timestamp");
create index if not exists survey_events_campaign_completed_step_idx on public.survey_events (campaign_id, completed, current_step);
create index if not exists email_events_type_timestamp_idx on public.email_events (event_type, "timestamp");

create or replace function public.admin_overview_stats(p_campaign_id bigint default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'completed', (
      select count(*)::int from public.survey_completions c
      where p_campaign_id is null or c.campaign_id = p_campaign_id
    ),
    'started', (
      select count(distinct e.visitor_id)::int from public.survey_events e
      where p_campaign_id is null or e.campaign_id = p_campaign_id
    ),
    'chronotypes', jsonb_build_object(
      'horizon', (
        select count(*)::int from public.survey_completions c
        where c.chronotype = 'horizon' and (p_campaign_id is null or c.campaign_id = p_campaign_id)
      ),
      'apex', (
        select count(*)::int from public.survey_completions c
        where c.chronotype = 'apex' and (p_campaign_id is null or c.campaign_id = p_campaign_id)
      ),
      'aurora', (
        select count(*)::int from public.survey_completions c
        where c.chronotype = 'aurora' and (p_campaign_id is null or c.campaign_id = p_campaign_id)
      )
    ),
    'dropOff', coalesce((
      select jsonb_agg(jsonb_build_object('step', d.current_step, 'count', d.cnt) order by d.current_step)
      from (
        select e.current_step, count(*)::int as cnt
        from public.survey_events e
        where e.completed = false
          and (p_campaign_id is null or e.campaign_id = p_campaign_id)
        group by e.current_step
      ) d
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_overview_stats(bigint) from public, anon, authenticated;
grant execute on function public.admin_overview_stats(bigint) to service_role;
