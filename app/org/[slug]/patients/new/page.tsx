import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { createPatient } from "../actions";
import {
  FormField,
  PageHeader,
  Surface,
  controlClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

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
      <PageHeader
        backHref={`/org/${slug}/patients`}
        backLabel="Patients"
        title="Add a patient"
        description="Create a patient record so the team can schedule visits and keep clinical notes in one place."
      />

      <div className="mx-auto max-w-xl">
        <form action={createPatient} className="space-y-4">
          <Surface className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Demographics
            </p>

            <FormField label="Full name" required>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Jane Smith"
                className={controlClassName()}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date of birth">
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  className={controlClassName()}
                />
              </FormField>

              <FormField label="Sex">
                <select
                  id="sex"
                  name="sex"
                  className={controlClassName()}
                >
                  <option value="">Select an option</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
            </div>
          </Surface>

          <Surface className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Contact
            </p>

            <FormField label="Email address">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                className={controlClassName()}
              />
            </FormField>

            <FormField label="Phone number">
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 555 000 0000"
                className={controlClassName()}
              />
            </FormField>
          </Surface>

          <div className="flex gap-3 justify-end">
            <Link href={`/org/${slug}/patients`} className={secondaryButtonClassName}>
              Back to patients
            </Link>
            <button type="submit" className={primaryButtonClassName}>
              Create patient record
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
