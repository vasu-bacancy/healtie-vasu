import type { DashboardStat, SetupChecklistItem } from "@/types/app";

const dashboardStats: DashboardStat[] = [
  {
    label: "Tenant-safe foundation",
    value: "RLS First",
    hint: "Every core record is designed around organization isolation.",
  },
  {
    label: "Core workflow",
    value: "Book -> Join -> Note",
    hint: "The first release centers the patient-provider visit loop.",
  },
  {
    label: "Demo target",
    value: "12 Hours",
    hint: "Optimized for a hackathon-quality MVP, not a full EHR rollout.",
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

export default function Home() {
  return (
    <main className="app-shell min-h-screen">
      <section className="grid-line mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-12">
        <div className="panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="section-label text-xs font-semibold">Healtie MVP Setup</p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                  Multi-tenant virtual care infrastructure, scoped to a one-day build.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
                  This repository now targets the smallest complete product slice from the
                  SRS: tenant-safe onboarding, scheduling, virtual visits, and lightweight
                  clinical documentation with Next.js and Supabase.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-5 lg:max-w-sm">
                <p className="text-sm font-semibold text-[color:var(--accent-strong)]">
                  Build sequence
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  Schema and RLS first. Then auth and tenant resolution. Then the booking and
                  encounter loop. Everything else waits.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {dashboardStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-5"
                >
                  <p className="text-sm text-[color:var(--muted)]">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{stat.hint}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-6">
                <p className="section-label text-xs font-semibold">What Ships First</p>
                <ul className="mt-5 grid gap-3">
                  {productSlices.map((slice) => (
                    <li
                      key={slice}
                      className="rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4 text-sm leading-6 text-[color:var(--foreground)]"
                    >
                      {slice}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-6">
                <p className="section-label text-xs font-semibold">Next Actions</p>
                <div className="mt-5 space-y-4">
                  {setupChecklist.map((item, index) => (
                    <article key={item.title} className="rounded-[1.25rem] bg-[color:var(--surface-strong)] px-4 py-4">
                      <p className="text-xs font-semibold text-[color:var(--accent-strong)]">
                        Step {index + 1}
                      </p>
                      <h2 className="mt-2 text-base font-semibold">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-6 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>Planning docs: `PLAN.md`, `TODO.md`, and `AGENTS.md`.</p>
              <p>Implementation target: `/org/[slug]` dashboards powered by Supabase auth and RLS.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
