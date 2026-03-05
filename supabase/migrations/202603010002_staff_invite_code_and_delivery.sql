begin;

create extension if not exists "pgcrypto";

alter table public.staff_invitations
  add column if not exists invite_code text;

do $$
declare
  invitation_row record;
  candidate_code text;
begin
  for invitation_row in
    select id
    from public.staff_invitations
    where invite_code is null or invite_code = ''
  loop
    loop
      candidate_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
      exit when not exists (
        select 1 from public.staff_invitations where invite_code = candidate_code
      );
    end loop;

    update public.staff_invitations
    set invite_code = candidate_code
    where id = invitation_row.id;
  end loop;
end $$;

alter table public.staff_invitations
  alter column invite_code set not null;

create unique index if not exists idx_staff_invitations_invite_code
  on public.staff_invitations(invite_code);

commit;
