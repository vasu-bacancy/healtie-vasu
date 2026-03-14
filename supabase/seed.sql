insert into public.organizations (id, name, slug, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Northstar Virtual Care', 'northstar-care', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Harbor Behavioral Health', 'harbor-behavioral', 'sandbox')
on conflict (id) do nothing;

-- Auth users should be created through Supabase Auth before inserting matching profiles.
-- These deterministic IDs make demo seeding easy after creating users in the dashboard.
insert into public.profiles (id, full_name, email, phone)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nadia Admin', 'admin@northstar.test', '+1-555-0101'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Priya Provider', 'provider@northstar.test', '+1-555-0102'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Peter Patient', 'patient@northstar.test', '+1-555-0103')
on conflict (id) do nothing;

insert into public.memberships (organization_id, profile_id, role, status)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'org_admin', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'provider', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'patient', 'active')
on conflict do nothing;

insert into public.providers (id, organization_id, profile_id, specialty, timezone, bio)
values
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Primary Care',
    'America/New_York',
    'Virtual-first primary care clinician focused on intake, follow-up, and chronic care coordination.'
  )
on conflict (id) do nothing;

insert into public.patients (id, organization_id, profile_id, full_name, dob, sex, phone, email, intake_completed)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Peter Patient',
    '1994-06-12',
    'male',
    '+1-555-0103',
    'patient@northstar.test',
    true
  )
on conflict (id) do nothing;

insert into public.provider_availability (organization_id, provider_id, day_of_week, start_time, end_time, slot_minutes)
values
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '09:00', '12:00', 30),
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3, '13:00', '17:00', 30)
on conflict do nothing;

insert into public.appointments (
  id,
  organization_id,
  patient_id,
  provider_id,
  scheduled_start,
  scheduled_end,
  status,
  visit_type,
  meeting_url,
  reason,
  created_by
)
values
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    now() + interval '1 day',
    now() + interval '1 day 30 minutes',
    'scheduled',
    'virtual',
    'https://meet.google.com/example-demo-room',
    'Initial care plan review',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  )
on conflict (id) do nothing;

insert into public.notifications (organization_id, profile_id, title, body, type)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Upcoming virtual appointment',
    'You have a virtual visit scheduled for tomorrow with Priya Provider.',
    'appointment_reminder'
  )
on conflict do nothing;
