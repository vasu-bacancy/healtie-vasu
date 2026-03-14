-- Allow any active org member to read the profiles of other active members
-- in the same organization. Required for provider/patient name resolution
-- in nested joins (e.g. providers.profile, appointments.provider.profile).

create policy "org members can read co-member profiles"
on public.profiles for select
using (
  exists (
    select 1 from public.memberships m1
    join public.memberships m2 on m1.organization_id = m2.organization_id
    where m1.profile_id = auth.uid()
      and m1.status = 'active'
      and m2.profile_id = profiles.id
      and m2.status = 'active'
  )
);
