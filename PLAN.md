# Healtie MVP Plan

## Goal
Build a one-day MVP of an API-first, multi-tenant virtual health platform inspired by the SRS in [docs/srs.pdf](/home/bacancy/Desktop/Projects/Hackathon/healtie/docs/srs.pdf). The stack is `Next.js + TypeScript + Supabase`.

The SRS describes a broad healthcare platform. In one day, the product must focus on the smallest coherent slice that proves the core business loop:

1. An organization can operate inside its own tenant.
2. Providers can manage availability and appointments.
3. Patients can register, book, and join virtual appointments.
4. Providers can document the encounter in a lightweight EHR flow.
5. The system is structured so advanced healthcare integrations can be added later.

## Product Positioning
Target the MVP at **virtual-first clinics / therapy practices**. This keeps the first version compatible with the SRS while avoiding heavy dependencies like full claims, lab ordering, and e-prescribing on day one.

## One-Day Scope

### P0: Must Ship
- Multi-tenant organization model with isolated data per organization.
- Auth with role-based access for `platform_admin`, `org_admin`, `provider`, `patient`.
- Organization onboarding seed flow.
- Patient registration and intake.
- Provider dashboard with today's appointments and patient list.
- Patient portal with profile, upcoming appointments, and booking flow.
- Appointment scheduling with provider availability.
- Virtual appointment room page.
- Clinical documentation for a completed visit.
- Basic EHR entities: demographics, allergies, medications, visit notes.
- Audit log for critical actions.
- Basic notifications/reminders inside the app and optional email hooks.

### P1: Ship If Time Remains
- Secure messaging between patient and provider.
- Care plan/task list.
- File upload for intake documents.
- Admin analytics tiles for appointment volume and no-show rate.
- Waitlist or reschedule flow.

### Explicitly Deferred
- Insurance verification.
- E-prescribing and pharmacy integrations.
- Billing, claims, and payment processing.
- Lab and diagnostic integrations.
- Mobile apps.
- AI features.
- FHIR interoperability.
- Full HIPAA automation and compliance reporting.
- White-label theme builder and custom domains.

## MVP Feature Translation From SRS

### Implement Now
- Patient Registration & Onboarding
- Appointment Scheduling
- Video Consultation Engine
- Electronic Health Records
- Provider Dashboard
- Patient Portal
- HIPAA-aware foundation
- Clinical Documentation
- Patient Communication Hub
- Reporting & Analytics
- Multi-Tenant Architecture
- Consent Management

### Represent With Stubs or Internal Models
- Billing
- Prescriptions
- Labs
- Workflow automation
- API management console

These should exist as planned extension points, not finished product areas.

## Architecture Decisions

### Frontend
- `Next.js App Router`
- Server Components for data-heavy screens.
- Server Actions or Route Handlers for mutations.
- Tailwind CSS for fast UI delivery.
- Keep components simple and local until patterns stabilize.

### Backend
- Supabase Auth for login and role bootstrap.
- Supabase Postgres as the primary database.
- Supabase Row Level Security for tenant isolation.
- Supabase Storage for documents if time allows.
- Supabase Realtime only if needed for appointment status or chat.

### Tenant Model
- Every business record carries `organization_id`.
- Users belong to organizations through a `memberships` table.
- Patients are tenant-scoped; the same real-world person in two orgs is modeled as separate tenant patient records for MVP simplicity.
- Tenant switching can be admin-only in MVP.

### Virtual Visit Strategy
- Preferred: embed a third-party hosted video room if keys are available.
- Safe MVP fallback: appointment room page with join status, notes panel, and external meeting URL.
- Do not block the one-day build on custom WebRTC.

## Recommended Data Model

### Core Tables
- `organizations`
- `profiles`
- `memberships`
- `patients`
- `providers`
- `provider_availability`
- `appointments`
- `appointment_participants`
- `encounters`
- `clinical_notes`
- `patient_allergies`
- `patient_medications`
- `consents`
- `messages`
- `notifications`
- `audit_logs`

### Suggested Minimal Fields

#### organizations
- `id`
- `name`
- `slug`
- `status`
- `created_at`

#### profiles
- `id` same as Supabase auth user id
- `full_name`
- `email`
- `avatar_url`
- `phone`
- `global_role`

#### memberships
- `id`
- `organization_id`
- `profile_id`
- `role`
- `status`

#### patients
- `id`
- `organization_id`
- `profile_id` nullable for invited/unclaimed patients
- `full_name`
- `dob`
- `sex`
- `phone`
- `email`
- `status`
- `intake_completed`

#### providers
- `id`
- `organization_id`
- `profile_id`
- `specialty`
- `license_number` nullable
- `timezone`
- `bio`

