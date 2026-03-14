insert into public.organizations (id, name, slug, status)
values
  ('0932ac26-d678-4749-953f-794e94dc4a6a', 'Northstar Virtual Care', 'northstar-care', 'active'),
  ('f4d14ddf-b498-416c-9064-14b74e9b255f', 'Harbor Behavioral Health', 'harbor-behavioral', 'sandbox')
on conflict (id) do nothing;

-- Auth users should be created through Supabase Auth before inserting matching profiles.
-- These deterministic IDs make demo seeding easy after creating users in the dashboard.
insert into public.profiles (id, full_name, email, phone)
values
  ('b44cae23-5878-4907-aaa2-6f67a776721c', 'Nadia Admin', 'admin@northstar.test', '+1-555-0101'),
  ('fa5c69f4-69a5-405f-867c-3f19709b6357', 'Priya Provider', 'provider@northstar.test', '+1-555-0102'),
  ('c53a06ff-310e-4dd8-b2f4-2c98974cba0a', 'Peter Patient', 'patient@northstar.test', '+1-555-0103')
on conflict (id) do nothing;

insert into public.memberships (organization_id, profile_id, role, status)
values
  ('0932ac26-d678-4749-953f-794e94dc4a6a', 'b44cae23-5878-4907-aaa2-6f67a776721c', 'org_admin', 'active'),
  ('0932ac26-d678-4749-953f-794e94dc4a6a', 'fa5c69f4-69a5-405f-867c-3f19709b6357', 'provider', 'active'),
  ('0932ac26-d678-4749-953f-794e94dc4a6a', 'c53a06ff-310e-4dd8-b2f4-2c98974cba0a', 'patient', 'active')
on conflict do nothing;

insert into public.providers (id, organization_id, profile_id, specialty, timezone, bio)
values
  (
    'c566c1e7-74ec-465d-81c3-4ce175b3d8b1',
    '0932ac26-d678-4749-953f-794e94dc4a6a',
    'fa5c69f4-69a5-405f-867c-3f19709b6357',
    'Primary Care',
    'America/New_York',
    'Virtual-first primary care clinician focused on intake, follow-up, and chronic care coordination.'
  )
on conflict (id) do nothing;

insert into public.patients (id, organization_id, profile_id, full_name, dob, sex, phone, email, intake_completed)
values
  (
    'e6315fb6-f09d-4ab7-b2e9-306c7ff3c5a0',
    '0932ac26-d678-4749-953f-794e94dc4a6a',
    'c53a06ff-310e-4dd8-b2f4-2c98974cba0a',
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
  ('0932ac26-d678-4749-953f-794e94dc4a6a', 'c566c1e7-74ec-465d-81c3-4ce175b3d8b1', 1, '09:00', '12:00', 30),
  ('0932ac26-d678-4749-953f-794e94dc4a6a', 'c566c1e7-74ec-465d-81c3-4ce175b3d8b1', 3, '13:00', '17:00', 30)
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
    '135dd047-1ee2-4441-80c5-7143bf2b934d',
    '0932ac26-d678-4749-953f-794e94dc4a6a',
    'e6315fb6-f09d-4ab7-b2e9-306c7ff3c5a0',
    'c566c1e7-74ec-465d-81c3-4ce175b3d8b1',
    now() + interval '1 day',
    now() + interval '1 day 30 minutes',
    'scheduled',
    'virtual',
    'https://meet.google.com/example-demo-room',
    'Initial care plan review',
    'b44cae23-5878-4907-aaa2-6f67a776721c'
  )
on conflict (id) do nothing;

insert into public.notifications (organization_id, profile_id, title, body, type)
values
  (
    '0932ac26-d678-4749-953f-794e94dc4a6a',
    'c53a06ff-310e-4dd8-b2f4-2c98974cba0a',
    'Upcoming virtual appointment',
    'You have a virtual visit scheduled for tomorrow with Priya Provider.',
    'appointment_reminder'
  )
on conflict do nothing;
