import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatientByProfileId } from "@/lib/db/appointments";
import { updatePatientProfile } from "./actions";
import {
  FormField,
  Notice,
  PageHeader,
  Surface,
  controlClassName,
  primaryButtonClassName,
} from "@/components/ui/app-kit";

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
      <PageHeader
        eyebrow={membership.organization.name}
        title="Intake profile"
        description="Keep these details current so your care team can prepare before the visit begins."
      />

      {saved === "1" && (
        <Notice tone="success">
          Intake details saved. Your care team can now use this information for upcoming visits.
        </Notice>
      )}

      {!patient.intake_completed && (
        <Notice tone="warning">
          <strong>Action required:</strong> Finish your intake details before your next visit.
        </Notice>
      )}

      <div className="mx-auto max-w-xl">
        <form action={updatePatientProfile} className="space-y-4">
          <Surface className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Your details
            </p>

            <FormField label="Full name" required>
              <input
                name="full_name"
                type="text"
                required
                defaultValue={patient.full_name ?? ""}
                placeholder="Your full name"
                className={controlClassName()}
              />
            </FormField>

            <FormField label="Date of birth" required>
              <input
                name="dob"
                type="date"
                required
                defaultValue={patient.dob ?? ""}
                className={controlClassName()}
              />
            </FormField>

            <FormField label="Sex" hint="Choose the sex listed on your clinical record.">
              <select name="sex" defaultValue={patient.sex ?? ""} className={controlClassName()}>
                <option value="">Select an option</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </FormField>

            <FormField label="Phone number" hint="Optional. Add a number if you'd like appointment reminders.">
              <input
                name="phone"
                type="tel"
                defaultValue={patient.phone ?? ""}
                placeholder="+1 555-000-0000"
                className={controlClassName()}
              />
            </FormField>

            <FormField label="Email address">
              <input
                name="email"
                type="email"
                defaultValue={patient.email ?? profile.email ?? ""}
                placeholder="you@example.com"
                className={controlClassName()}
              />
            </FormField>
          </Surface>

          <div className="flex justify-end">
            <button type="submit" className={primaryButtonClassName}>
              Save intake details
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
