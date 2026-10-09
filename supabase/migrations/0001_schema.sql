-- TrustLab foundation schema.
-- Apply in the Supabase SQL editor, or with `supabase db push`.
-- Access model: the browser only ever READS published content through RLS.
-- Every write goes through server routes that use the service-role key after
-- validating input / checking the admin role.

-- ---------------------------------------------------------------- admin_users
create table public.admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text not null check (char_length(btrim(display_name)) > 0),
  role         text not null default 'admin' check (role in ('admin')),
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------------- claims
create table public.claims (
  id              uuid primary key default gen_random_uuid(),
  seed_key        text unique,                       -- idempotent seeding only
  title           jsonb not null,                    -- {"ka":"","hy":"","en":""}
  claim           jsonb not null,
  explanation     jsonb not null default '{"ka":"","hy":"","en":""}'::jsonb,
  state           text not null default 'pending'
                  check (state in ('pending', 'published', 'rejected')),
  verdict         text check (verdict in ('fake', 'manipulative', 'true')),
  category        text not null check (category in ('peace', 'media', 'history', 'society')),
  source_lang     text not null check (source_lang in ('ka', 'hy', 'en')),
  submission_type text not null check (submission_type in ('link', 'text', 'image')),
  source_url      text check (source_url is null or char_length(source_url) <= 2048),
  notes           text check (notes is null or char_length(notes) <= 2000),
  sources         text[] not null default '{}',
  verified_by     uuid references public.admin_users (user_id),
  verified_label  text,                              -- legacy label for seed data
  verified_at     timestamptz,
  reject_reason   text,
  rejected_by     uuid references public.admin_users (user_id),
  rejected_at     timestamptz,
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint claims_published_iff_verdict
    check ((state = 'published') = (verdict is not null)),
  constraint claims_rejected_has_reason
    check (state <> 'rejected' or char_length(btrim(coalesce(reject_reason, ''))) > 0)
);

create index claims_state_submitted_idx on public.claims (state, submitted_at desc);

-- ------------------------------------------------------------------- evidence
create table public.evidence (
  id           uuid primary key default gen_random_uuid(),
  claim_id     uuid not null references public.claims (id) on delete restrict,
  kind         text not null check (kind in ('file', 'link')),
  storage_path text,                                 -- object key in the private 'evidence' bucket
  url          text,
  title        text not null check (char_length(title) between 1 and 300),
  description  text check (description is null or char_length(description) <= 2000),
  mime_type    text,
  size_bytes   bigint check (size_bytes is null or size_bytes >= 0),
  sensitive    boolean not null default false,       -- UI blurs until revealed
  is_public    boolean not null default false,       -- only an admin flips this
  created_by   uuid references public.admin_users (user_id),
  created_at   timestamptz not null default now(),
  constraint evidence_has_target check (storage_path is not null or url is not null)
);

create index evidence_claim_idx on public.evidence (claim_id);

-- ------------------------------------------------------------------- comments
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  claim_id    uuid not null references public.claims (id) on delete restrict,
  author_name text not null check (char_length(author_name) between 1 and 80),
  body        text not null check (char_length(body) between 1 and 2000),
  lang        text check (lang in ('ka', 'hy', 'en')),
  status      text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at  timestamptz not null default now()
);

create index comments_claim_idx on public.comments (claim_id, created_at);

-- ------------------------------------------------------------------ audit_log
create table public.audit_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  actor_id    uuid,                                  -- null for anonymous/system
  actor_email text,
  action      text not null,                         -- e.g. claim.publish
  entity_type text not null,
  entity_id   text not null,
  old_value   jsonb,                                 -- changed fields before
  new_value   jsonb,                                 -- changed fields after
  -- human: an admin decided by themselves.
  -- ai_suggestion_accepted: an admin accepted an AI agent's proposal.
  -- system: no admin involved (e.g. a public submission arriving).
  source      text not null default 'human'
              check (source in ('human', 'ai_suggestion_accepted', 'system')),
  meta        jsonb not null default '{}'::jsonb
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);

-- Append-only: nobody (not even the service role) can rewrite history.
create function public.audit_log_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;

create trigger audit_log_no_update
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.audit_log_immutable();

-- ------------------------------------------------------------------------ RLS
alter table public.admin_users enable row level security;
alter table public.claims      enable row level security;
alter table public.evidence    enable row level security;
alter table public.comments    enable row level security;
alter table public.audit_log   enable row level security;

-- An admin can read their own admin_users row (used by middleware to check role).
create policy admin_users_select_self on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- The public sees published claims only. No insert/update/delete policies exist,
-- so all writes are denied for anon/authenticated and only the service role
-- (server routes) can write.
create policy claims_select_published on public.claims
  for select to anon, authenticated using (state = 'published');

create policy evidence_select_public on public.evidence
  for select to anon, authenticated using (
    is_public and exists (
      select 1 from public.claims c where c.id = claim_id and c.state = 'published'
    )
  );

create policy comments_select_visible on public.comments
  for select to anon, authenticated using (
    status = 'visible' and exists (
      select 1 from public.claims c where c.id = claim_id and c.state = 'published'
    )
  );

-- audit_log: no policies at all, plus explicit revoke (service role only).
revoke all on public.audit_log from anon, authenticated;

-- ------------------------------------------------------------ storage (evidence)
-- Private bucket; no storage policies => only the service role can read/write.
-- Serve files to the public through signed URLs created server-side.
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;
