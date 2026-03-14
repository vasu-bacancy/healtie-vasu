# Project Agent Guide

## Mission
Build a one-day MVP of a multi-tenant virtual healthcare platform based on [docs/srs.pdf](/home/bacancy/Desktop/Projects/Hackathon/healtie/docs/srs.pdf) using `Next.js + Supabase`.

This repo should produce a demoable product, not a fully compliant healthcare platform. Prioritize the core workflow and preserve a clean architecture for future expansion.

## Source Of Truth
- Product direction: [PLAN.md](/home/bacancy/Desktop/Projects/Hackathon/healtie/PLAN.md)
- Execution checklist: [TODO.md](/home/bacancy/Desktop/Projects/Hackathon/healtie/TODO.md)
- Requirements reference: [docs/srs.pdf](/home/bacancy/Desktop/Projects/Hackathon/healtie/docs/srs.pdf)

Read those before making major changes.

## Core Product Slice
The minimum successful build is:

1. Multi-tenant org setup
2. Role-based auth
3. Patient intake
4. Provider availability
5. Appointment booking
6. Virtual appointment room
7. Clinical notes
8. Tenant-safe dashboards

If a proposed feature does not strengthen that flow, defer it.

## Target Users
- `org_admin`
- `provider`
- `patient`

Optional support role:
- `platform_admin`

## Non-Negotiables
- Every tenant-owned row must have `organization_id`.
- Tenant isolation must be enforced with Supabase RLS, not only UI checks.
- Do not block the MVP on third-party healthcare integrations.
- Do not build custom WebRTC on day one.
- Keep the first version optimized for demoability and correctness of flow.

## Architecture Rules

### Frontend
- Use Next.js App Router.
- Prefer Server Components for pages that primarily fetch data.
- Use Server Actions or Route Handlers for writes.
- Keep UI modular but avoid premature abstraction.

### Backend / Data
- Supabase Auth is the identity layer.
- Supabase Postgres is the system of record.
- Supabase Storage is optional and only for documents.
- Add small, typed data-access helpers instead of scattering direct queries everywhere.

### Multi-Tenancy
- Resolve active org from membership.
- Scope all queries by active organization unless the resource is globally safe.
- Use explicit role checks for admin-only actions.

## Expected File / Module Direction
- `app/` for routes and layouts
- `components/` for UI and feature components
- `lib/supabase/` for clients, auth helpers, and tenant helpers
- `lib/db/` or `lib/data/` for query modules
- `supabase/` for schema SQL, policies, and seeds
- `types/` for shared application and database types

If the repo structure evolves differently, keep the separation of concerns equivalent.

## Delivery Strategy

### First Finish
- auth
- tenant context
- schema
- patient flow
- provider flow
- appointment flow
- clinical notes

### Then Improve
- notifications
- analytics
- chat
- uploads

### Defer
- billing
- claims
- labs
- prescribing
- AI
- mobile apps
- FHIR

## UX Rules
- There must be a clear dashboard for each role.
- Appointment state must always be visible.
- A patient must always know the next action: book, join, or view summary.
- A provider must always know the next action: prepare, start visit, or finish note.

## Data Model Minimum
Agents should assume these tables exist or need to exist:
- `organizations`
- `profiles`
- `memberships`
- `patients`
- `providers`
- `provider_availability`
- `appointments`
- `encounters`
- `clinical_notes`
- `notifications`
- `audit_logs`

## Safe Assumptions
- One active organization per session is acceptable for MVP.
- One specialty-focused workflow is acceptable for MVP.
- A hosted meeting link counts as the virtual visit implementation for the hackathon.
- Clinical documentation can be a structured SOAP note instead of a full EHR.

## When Time Is Tight
Cut in this order:

1. analytics
2. secure messaging
3. uploads
4. advanced admin controls
5. anything outside the appointment and note workflow

Do not cut:
- tenant isolation
- auth
- booking
- room page
- documentation

## Definition Of Done
- Two tenants can exist without leaking data.
- A patient can book and join a visit.
- A provider can complete a visit note.
- The app is demoable without manual database patching during the walkthrough.

## Working Style For Agents
- Make small, coherent changes.
- Preserve user changes already in the tree.
- Update the plan if architecture changes materially.
- Prefer simple implementations that can be verified quickly.
- Leave comments only where future agents would otherwise misread intent.

## Handoff Standard
When finishing a task, report:
- what was built
- what remains blocked
- what seed/demo steps should be used to verify it
