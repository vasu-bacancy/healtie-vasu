import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatientByProfileId } from "@/lib/db/appointments";
import { updatePatientProfile } from "./actions";

export default async function PatientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership || membership.role !== "patient") redirect(`/org/${slug}`);

  const patient = await getPatientByProfileId(supabase, profile.id, membership.organization_id);
  if (!patient) redirect(`/org/${slug}`);

  return (
    <section className="space-y-6">
      <header className="border-b border-[color:var(--border)] pb-6">
        <p className="text-sm font-semibold text-[color:var(--muted)]">
          {membership.organization.name}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Intake profile
        </h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Keep these details current so your care team can prepare for your visit.
        </p>
      </header>

      {saved === "1" && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
          Intake details saved. Your care team can now use this information for upcoming visits.
        </div>
      )}

      {!patient.intake_completed && (
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Action required:</strong> Finish your intake details before your next visit.
        </div>
      )}

      <div className="mx-auto max-w-xl">
        <form action={updatePatientProfile} className="space-y-4">
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Your details
            </h2>

            <Field label="Full name" required>
              <input
                name="full_name"
                type="text"
                required
                defaultValue={patient.full_name ?? ""}
                placeholder="Your full name"
                className={inputCls}
              />
            </Field>

            <Field label="Date of birth" required>
              <input
                name="dob"
                type="date"
                required
                defaultValue={patient.dob ?? ""}
                className={inputCls}
              />
            </Field>

            <Field label="Sex" hint="Choose the sex listed on your clinical record.">
              <select name="sex" defaultValue={patient.sex ?? ""} className={inputCls}>
                <option value="">Select an option</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>

            <Field label="Phone number" hint="Optional. Add a number if you'd like appointment reminders.">
              <input
                name="phone"
                type="tel"
                defaultValue={patient.phone ?? ""}
                placeholder="+1 555-000-0000"
                className={inputCls}
              />
            </Field>

            <Field label="Email address">
              <input
                name="email"
                type="email"
                defaultValue={patient.email ?? profile.email ?? ""}
                placeholder="you@example.com"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Save intake details
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[color:var(--foreground)]">
        {label}
        {required && <span className="ml-0.5 text-[color:#c13b3b]"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[color:var(--muted)]">{hint}</p>}
    </div>
  );
}
