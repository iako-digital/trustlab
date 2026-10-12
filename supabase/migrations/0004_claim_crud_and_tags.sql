-- Claim tags + audited create / edit / delete for admins.
-- Same pattern as admin_update_claim: the change and its audit_log row are one
-- transaction; callable only with the service-role key after requireAdmin().

alter table public.claims add column if not exists tags text[] not null default '{}';
alter table public.claims drop constraint if exists claims_tags_limits;
alter table public.claims add constraint claims_tags_limits
  check (cardinality(tags) <= 10);

-- Changed columns only (old -> new), ignoring updated_at.
create function public.claim_diff(p_old jsonb, p_new jsonb, p_side text) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  from jsonb_each(case when p_side = 'old' then p_old else p_new end) e
  where e.key <> 'updated_at'
    and (case when p_side = 'old' then p_new else p_old end) -> e.key is distinct from e.value;
$$;

-- --------------------------------------------------------------------- create
-- p_data: {title, claim, explanation, category, sourceLang, sourceUrl, sources[], tags[], verdict|null}
-- verdict null  -> saved as a pending claim; verdict set -> published right away.
create function public.admin_create_claim(p_data jsonb, p_actor uuid)
returns public.claims
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_mail text;
  new_row    public.claims;
  v_verdict  text := nullif(p_data ->> 'verdict', '');
begin
  select email into actor_mail from public.admin_users where user_id = p_actor;
  if not found then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  insert into public.claims
    (title, claim, explanation, state, verdict, category, source_lang, submission_type,
     source_url, sources, tags, verified_by, verified_at)
  values (
    p_data -> 'title',
    p_data -> 'claim',
    coalesce(p_data -> 'explanation', '{"ka":"","hy":"","en":""}'::jsonb),
    case when v_verdict is null then 'pending' else 'published' end,
    v_verdict,
    p_data ->> 'category',
    p_data ->> 'sourceLang',
    case when nullif(p_data ->> 'sourceUrl', '') is null then 'text' else 'link' end,
    nullif(p_data ->> 'sourceUrl', ''),
    coalesce(array(select jsonb_array_elements_text(p_data -> 'sources')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_data -> 'tags')), '{}'),
    case when v_verdict is null then null else p_actor end,
    case when v_verdict is null then null else now() end
  ) returning * into new_row;

  insert into public.audit_log
    (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
  values
    (p_actor, actor_mail, 'claim.create', 'claim', new_row.id::text, null, to_jsonb(new_row), 'human', '{}'::jsonb);

  return new_row;
end $$;

-- ----------------------------------------------------------------------- edit
-- Edits content only; the lifecycle state never changes here (use publish/reject/restore).
-- The verdict can be changed on a published claim, but not removed.
create function public.admin_edit_claim(p_id uuid, p_data jsonb, p_actor uuid)
returns public.claims
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_mail text;
  old_row    public.claims;
  new_row    public.claims;
  v_verdict  text := nullif(p_data ->> 'verdict', '');
begin
  select email into actor_mail from public.admin_users where user_id = p_actor;
  if not found then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into old_row from public.claims where id = p_id for update;
  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  if old_row.state = 'published' and v_verdict is null then
    raise exception 'verdict_required' using errcode = '22023';
  end if;

  update public.claims set
    title       = p_data -> 'title',
    claim       = p_data -> 'claim',
    explanation = coalesce(p_data -> 'explanation', explanation),
    category    = p_data ->> 'category',
    source_lang = p_data ->> 'sourceLang',
    source_url  = nullif(p_data ->> 'sourceUrl', ''),
    sources     = coalesce(array(select jsonb_array_elements_text(p_data -> 'sources')), '{}'),
    tags        = coalesce(array(select jsonb_array_elements_text(p_data -> 'tags')), '{}'),
    verdict     = case when old_row.state = 'published' then v_verdict else old_row.verdict end,
    updated_at  = now()
  where id = p_id returning * into new_row;

  insert into public.audit_log
    (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
  values
    (p_actor, actor_mail, 'claim.update', 'claim', p_id::text,
     public.claim_diff(to_jsonb(old_row), to_jsonb(new_row), 'old'),
     public.claim_diff(to_jsonb(old_row), to_jsonb(new_row), 'new'),
     'human', '{}'::jsonb);

  return new_row;
end $$;

-- --------------------------------------------------------------------- delete
-- Hard delete. The full row is kept in audit_log.old_value, so it can be restored by hand.
-- Dependent AI suggestions, comments and evidence rows go with it (files in the
-- private 'evidence' bucket are not touched).
create function public.admin_delete_claim(p_id uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_mail text;
  old_row    public.claims;
begin
  select email into actor_mail from public.admin_users where user_id = p_actor;
  if not found then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into old_row from public.claims where id = p_id for update;
  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  insert into public.audit_log
    (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
  values
    (p_actor, actor_mail, 'claim.delete', 'claim', p_id::text, to_jsonb(old_row), null, 'human',
     jsonb_build_object(
       'evidence_rows', (select count(*) from public.evidence where claim_id = p_id),
       'comment_rows',  (select count(*) from public.comments where claim_id = p_id)));

  delete from public.ai_suggestions where claim_id = p_id;
  delete from public.comments       where claim_id = p_id;
  delete from public.evidence       where claim_id = p_id;
  delete from public.claims         where id = p_id;
end $$;

revoke all on function public.admin_create_claim(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.admin_edit_claim(uuid, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.admin_delete_claim(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_create_claim(jsonb, uuid) to service_role;
grant execute on function public.admin_edit_claim(uuid, jsonb, uuid) to service_role;
grant execute on function public.admin_delete_claim(uuid, uuid) to service_role;
