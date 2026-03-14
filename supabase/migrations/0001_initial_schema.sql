create extension if not exists "pgcrypto";

create type public.organization_status as enum ('active', 'sandbox', 'archived');
create type public.membership_role as enum ('org_admin', 'provider', 'patient');
create type public.membership_status as enum ('active', 'invited', 'suspended');
create type public.patient_status as enum ('active', 'inactive');
create type public.appointment_status as enum ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled');
create type public.visit_type as enum ('virtual', 'in_person');
create type public.encounter_status as enum ('draft', 'in_progress', 'completed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'sandbox',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  dob date,
  sex text,
  phone text,
  email text,
  status public.patient_status not null default 'active',
  intake_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  specialty text,
  license_number text,
  timezone text not null default 'UTC',
  bio text,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 30 check (slot_minutes > 0),
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  visit_type public.visit_type not null default 'virtual',
  meeting_url text,
  reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  status public.encounter_status not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  encounter_id uuid not null references public.encounters (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  note_type text not null default 'soap',
  subjective text,
  objective text,
  assessment text,
  plan text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  substance text not null,
  reaction text,
  created_at timestamptz not null default now()
);

create table public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  medication_name text not null,
  dosage text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index appointments_org_start_idx on public.appointments (organization_id, scheduled_start);
create index appointments_provider_start_idx on public.appointments (provider_id, scheduled_start);
create index memberships_profile_idx on public.memberships (profile_id);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);
create index patients_org_idx on public.patients (organization_id, full_name);

create or replace function public.is_member_of_org(org_id uuid)
returns boolean
language sql
stable
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

create or replace function public.is_patient_record_owner(patient_profile_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = patient_profile_id;
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.patients enable row level security;
alter table public.providers enable row level security;
alter table public.provider_availability enable row level security;
alter table public.appointments enable row level security;
alter table public.encounters enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.patient_allergies enable row level security;
alter table public.patient_medications enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles can read self"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles can update self"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "members can read orgs"
on public.organizations for select
using (public.is_member_of_org(id));

create policy "members can read memberships"
on public.memberships for select
using (public.is_member_of_org(organization_id));

create policy "org admins manage memberships"
on public.memberships for all
using (public.has_org_role(organization_id, 'org_admin'))
with check (public.has_org_role(organization_id, 'org_admin'));

create policy "members read patients"
on public.patients for select
using (
  public.is_member_of_org(organization_id)
  or public.is_patient_record_owner(profile_id)
);

create policy "org staff manage patients"
on public.patients for all
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read providers"
on public.providers for select
using (public.is_member_of_org(organization_id));

create policy "org admins manage providers"
on public.providers for all
using (public.has_org_role(organization_id, 'org_admin'))
with check (public.has_org_role(organization_id, 'org_admin'));

create policy "members read provider availability"
on public.provider_availability for select
using (public.is_member_of_org(organization_id));

create policy "org staff manage provider availability"
on public.provider_availability for all
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read appointments"
on public.appointments for select
using (public.is_member_of_org(organization_id));

create policy "patients read own appointments"
on public.appointments for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
);

create policy "patients can book appointments"
on public.appointments for insert
with check (
  public.is_member_of_org(organization_id)
  or exists (
    select 1
    from public.patients
    where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
  )
);

create policy "org staff manage appointments"
on public.appointments for update
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read encounters"
on public.encounters for select
using (public.is_member_of_org(organization_id));

create policy "providers manage encounters"
on public.encounters for all
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read notes"
on public.clinical_notes for select
using (public.is_member_of_org(organization_id));

create policy "providers manage notes"
on public.clinical_notes for all
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read allergies"
on public.patient_allergies for select
using (public.is_member_of_org(organization_id));

create policy "org staff manage allergies"
on public.patient_allergies for all
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read medications"
on public.patient_medications for select
using (public.is_member_of_org(organization_id));

create policy "org staff manage medications"
on public.patient_medications for all
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
)
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "members read notifications"
on public.notifications for select
using (profile_id = auth.uid());

create policy "org staff manage notifications"
on public.notifications for all
using (
  public.is_member_of_org(organization_id)
  and (
    public.has_org_role(organization_id, 'org_admin')
    or public.has_org_role(organization_id, 'provider')
  )
)
with check (
  public.is_member_of_org(organization_id)
  and (
    public.has_org_role(organization_id, 'org_admin')
    or public.has_org_role(organization_id, 'provider')
  )
);

create policy "org staff read audit logs"
on public.audit_logs for select
using (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);

create policy "org staff insert audit logs"
on public.audit_logs for insert
with check (
  public.has_org_role(organization_id, 'org_admin')
  or public.has_org_role(organization_id, 'provider')
);
