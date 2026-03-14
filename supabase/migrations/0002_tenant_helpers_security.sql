create or replace function public.is_member_of_org(org_id uuid)
returns boolean
language sql
stable
security definer
set row_security = off
as $$
  select exists (
    select 1
    from public.memberships memberships
    where memberships.organization_id = org_id
      and memberships.profile_id = auth.uid()
      and memberships.status = 'active'
  );
$$;

create or replace function public.has_org_role(org_id uuid, requested_role public.membership_role)
returns boolean
language sql
stable
security definer
set row_security = off
as $$
  select exists (
    select 1
    from public.memberships memberships
    where memberships.organization_id = org_id
      and memberships.profile_id = auth.uid()
      and memberships.status = 'active'
      and memberships.role = requested_role
  );
$$;
