import Link from "next/link";
import { redirect } from "next/navigation";

import SlotPicker from "@/components/appointments/SlotPicker";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatients } from "@/lib/db/patients";
import { getProviders, getProviderAvailability, getProviderAppointmentsForDate, generateBookableSlots } from "@/lib/db/providers";
import { getPatientByProfileId } from "@/lib/db/appointments";
import { bookAppointment } from "../actions";

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

  // Self-patient: resolve their patient record
  const selfPatient = isPatient
    ? await getPatientByProfileId(supabase, profile.id, orgId)
    : null;

  // Compute slots when provider + date are selected
  let slots: { start: string; end: string; label: string }[] = [];
  let selectedProvider = providers.find((p) => p.id === provider_id) ?? null;

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
      <header className="flex items-center gap-4 border-b border-[color:var(--border)] pb-6">
        <Link
          href={`/org/${slug}/appointments`}
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          ← Appointments
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Book appointment
        </h1>
      </header>

      <div className="mx-auto max-w-xl space-y-4">
        {/* Step 1 – provider + date selector (GET form) */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Step 1 — Choose provider & date
          </h2>
          <form method="GET" className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[color:var(--foreground)]">
                Provider
              </label>
              <select
                name="provider_id"
                required
                defaultValue={provider_id ?? ""}
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              >
                <option value="" disabled>
                  — Select a provider —
                </option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profile?.full_name ?? p.profile?.email ?? "Unknown provider"}
                    {p.specialty ? ` — ${p.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[color:var(--foreground)]">
                Date
              </label>
              <input
                name="date"
                type="date"
                required
                min={today}
                defaultValue={date ?? ""}
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-[1rem] border border-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--accent)] transition hover:bg-[color:var(--accent)] hover:text-white"
            >
              Find available slots
            </button>
          </form>
        </div>

        {/* Step 2 – slot picker + booking form (POST action) */}
        {provider_id && date && (
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Step 2 — Select a slot & confirm
            </h2>

            {slots.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No available slots on this date. Try a different date or provider.
              </p>
            ) : (
              <form action={bookAppointment} className="space-y-4">
                <input type="hidden" name="provider_id" value={provider_id} />
                {!isPatient && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[color:var(--foreground)]">
                      Patient
                    </label>
                    <select
                      name="patient_id"
                      required
                      className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                    >
                      <option value="" disabled defaultValue="">
                        — Select a patient —
                      </option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Available slots{" "}
                    <span className="font-normal text-[color:var(--muted)]">
                      ({selectedProvider?.profile?.full_name ?? ""}, {date})
                    </span>
                  </label>
                  <SlotPicker slots={slots} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Visit type
                  </label>
                  <select
                    name="visit_type"
                    defaultValue="virtual"
                    className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                  >
                    <option value="virtual">Virtual</option>
                    <option value="in_person">In person</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Reason for visit{" "}
                    <span className="font-normal text-[color:var(--muted)]">(optional)</span>
                  </label>
                  <input
                    name="reason"
                    type="text"
                    placeholder="e.g. Annual check-up"
                    className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
                >
                  Confirm booking
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
