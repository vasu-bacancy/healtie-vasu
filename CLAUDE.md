# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start development server at http://localhost:3000
npm run build    # production build
npm run lint     # run ESLint
```

No test runner is configured yet.

## Environment Setup

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # optional, only needed for admin operations
```

`lib/env.ts` validates these at startup and throws if the public vars are missing.

## Database Setup

Apply the schema and seed data against your Supabase project:
1. Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL editor.
2. Create auth users in the Supabase dashboard using the emails in `supabase/seed.sql`, then run `supabase/seed.sql` to populate demo data.

Seed demo org: **Northstar Virtual Care** (`slug: northstar-care`) with users `admin@northstar.test`, `provider@northstar.test`, `patient@northstar.test`.

## Architecture

### Stack
- **Next.js 16 App Router** — Server Components for data pages, Server Actions or Route Handlers for writes.
- **Supabase** — Auth, Postgres (primary data store), Row Level Security for tenant isolation.
- **Tailwind CSS v4**, **react-hook-form + zod**, **date-fns**.

### Supabase Client Usage
Three clients in `lib/supabase/`:
- `client.ts` — browser client for Client Components (`createBrowserClient`).
- `server.ts` — async server client for Server Components and Route Handlers (`createServerClient` with cookie store).
- `admin.ts` — service-role client (`createAdminClient`) that bypasses RLS; use only in trusted server paths.

### Multi-Tenancy and RLS
Every business record carries `organization_id`. Tenant isolation is enforced at the database level via RLS policies — UI checks alone are insufficient.

Key RLS helper functions defined in the schema:
- `is_member_of_org(org_id)` — checks active membership for `auth.uid()`.
- `has_org_role(org_id, role)` — checks active membership with a specific role.
- `is_patient_record_owner(patient_profile_id)` — checks if `auth.uid()` matches the patient's linked profile.

Role hierarchy: `platform_admin` > `org_admin` > `provider` > `patient`. Only `org_admin` and `provider` can write clinical data; `patient` role is read-oriented.

### Data Model
Core tables (all with `organization_id`): `organizations`, `profiles`, `memberships`, `patients`, `providers`, `provider_availability`, `appointments`, `encounters`, `clinical_notes`, `patient_allergies`, `patient_medications`, `notifications`, `audit_logs`.

`profiles.id` is the Supabase auth user ID. A user's org role comes from `memberships`, not from `profiles`.

### Planned Route Structure
```
/                                   landing / setup page
/login
/onboarding
/org/[slug]/dashboard               role-aware dashboard
/org/[slug]/patients
/org/[slug]/patients/[patientId]    patient chart
/org/[slug]/providers
/org/[slug]/schedule
/org/[slug]/appointments
/org/[slug]/appointments/[id]
/org/[slug]/appointments/[id]/room  virtual visit room
/org/[slug]/settings
```

### Module Layout
```
app/            routes and layouts
components/     UI and feature components
lib/supabase/   Supabase clients and future auth/tenant helpers
lib/db/         query modules (to be created)
supabase/       SQL migrations and seed data
types/          database.ts (typed schema) and app.ts (shared app types)
```

## Key Constraints

- **Tenant isolation is non-negotiable.** All queries must be scoped to the active org; never rely solely on UI guards.
- **No custom WebRTC.** Use a hosted meeting link (e.g. Google Meet) as the virtual visit fallback.
- **Do not build billing, claims, labs, or prescribing.** These are explicitly deferred.
- Prefer Server Components for data-heavy pages; mutations go through Server Actions or Route Handlers.
- The `admin` Supabase client bypasses RLS — only use it in trusted server-side paths, never expose to the client.

## Source of Truth Files

- Product scope and architecture decisions: `PLAN.md`
- Execution checklist and task status: `TODO.md`
- Agent working conventions: `AGENTS.md`
