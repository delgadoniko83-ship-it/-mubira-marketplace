-- Unique names and safe deletion for MUBIRA visual environments.
update public.site_themes
set name='Navidad - borrador', updated_at=now()
where theme_key='navidad-1795589362323' and is_active=false;

create unique index if not exists site_themes_name_ci_unique
on public.site_themes (lower(btrim(name)));

create or replace function public.delete_site_theme(p_theme_id uuid)
returns text[]
language plpgsql
security invoker
set search_path=public,pg_temp
as $$
declare
  v_settings jsonb;
  v_paths text[];
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para eliminar un ambiente.';
  end if;

  delete from public.site_themes
   where id=p_theme_id
     and theme_key <> 'mubira-base'
     and is_active=false
   returning settings into v_settings;

  if not found then
    raise exception 'No se eliminó: el ambiente está aplicado, es el Original o no tienes permiso. Actualiza la biblioteca e inténtalo de nuevo.';
  end if;

  select coalesce(array_agg(value->>'image_path'),array[]::text[])
    into v_paths
    from jsonb_each(coalesce(v_settings->'screens','{}'::jsonb))
   where value ? 'image_path'
     and nullif(value->>'image_path','') is not null;

  return v_paths;
end;
$$;

revoke all on function public.delete_site_theme(uuid) from public;
revoke all on function public.delete_site_theme(uuid) from anon;
grant execute on function public.delete_site_theme(uuid) to authenticated;
