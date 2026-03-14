import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { createPatient } from "../actions";

export default async function NewPatientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership || membership.role === "patient") redirect(`/org/${slug}`);

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-4 border-b border-[color:var(--border)] pb-6">
        <Link
          href={`/org/${slug}/patients`}
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          ← Patients
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Register patient
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-xl">
        <form action={createPatient} className="space-y-4">
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Demographics
            </h2>

            <div className="space-y-1">
              <label
                htmlFor="full_name"
                className="text-sm font-semibold text-[color:var(--foreground)]"
              >
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Jane Smith"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="dob"
                  className="text-sm font-semibold text-[color:var(--foreground)]"
                >
                  Date of birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="sex"
                  className="text-sm font-semibold text-[color:var(--foreground)]"
                >
                  Sex
                </label>
                <select
                  id="sex"
                  name="sex"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                >
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Contact
            </h2>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-[color:var(--foreground)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="phone"
                className="text-sm font-semibold text-[color:var(--foreground)]"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 555 000 0000"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link
              href={`/org/${slug}/patients`}
              className="rounded-[1rem] border border-[color:var(--border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Register patient
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
