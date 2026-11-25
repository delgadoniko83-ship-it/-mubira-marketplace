-- Aplicación atómica de ambientes visuales MUBIRA.
-- Ejecuta ambas actualizaciones en una sola transacción; si la segunda falla,
-- PostgreSQL revierte también la desactivación anterior.
create or replace function public.apply_site_theme(p_theme_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para aplicar un ambiente.';
  end if;

  update public.site_themes
     set is_active = false,
         updated_by = auth.uid(),
         updated_at = now()
   where is_active = true;

  update public.site_themes
     set is_active = true,
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_theme_id;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'No se pudo aplicar el ambiente. Verifica que exista y que tengas permisos de administrador técnico.';
  end if;
end;
$$;

revoke all on function public.apply_site_theme(uuid) from public;
revoke all on function public.apply_site_theme(uuid) from anon;
grant execute on function public.apply_site_theme(uuid) to authenticated;
