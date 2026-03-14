# One-Day Build TODO

## Operating Rule
If a task does not directly improve the end-to-end flow of `org admin -> provider -> patient -> virtual visit -> clinical note`, defer it.

## P0 Critical Path

### 1. Setup
- [x] Install core dependencies: Supabase client, SSR helper, `zod`, date utility, form library.
- [x] Create `.env.local` contract for Supabase URL, anon key, service role key.
- [x] Replace default starter page with app shell and landing/login redirect.
- [ ] Add shared UI primitives for cards, tables, forms, dialogs, badges.

### 2. Supabase Foundation
- [x] Write initial schema for organizations, profiles, memberships, patients, providers, availability, appointments, encounters, clinical notes, notifications, audit logs.
- [x] Create seed data for one org admin, one provider, one patient, and a few appointments.
- [x] Enable RLS on all tenant-owned tables.
- [x] Add tenant-safe policies based on membership and role.
- [x] Generate TypeScript database types if time allows.

### 3. Auth and Tenant Context
- [x] Add Supabase auth flow.
- [x] Create profile bootstrap on first login.
- [x] Resolve active organization from membership.
- [x] Protect private routes.
- [x] Add role-aware navigation for org admin, provider, patient.

### 4. Patient Management
- [x] Build patient registration / intake form.
- [x] Build patient list page for provider/admin.
- [x] Build patient chart page with demographics, allergies, medications, notes.
- [x] Store consent acceptance and intake completion state.

### 5. Provider Scheduling
- [ ] Build provider profile page.
- [ ] Build weekly availability editor.
- [ ] Convert availability into bookable appointment slots.
- [ ] Prevent double booking.

### 6. Appointment Flow
- [ ] Build appointment booking UI for patients.
- [ ] Build appointment list and detail page.
- [ ] Support appointment statuses: `scheduled`, `checked_in`, `in_progress`, `completed`, `cancelled`.
- [ ] Generate meeting URL or store external meeting link.

### 7. Virtual Visit
- [ ] Build appointment room page with patient and provider context.
- [ ] Show appointment metadata, join button, status controls, and notes shortcut.
- [ ] Add safe fallback for video using hosted meeting link if native integration is unavailable.

### 8. Clinical Documentation
- [ ] Create encounter record when visit starts.
- [ ] Build SOAP note form.
- [ ] Save and display signed note in patient chart.
- [ ] Add audit log events for note creation and appointment status changes.

### 9. Dashboards
- [ ] Provider dashboard with today's schedule and pending notes.
- [ ] Patient portal with upcoming appointment and chart summary.
- [ ] Org admin dashboard with counts for patients, providers, appointments.

### 10. QA / Demo Prep
- [ ] Test with at least two organizations to verify isolation.
- [ ] Verify patient cannot access another patient's chart.
- [ ] Verify provider can only see their tenant's records.
- [ ] Add loading, error, and empty states.
- [ ] Prepare a clean demo seed and walkthrough script.

## P1 If Time Remains
- [ ] Secure messaging between patient and provider.
- [ ] Notifications center with reminder generation.
- [ ] File upload for intake docs.
- [ ] Analytics cards for completed visits and no-shows.
- [ ] Appointment rescheduling and cancellation UX.

## P2 Deferred On Purpose
- [ ] Insurance verification
- [ ] Billing and claims
- [ ] E-prescribing
- [ ] Labs and diagnostics
- [ ] Mobile apps
- [ ] AI features
- [ ] FHIR interoperability
- [ ] Full white-labeling

## Suggested Execution Sequence
1. Schema and RLS
2. Auth and organization-aware layout
3. Seed data and dashboards
4. Patient intake and provider availability
5. Appointment booking
6. Virtual room
7. Encounter + SOAP notes
8. QA and demo polish

## Hard Stop Rules
- Do not build custom video infrastructure on day one.
- Do not attempt claims, insurance, or prescribing without a stub-only UI.
- Do not widen the schema until the happy path works end to end.
- Do not spend more than 30 minutes on visual polish before workflows are complete.
