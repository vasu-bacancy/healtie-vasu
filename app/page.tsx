import type { DashboardStat, SetupChecklistItem } from "@/types/app";

import LoginForm from "@/components/auth/LoginForm";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";

const dashboardStats: DashboardStat[] = [
  {
    label: "Tenant-safe foundation",
    value: "RLS First",
    hint: "Every core record stays scoped to the active clinic.",
  },
  {
    label: "Core workflow",
    value: "Book -> Join -> Note",
    hint: "The first release centers the patient and provider visit loop.",
  },
  {
    label: "Demo target",
    value: "12 Hours",
    hint: "Built to demo the core workflow quickly, not to replace a full EHR.",
  },
];

const setupChecklist: SetupChecklistItem[] = [
  {
    title: "Configure Supabase",
    description:
      "Add the project URL, anon key, and service role key to `.env.local` using `.env.example` as the contract.",
  },
  {
    title: "Apply SQL schema",
    description:
      "Run the migration in `supabase/migrations/0001_initial_schema.sql` and seed with `supabase/seed.sql`.",
  },
  {
    title: "Start feature implementation",
    description:
      "Begin with auth, active organization resolution, and role-aware dashboard routes under `/org/[slug]`.",
  },
];

const productSlices = [
  "Multi-tenant org model with memberships and RLS policies",
  "Patient intake, provider availability, and appointment booking",
  "Virtual room page with hosted meeting fallback",
  "Encounter + SOAP note workflow for lightweight documentation",
];

export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const profile = await ensureProfileForUser(supabase, session.user);
    const membership = await getActiveMembershipWithOrg(supabase, profile.id);

    if (membership) {
      redirect(`/org/${membership.organization.slug}`);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)]">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="hero-pill">Healtie MVP release</p>
              <h1 className="text-4xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-5xl">
                A focused path from sign-in to signed notes.
              </h1>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                Sign in with the demo account and explore the clinic admin, provider, and patient dashboards.
                The experience stays narrow: auth, intake, availability, booking, meetings, and notes.
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              {dashboardStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.5rem] border border-[color:var(--border)] bg-white px-4 py-4"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    {stat.label}
                  </dt>
                  <dd className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{stat.value}</dd>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{stat.hint}</p>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white px-6 py-6 shadow-sm">
            <p className="text-sm font-semibold text-[color:var(--accent-strong)]">Sign in</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Demo credentials unlock the clinic workspace so you can try every role in a single walk-through.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </div>

        <section className="section-tint space-y-4 px-6 py-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Demo priorities
            </h2>
            <p className="text-sm text-[color:var(--muted)]">
              The release lives inside these focused slices.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-[color:var(--foreground)]">
            {productSlices.map((slice) => (
              <li
                key={slice}
                className="flex items-start gap-3 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:rgba(255,255,255,0.9)] px-4 py-3 shadow-[0_20px_40px_rgba(15,118,110,0.05)]"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--accent-sun)]" aria-hidden />
                <span>{slice}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section-tint space-y-3 px-6 py-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Next setup steps
            </h2>
            <p className="text-sm text-[color:var(--muted)]">
              Keep the backend wired before you start building pages and features.
            </p>
          </div>
          <ol className="space-y-3 text-sm text-[color:var(--foreground)]">
            {setupChecklist.map((item, index) => (
              <li
                key={item.title}
                className="rounded-[1.25rem] border-l-4 border-[color:var(--accent-sun)] bg-[color:rgba(255,255,255,0.92)] px-5 py-4 shadow-[0_10px_30px_rgba(15,118,110,0.08)]"
              >
                <p className="text-[color:var(--accent-sun)] text-[10px] font-semibold uppercase tracking-[0.35em]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{item.title}</p>
                <p className="mt-1 text-sm leading-6">{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="text-xs text-[color:var(--muted)]">
          <p>Planning docs: `PLAN.md`, `TODO.md`, and `AGENTS.md`.</p>
          <p>Target implementation: `/org/[slug]` dashboards with Supabase auth and RLS.</p>
        </footer>
      </section>
    </main>
  );
}
