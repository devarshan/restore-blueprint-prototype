create index if not exists email_events_timestamp_type_idx
  on public.email_events ("timestamp", event_type);

create or replace function public.admin_overview_stats(p_campaign_id bigint default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  bounds as (
    select (timezone('utc', now())::date - 13) as start_day,
           timezone('utc', now())::date as end_day
  ),
  visitor_set as (
    select vis.id, vis.user_agent, vis.initial_utm_source
    from public.visitors vis
    where p_campaign_id is null
       or exists (
         select 1
         from public.survey_events e
         where e.visitor_id = vis.id
           and e.campaign_id = p_campaign_id
       )
  ),
  last_event as (
    select distinct on (e.visitor_id)
      e.visitor_id,
      e.current_step,
      e.completed,
      e.interaction_type
    from public.survey_events e
    where p_campaign_id is null or e.campaign_id = p_campaign_id
    order by e.visitor_id, e.timestamp desc
  )
  select jsonb_build_object(
    'visitors', (select count(*)::int from visitor_set),
    'started', (
      select count(distinct e.visitor_id)::int
      from public.survey_events e
      where p_campaign_id is null or e.campaign_id = p_campaign_id
    ),
    'completed', (
      select count(*)::int
      from public.survey_completions c
      where p_campaign_id is null or c.campaign_id = p_campaign_id
    ),
    'chronotypes', jsonb_build_object(
      'horizon', (
        select count(*)::int from public.survey_completions c
        where c.chronotype = 'horizon'
          and (p_campaign_id is null or c.campaign_id = p_campaign_id)
      ),
      'apex', (
        select count(*)::int from public.survey_completions c
        where c.chronotype = 'apex'
          and (p_campaign_id is null or c.campaign_id = p_campaign_id)
      ),
      'aurora', (
        select count(*)::int from public.survey_completions c
        where c.chronotype = 'aurora'
          and (p_campaign_id is null or c.campaign_id = p_campaign_id)
      )
    ),
    'dropOff', coalesce((
      select jsonb_agg(jsonb_build_object('step', d.current_step, 'count', d.cnt) order by d.current_step)
      from (
        select last_event.current_step, count(*)::int as cnt
        from last_event
        where last_event.completed = false
          and last_event.interaction_type is distinct from 'complete'
        group by last_event.current_step
      ) d
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', to_char(series.day, 'YYYY-MM-DD'),
        'started', coalesce(started.cnt, 0),
        'completed', coalesce(done.cnt, 0)
      ) order by series.day)
      from bounds
      cross join generate_series(bounds.start_day, bounds.end_day, interval '1 day') as series(day)
      left join (
        select date_trunc('day', e.timestamp at time zone 'utc')::date as day,
               count(distinct e.visitor_id)::int as cnt
        from public.survey_events e, bounds
        where e.timestamp >= bounds.start_day
          and (p_campaign_id is null or e.campaign_id = p_campaign_id)
        group by 1
      ) started on started.day = series.day::date
      left join (
        select date_trunc('day', c.created_at at time zone 'utc')::date as day,
               count(*)::int as cnt
        from public.survey_completions c, bounds
        where c.created_at >= bounds.start_day
          and (p_campaign_id is null or c.campaign_id = p_campaign_id)
        group by 1
      ) done on done.day = series.day::date
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('label', x.device, 'count', x.cnt) order by x.cnt desc)
      from (
        select
          case
            when visitor_set.user_agent ~* 'ipad|tablet' then 'tablet'
            when visitor_set.user_agent ~* 'mobi|iphone|android' then 'phone'
            when visitor_set.user_agent is null or visitor_set.user_agent = '' then 'unknown'
            else 'desktop'
          end as device,
          count(*)::int as cnt
        from visitor_set
        group by 1
      ) x
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('label', x.source, 'count', x.cnt) order by x.cnt desc)
      from (
        select
          coalesce(nullif(btrim(visitor_set.initial_utm_source), ''), 'direct') as source,
          count(*)::int as cnt
        from visitor_set
        group by 1
        order by count(*) desc
        limit 8
      ) x
    ), '[]'::jsonb),
    'emailStatus', coalesce((
      select jsonb_agg(jsonb_build_object('label', x.email_status, 'count', x.cnt) order by x.cnt desc)
      from (
        select c.email_status, count(*)::int as cnt
        from public.survey_completions c, bounds
        where c.created_at >= bounds.start_day
          and (p_campaign_id is null or c.campaign_id = p_campaign_id)
        group by c.email_status
      ) x
    ), '[]'::jsonb),
    'email', jsonb_build_object(
      'sent', (
        select count(*)::int from public.email_events ev, bounds
        where ev.event_type = 'sent'
          and ev.campaign_id is not null
          and ev.timestamp >= bounds.start_day
          and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
      ),
      'delivered', (
        select count(*)::int from public.email_events ev, bounds
        where ev.event_type = 'delivered'
          and ev.campaign_id is not null
          and ev.timestamp >= bounds.start_day
          and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
      ),
      'opened', (
        select count(*)::int from public.email_events ev, bounds
        where ev.event_type = 'opened'
          and ev.campaign_id is not null
          and ev.timestamp >= bounds.start_day
          and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
      ),
      'clicked', (
        select count(*)::int from public.email_events ev, bounds
        where ev.event_type = 'clicked'
          and ev.campaign_id is not null
          and ev.timestamp >= bounds.start_day
          and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
      ),
      'bounced', (
        select count(*)::int from public.email_events ev, bounds
        where ev.event_type = 'permanent_fail'
          and ev.campaign_id is not null
          and ev.timestamp >= bounds.start_day
          and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
      ),
      'complaints', (
        select count(*)::int from public.email_events ev, bounds
        where ev.event_type = 'complaint'
          and ev.campaign_id is not null
          and ev.timestamp >= bounds.start_day
          and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
      )
    ),
    'quotaUsed', (
      select count(*)::int from public.email_events ev
      where ev.event_type = 'sent'
        and ev.campaign_id is not null
        and ev.timestamp >= date_trunc('month', timezone('utc', now()))
        and (p_campaign_id is null or ev.campaign_id = p_campaign_id)
    ),
    'campaigns', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cam.id,
        'name', cam.name,
        'slug', cam.slug,
        'started', cam.started,
        'completed', cam.completed
      ) order by cam.completed desc, cam.name)
      from (
        select
          campaigns.id,
          campaigns.name,
          campaigns.slug,
          (
            select count(distinct e.visitor_id)::int
            from public.survey_events e
            where e.campaign_id = campaigns.id
          ) as started,
          (
            select count(*)::int
            from public.survey_completions c
            where c.campaign_id = campaigns.id
          ) as completed
        from public.campaigns
      ) cam
    ), '[]'::jsonb)
  );
$$;
