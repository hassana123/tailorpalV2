begin;

-- Required for profile self-upsert from authenticated sessions.
grant select on table public.profiles to anon;
grant select, insert, update on table public.profiles to authenticated;

commit;
