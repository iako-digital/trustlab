-- Admin actions on claims. Each action changes the claim AND writes the audit
-- row in one transaction, so a state change can never exist without its log.
-- Callable only with the service-role key (server routes after requireAdmin()).

create function public.admin_update_claim(
  p_id     uuid,
  p_action text,                        -- claim.publish | claim.reject | claim.restore
  p_patch  jsonb,
  p_actor  uuid,
  p_source text default 'human',        -- human | ai_suggestion_accepted
  p_meta   jsonb default '{}'::jsonb
) returns public.claims
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row    public.claims;
  new_row    public.claims;
  actor_mail text;
  old_diff   jsonb;
  new_diff   jsonb;
begin
  if p_source not in ('human', 'ai_suggestion_accepted') then
    raise exception 'invalid_source' using errcode = '22023';
  end if;

  select email into actor_mail from public.admin_users where user_id = p_actor;
  if not found then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into old_row from public.claims where id = p_id for update;
  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  if p_action = 'claim.publish' then
    if old_row.state <> 'pending' then
      raise exception 'invalid_state' using errcode = '22023';
    end if;
    update public.claims set
      title       = p_patch -> 'title',
      explanation = p_patch -> 'explanation',
      sources     = coalesce(
                      array(select jsonb_array_elements_text(p_patch -> 'sources')),
                      '{}'),
      verdict     = p_patch ->> 'verdict',
      state       = 'published',
      verified_by = p_actor,
      verified_at = now(),
      updated_at  = now()
    where id = p_id returning * into new_row;

  elsif p_action = 'claim.reject' then
    if old_row.state <> 'pending' then
      raise exception 'invalid_state' using errcode = '22023';
    end if;
    update public.claims set
      state         = 'rejected',
      reject_reason = btrim(p_patch ->> 'reason'),
      rejected_by   = p_actor,
      rejected_at   = now(),
      updated_at    = now()
    where id = p_id returning * into new_row;

  elsif p_action = 'claim.restore' then
    if old_row.state <> 'rejected' then
      raise exception 'invalid_state' using errcode = '22023';
    end if;
    update public.claims set
      state         = 'pending',
      reject_reason = null,
      rejected_by   = null,
      rejected_at   = null,
      updated_at    = now()
    where id = p_id returning * into new_row;

  else
    raise exception 'unknown_action' using errcode = '22023';
  end if;

  -- Store only the columns that actually changed (old -> new).
  select
    coalesce(jsonb_object_agg(o.key, o.value), '{}'::jsonb)
  into old_diff
  from jsonb_each(to_jsonb(old_row)) o
  where o.key <> 'updated_at' and to_jsonb(new_row) -> o.key is distinct from o.value;

  select
    coalesce(jsonb_object_agg(n.key, n.value), '{}'::jsonb)
  into new_diff
  from jsonb_each(to_jsonb(new_row)) n
  where n.key <> 'updated_at' and to_jsonb(old_row) -> n.key is distinct from n.value;

  insert into public.audit_log
    (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
  values
    (p_actor, actor_mail, p_action, 'claim', p_id::text, old_diff, new_diff, p_source, p_meta);

  return new_row;
end $$;

revoke all on function public.admin_update_claim(uuid, text, jsonb, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_update_claim(uuid, text, jsonb, uuid, text, jsonb)
  to service_role;
