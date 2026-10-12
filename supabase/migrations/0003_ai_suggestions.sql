-- Human-in-the-loop AI suggestions.
-- An AI agent (service role) proposes a verdict + evidence summary + translations
-- for a pending claim. An admin approves, edits or rejects it. Nothing an AI
-- proposes is public: approving publishes the claim through admin_update_claim,
-- so the claim change and its audit rows land in one transaction.

create table public.ai_suggestions (
  id                uuid primary key default gen_random_uuid(),
  claim_id          uuid not null references public.claims (id) on delete restrict,
  suggested_verdict text not null check (suggested_verdict in ('fake', 'manipulative', 'true')),
  evidence_summary  text not null default '' check (char_length(evidence_summary) <= 5000),
  -- {"title": {"ka","hy","en"}, "explanation": {"ka","hy","en"}}
  translation       jsonb not null default
                    '{"title":{"ka":"","hy":"","en":""},"explanation":{"ka":"","hy":"","en":""}}'::jsonb,
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  edited            boolean not null default false,  -- an admin changed it before deciding
  model             text,
  created_by        uuid references public.admin_users (user_id),  -- admin who requested it
  reviewed_by       uuid references public.admin_users (user_id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint ai_suggestions_reviewed_has_reviewer
    check (status = 'pending' or (reviewed_by is not null and reviewed_at is not null))
);

create index ai_suggestions_claim_idx on public.ai_suggestions (claim_id, created_at desc);
-- At most one open suggestion per claim; reject it to request a new one.
create unique index ai_suggestions_one_pending_per_claim
  on public.ai_suggestions (claim_id) where status = 'pending';

-- ------------------------------------------------------------------------ RLS
alter table public.ai_suggestions enable row level security;

revoke all on public.ai_suggestions from anon, authenticated;
grant select on public.ai_suggestions to authenticated;

-- AI logic runs with the service role (which bypasses RLS anyway; explicit for clarity).
create policy ai_suggestions_service_all on public.ai_suggestions
  for all to service_role using (true) with check (true);

-- Admins can read suggestions. There is deliberately NO insert/update/delete
-- privilege for `authenticated`: editing happens only through
-- review_ai_suggestion() below (service role, after requireAdmin()), so every
-- edit is written to audit_log in the same transaction.
create policy ai_suggestions_admin_select on public.ai_suggestions
  for select to authenticated using (
    exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

-- ------------------------------------------------------- create (AI -> pending)
create function public.create_ai_suggestion(
  p_claim       uuid,
  p_verdict     text,
  p_summary     text,
  p_translation jsonb,
  p_model       text,
  p_actor       uuid                    -- admin who asked for the suggestion
) returns public.ai_suggestions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_mail text;
  claim_row  public.claims;
  new_row    public.ai_suggestions;
begin
  select email into actor_mail from public.admin_users where user_id = p_actor;
  if not found then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into claim_row from public.claims where id = p_claim for update;
  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;
  if claim_row.state <> 'pending' then
    raise exception 'invalid_state' using errcode = '22023';
  end if;

  begin
    insert into public.ai_suggestions
      (claim_id, suggested_verdict, evidence_summary, translation, model, created_by)
    values
      (p_claim, p_verdict, p_summary, p_translation, p_model, p_actor)
    returning * into new_row;
  exception when unique_violation then
    raise exception 'pending_exists' using errcode = '23505';
  end;

  insert into public.audit_log
    (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
  values
    (p_actor, actor_mail, 'ai_suggestion.create', 'ai_suggestion', new_row.id::text, null,
     jsonb_build_object(
       'claim_id', p_claim,
       'suggested_verdict', new_row.suggested_verdict,
       'status', new_row.status),
     'system', jsonb_build_object('model', p_model));

  return new_row;
end $$;

-- ----------------------------------------------- review (approve / edit / reject)
create function public.review_ai_suggestion(
  p_id       uuid,
  p_decision text,                      -- approve | edit | reject
  p_patch    jsonb,                     -- edit: {verdict?, evidenceSummary?, translation?}; reject: {reason?}
  p_actor    uuid
) returns public.ai_suggestions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_mail text;
  old_row    public.ai_suggestions;
  new_row    public.ai_suggestions;
  claim_row  public.claims;
  loc        text;
begin
  if p_decision not in ('approve', 'edit', 'reject') then
    raise exception 'unknown_decision' using errcode = '22023';
  end if;

  select email into actor_mail from public.admin_users where user_id = p_actor;
  if not found then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into old_row from public.ai_suggestions where id = p_id for update;
  if not found then
    raise exception 'suggestion_not_found' using errcode = 'P0002';
  end if;
  if old_row.status <> 'pending' then
    raise exception 'invalid_state' using errcode = '22023';
  end if;

  if p_decision = 'edit' then
    update public.ai_suggestions set
      suggested_verdict = coalesce(p_patch ->> 'verdict', suggested_verdict),
      evidence_summary  = coalesce(p_patch ->> 'evidenceSummary', evidence_summary),
      translation       = coalesce(p_patch -> 'translation', translation),
      edited            = true,
      updated_at        = now()
    where id = p_id returning * into new_row;

    insert into public.audit_log
      (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
    values
      (p_actor, actor_mail, 'ai_suggestion.edit', 'ai_suggestion', p_id::text,
       jsonb_build_object('suggested_verdict', old_row.suggested_verdict,
                          'evidence_summary', old_row.evidence_summary,
                          'translation', old_row.translation),
       jsonb_build_object('suggested_verdict', new_row.suggested_verdict,
                          'evidence_summary', new_row.evidence_summary,
                          'translation', new_row.translation),
       'human', jsonb_build_object('claim_id', old_row.claim_id));

  elsif p_decision = 'reject' then
    update public.ai_suggestions set
      status      = 'rejected',
      reviewed_by = p_actor,
      reviewed_at = now(),
      updated_at  = now()
    where id = p_id returning * into new_row;

    insert into public.audit_log
      (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
    values
      (p_actor, actor_mail, 'ai_suggestion.reject', 'ai_suggestion', p_id::text,
       jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'rejected'),
       'human', jsonb_build_object('claim_id', old_row.claim_id,
                                   'reason', nullif(btrim(coalesce(p_patch ->> 'reason', '')), '')));

  else  -- approve: publish the claim with the (possibly edited) suggestion
    select * into claim_row from public.claims where id = old_row.claim_id;

    if btrim(coalesce(old_row.translation -> 'explanation' ->> claim_row.source_lang, '')) = '' then
      raise exception 'incomplete_suggestion' using errcode = '22023';
    end if;
    foreach loc in array array['ka', 'hy', 'en'] loop
      if btrim(coalesce(old_row.translation -> 'title' ->> loc, '')) = '' then
        raise exception 'incomplete_suggestion' using errcode = '22023';
      end if;
    end loop;

    -- Writes the claim.publish audit row (source ai_suggestion_accepted) itself.
    perform public.admin_update_claim(
      old_row.claim_id,
      'claim.publish',
      jsonb_build_object(
        'title',       old_row.translation -> 'title',
        'explanation', old_row.translation -> 'explanation',
        'sources',     to_jsonb(claim_row.sources),
        'verdict',     old_row.suggested_verdict),
      p_actor,
      'ai_suggestion_accepted',
      jsonb_build_object('suggestion_id', p_id, 'edited', old_row.edited));

    update public.ai_suggestions set
      status      = 'approved',
      reviewed_by = p_actor,
      reviewed_at = now(),
      updated_at  = now()
    where id = p_id returning * into new_row;

    insert into public.audit_log
      (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
    values
      (p_actor, actor_mail, 'ai_suggestion.approve', 'ai_suggestion', p_id::text,
       jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'approved'),
       'ai_suggestion_accepted',
       jsonb_build_object('claim_id', old_row.claim_id, 'edited', old_row.edited));
  end if;

  return new_row;
end $$;

revoke all on function public.create_ai_suggestion(uuid, text, text, jsonb, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_ai_suggestion(uuid, text, text, jsonb, text, uuid)
  to service_role;

revoke all on function public.review_ai_suggestion(uuid, text, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.review_ai_suggestion(uuid, text, jsonb, uuid)
  to service_role;
