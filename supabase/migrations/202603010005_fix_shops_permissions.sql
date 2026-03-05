begin;

-- Required for shop creation/update from authenticated sessions.
grant select on table public.shops to anon;
grant select, insert, update, delete on table public.shops to authenticated;

commit;
