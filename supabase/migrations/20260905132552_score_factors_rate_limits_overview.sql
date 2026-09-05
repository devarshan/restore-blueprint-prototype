create index if not exists survey_events_campaign_timestamp_idx on public.survey_events (campaign_id, "timestamp");
create index if not exists survey_events_campaign_completed_step_idx on public.survey_events (campaign_id, completed, current_step);
create index if not exists email_events_type_timestamp_idx on public.email_events (event_type, "timestamp");

alter table public.survey_completions
  add column if not exists score_factors jsonb not null default '[]'::jsonb;

create table if not exists public.rate_limits (
  rate_key text not null,
  window_start timestamptz not null,
  hit_count integer not null,
  primary key (rate_key, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.take_rate_limit(
  p_key text,
  p_max integer,
  p_window_ms integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  w timestamptz;
  n integer;
  window_seconds integer;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 200 then
    return false;
  end if;
  if p_max < 1 or p_window_ms < 1000 then
    return false;
  end if;

  window_seconds := greatest(1, p_window_ms / 1000);
  w := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);

  insert into public.rate_limits (rate_key, window_start, hit_count)
  values (p_key, w, 1)
  on conflict (rate_key, window_start)
  do update set hit_count = public.rate_limits.hit_count + 1
  returning hit_count into n;

  if n = 1 then
    delete from public.rate_limits
    where window_start < now() - interval '2 hours';
  end if;

  return n <= p_max;
end;
$$;

revoke all on function public.take_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_rate_limit(text, integer, integer) to service_role;

create or replace function public.admin_overview_stats(p_campaign_id bigint default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'visitors', (
      select case
        when p_campaign_id is null then (select count(*)::int from public.visitors)
        else (
          select count(distinct e.visitor_id)::int
          from public.survey_events e
          where e.campaign_id = p_campaign_id
        )
      end
    ),
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
