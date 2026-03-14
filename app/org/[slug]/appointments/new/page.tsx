import { redirect } from "next/navigation";

import SlotPicker from "@/components/appointments/SlotPicker";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatients } from "@/lib/db/patients";
import { getProviders, getProviderAvailability, getProviderAppointmentsForDate, generateBookableSlots } from "@/lib/db/providers";
import { bookAppointment } from "../actions";
import {
  FormField,
  PageHeader,
  Surface,
  controlClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

export default async function NewAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ provider_id?: string; date?: string }>;
}) {
  const { slug } = await params;
  const { provider_id, date } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  const orgId = membership.organization_id;
  const isPatient = membership.role === "patient";

  const [providers, patients] = await Promise.all([
    getProviders(supabase, orgId),
    isPatient ? Promise.resolve([]) : getPatients(supabase, orgId),
  ]);

  // Compute slots when provider + date are selected
  let slots: { start: string; end: string; label: string }[] = [];
  const selectedProvider = providers.find((p) => p.id === provider_id) ?? null;

  if (provider_id && date) {
    const [availability, booked] = await Promise.all([
      getProviderAvailability(supabase, provider_id, orgId),
      getProviderAppointmentsForDate(supabase, provider_id, orgId, date),
    ]);
    slots = generateBookableSlots(availability, booked, date);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="space-y-6">
      <PageHeader
        backHref={`/org/${slug}/appointments`}
        backLabel="Appointments"
        title="Schedule an appointment"
        description="Choose a provider, confirm an open slot, and file the visit details in one flow."
      />

      <div className="mx-auto max-w-xl space-y-4">
        <Surface className="space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Step 1: Choose a provider and date
          </p>
          <p className="text-sm text-[color:var(--muted)]">
            Select a provider to see the times patients can book on that day.
          </p>
          <form method="GET" className="space-y-4">
            <FormField label="Provider" required>
              <select
                name="provider_id"
                required
                defaultValue={provider_id ?? ""}
                className={controlClassName()}
              >
                <option value="" disabled>
                  Select a provider
                </option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profile?.full_name ?? p.profile?.email ?? "Unknown provider"}
                    {p.specialty ? ` — ${p.specialty}` : ""}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Visit date" required>
              <input
                name="date"
                type="date"
                required
                min={today}
                defaultValue={date ?? ""}
                className={controlClassName()}
              />
            </FormField>

            <button type="submit" className={`${secondaryButtonClassName} w-full`}>
              Show available times
            </button>
          </form>
        </Surface>

        {provider_id && date && (
          <Surface className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Step 2: Pick a time and confirm visit details
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              Review the open times, then finish the appointment details below.
            </p>

            {slots.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No times are open on this date. Try another day or choose a different provider.
              </p>
            ) : (
              <form action={bookAppointment} className="space-y-4">
                <input type="hidden" name="provider_id" value={provider_id} />
                {!isPatient && (
                  <FormField label="Patient record" required>
                    <select
                      name="patient_id"
                      required
                      className={controlClassName()}
                    >
                      <option value="" disabled defaultValue="">
                        Select a patient
                      </option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                        ))}
                    </select>
                  </FormField>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Choose a time{" "}
                    <span className="font-normal text-[color:var(--muted)]">
                      ({selectedProvider?.profile?.full_name ?? ""}, {date})
                    </span>
                  </label>
                  <SlotPicker slots={slots} />
                </div>

                <FormField label="Visit type">
                  <select
                    name="visit_type"
                    defaultValue="virtual"
                    className={controlClassName()}
                  >
                    <option value="virtual">Video visit</option>
                    <option value="in_person">In-person visit</option>
                  </select>
                </FormField>

                <FormField
                  label="Reason for visit"
                  hint="Optional. Add a short note so the care team knows what this visit is for."
                >
                  <input
                    name="reason"
                    type="text"
                    placeholder="For example: Follow-up, medication review, new symptoms"
                    className={controlClassName()}
                  />
                </FormField>

                <button type="submit" className={`${primaryButtonClassName} w-full`}>
                  Book appointment
                </button>
              </form>
            )}
          </Surface>
        )}
      </div>
    </section>
  );
}