#### provider_availability
- `id`
- `organization_id`
- `provider_id`
- `day_of_week`
- `start_time`
- `end_time`
- `slot_minutes`

#### appointments
- `id`
- `organization_id`
- `patient_id`
- `provider_id`
- `scheduled_start`
- `scheduled_end`
- `status`
- `visit_type` enum `virtual | in_person`
- `meeting_url`
- `reason`
- `created_by`

#### encounters
- `id`
- `organization_id`
- `appointment_id`
- `patient_id`
- `provider_id`
- `status`
- `started_at`
- `ended_at`

#### clinical_notes
- `id`
- `organization_id`
- `encounter_id`
- `patient_id`
- `provider_id`
- `note_type`
- `subjective`
- `objective`
- `assessment`
- `plan`
- `signed_at`

#### audit_logs
- `id`
- `organization_id`
- `actor_profile_id`
- `entity_type`
- `entity_id`
- `action`
- `metadata`
- `created_at`

## RLS Rules
- Users can only read rows for organizations they are members of.
- Patients can only read their own patient-facing data.
- Providers can read and mutate appointments, encounters, and notes within their tenant.
- Org admins can manage memberships, providers, patients, and appointments within their tenant.
- Platform admins bypass tenant scoping only through explicit service-role paths, not the client.

## Suggested App Structure

### Route Groups
- `/`
- `/login`
- `/onboarding`
- `/org/[slug]/dashboard`
- `/org/[slug]/patients`
- `/org/[slug]/patients/[patientId]`
- `/org/[slug]/providers`
- `/org/[slug]/schedule`
- `/org/[slug]/appointments`
- `/org/[slug]/appointments/[appointmentId]`
- `/org/[slug]/appointments/[appointmentId]/room`
- `/org/[slug]/settings`

### Dashboard Split
- Provider dashboard: today's appointments, upcoming visits, patient shortcuts, note queue.
- Patient portal: book appointment, see upcoming visits, join room, view visit summary.
- Org admin dashboard: providers, patients, schedule overview, high-level metrics.

## API / Server Surface
Use Next.js Route Handlers or Server Actions for:
- auth bootstrap
- organization setup
- patient intake submission
- provider availability upsert
- appointment booking
- appointment status updates
- encounter start/end
- clinical note save/sign
- notification generation

Keep API design close to the SRS endpoint groups so it can evolve cleanly:
- `/auth`
- `/organizations`
- `/patients`
- `/providers`
- `/appointments`
- `/encounters`
- `/clinical-notes`
- `/notifications`

## Build Order

### Phase 1: Foundation
- Install Supabase clients and form/date utilities.
- Create environment setup and Supabase helper modules.
- Replace starter UI with application shell.
- Implement auth guard and organization-aware layout.

### Phase 2: Data Layer
- Create SQL schema and seed data.
- Add RLS policies.
- Add typed query helpers.

### Phase 3: Core Workflows
- Patient intake.
- Provider availability.
- Appointment booking.
- Appointment list/detail pages.
- Virtual room page.
- Clinical note editor.

### Phase 4: Polish
- Role-based navigation.
- Empty states, form validation, status badges.
- Audit logging hooks.
- Basic analytics widgets.

## One-Day Delivery Schedule

### Hour 1
- Finalize schema, route map, and auth model.

### Hours 2-3
- Set up Supabase, auth, layout shell, tenant context.

### Hours 4-6
- Build patient, provider, and appointment data flows.

### Hours 7-8
- Build booking UX and virtual room flow.

### Hours 9-10
- Build encounter notes and patient chart pages.

### Hours 11-12
- Add QA fixes, seed data, demo polish, and deployment prep.

## Definition of Done
- A seeded org admin can log in and see tenant-scoped data.
- A provider can define availability and view appointments.
- A patient can register, book an appointment, and join the visit room.
- A provider can open an appointment, start an encounter, and save a SOAP note.
- Another tenant cannot access or see the first tenant's data.
- The app has enough seeded data and walkthrough polish for a hackathon demo.

## Demo Story
Use this exact demo flow:

1. Create or seed an organization.
2. Log in as org admin and invite a provider.
3. Register a patient and complete intake.
4. Add provider availability.
5. Book a virtual appointment.
6. Join the appointment room as patient.
7. Open the visit as provider.
8. Save a clinical note.
9. Show the patient portal updated with the appointment and summary.

## Risks
- Real video integration can consume too much time.
- RLS bugs can silently break tenant isolation.
- Overbuilding admin features will delay the patient-provider loop.
- Healthcare compliance language may create false expectations if features are only mocked.

## Mitigations
- Use a hosted meeting link fallback.
- Keep schema narrow and relational.
- Finish one end-to-end happy path before adding extras.
- Label deferred integrations clearly in the UI and docs.
