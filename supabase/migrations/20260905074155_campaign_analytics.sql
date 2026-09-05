-- Campaign analytics schema

create table if not exists public.campaigns (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  email_template_key text not null default 'default',
  created_at timestamptz not null default now()
);

create table if not exists public.visitors (
  id bigint generated always as identity primary key,
  visitor_token text not null unique,
  unique_device_fingerprint text,
  ip_hash text,
  user_agent text,
  referrer_url text,
  initial_utm_source text,
  initial_utm_medium text,
  initial_utm_campaign text,
  initial_utm_term text,
  initial_utm_content text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.survey_answers (
  id bigint generated always as identity primary key,
  visitor_id bigint not null references public.visitors (id),
  campaign_id bigint not null references public.campaigns (id),
  session_id text not null,
  step integer not null,
  question text not null,
  answer jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, step, question)
);

create table if not exists public.survey_events (
  id bigint generated always as identity primary key,
  visitor_id bigint not null references public.visitors (id),
  campaign_id bigint not null references public.campaigns (id),
  current_step integer not null,
  total_steps integer not null,
  time_spent_on_step_ms integer,
  interaction_type text not null check (
    interaction_type = any (array['view', 'next', 'back', 'complete', 'abandon'])
  ),
  completed boolean not null default false,
  timestamp timestamptz not null default now()
);

create table if not exists public.survey_completions (
  id bigint generated always as identity primary key,
  visitor_id bigint not null references public.visitors (id),
  campaign_id bigint not null references public.campaigns (id),
  session_id text not null,
  email text not null,
  full_name text,
  chronotype text not null,
  peak_hours text,
  all_responses jsonb,
  resend_message_id text,
  email_status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create table if not exists public.email_events (
  id bigint generated always as identity primary key,
  recipient_email text not null,
  campaign_id bigint references public.campaigns (id),
  resend_message_id text,
  event_type text not null check (
    event_type = any (array['sent', 'delivered', 'opened', 'clicked', 'permanent_fail', 'complaint'])
  ),
  url_clicked text,
  timestamp timestamptz not null default now()
);

create index if not exists visitors_fingerprint_idx on public.visitors (unique_device_fingerprint);
create index if not exists survey_answers_visitor_id_idx on public.survey_answers (visitor_id);
create index if not exists survey_answers_campaign_id_idx on public.survey_answers (campaign_id);
create index if not exists survey_events_visitor_id_idx on public.survey_events (visitor_id);
create index if not exists survey_events_campaign_id_idx on public.survey_events (campaign_id);
create index if not exists survey_events_timestamp_idx on public.survey_events ("timestamp");
create index if not exists survey_completions_visitor_id_idx on public.survey_completions (visitor_id);
create index if not exists survey_completions_campaign_id_idx on public.survey_completions (campaign_id);
create index if not exists survey_completions_resend_message_id_idx on public.survey_completions (resend_message_id);
create index if not exists email_events_campaign_id_idx on public.email_events (campaign_id);
create index if not exists email_events_recipient_email_idx on public.email_events (recipient_email);
create index if not exists email_events_resend_message_id_idx on public.email_events (resend_message_id);

alter table public.campaigns enable row level security;
alter table public.visitors enable row level security;
alter table public.survey_answers enable row level security;
alter table public.survey_events enable row level security;
alter table public.survey_completions enable row level security;
alter table public.email_events enable row level security;

revoke all on public.campaigns from anon, authenticated;
revoke all on public.visitors from anon, authenticated;
revoke all on public.survey_answers from anon, authenticated;
revoke all on public.survey_events from anon, authenticated;
revoke all on public.survey_completions from anon, authenticated;
revoke all on public.email_events from anon, authenticated;

insert into public.campaigns (name, slug, email_template_key)
values
  ('Conference', 'conference', 'default'),
  ('Future of Work', 'future-of-work', 'default')
on conflict (slug) do nothing;
