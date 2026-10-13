-- Claim cover images: a nullable URL column, accepted by the audited admin
-- create / edit functions, plus a public storage bucket for admin uploads.
-- p_data additionally carries coverImageUrl (string | null).

alter table public.claims add column if not exists cover_image_url text;
alter table public.claims drop constraint if exists claims_cover_image_url_http;
alter table public.claims add constraint claims_cover_image_url_http
  check (cover_image_url is null or (cover_image_url ~* '^https?://' and char_length(cover_image_url) <= 2048));

-- Public-read bucket; only the service role (admin upload API) can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('claim-covers', 'claim-covers', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create or replace function public.admin_create_claim(p_data jsonb, p_actor uuid)
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
     source_url, sources, tags, cover_image_url, verified_by, verified_at)
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
    nullif(p_data ->> 'coverImageUrl', ''),
    case when v_verdict is null then null else p_actor end,
    case when v_verdict is null then null else now() end
  ) returning * into new_row;

  insert into public.audit_log
    (actor_id, actor_email, action, entity_type, entity_id, old_value, new_value, source, meta)
  values
    (p_actor, actor_mail, 'claim.create', 'claim', new_row.id::text, null, to_jsonb(new_row), 'human', '{}'::jsonb);

  return new_row;
end $$;

create or replace function public.admin_edit_claim(p_id uuid, p_data jsonb, p_actor uuid)
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
    cover_image_url = nullif(p_data ->> 'coverImageUrl', ''),
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


grant execute on function public.admin_create_claim(jsonb, uuid) to service_role;
grant execute on function public.admin_edit_claim(uuid, jsonb, uuid) to service_role;
