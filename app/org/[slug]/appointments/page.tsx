import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import {
  getAppointments,
  getPatientAppointments,
  getPatientByProfileId,
  STATUS_LABEL,
  STATUS_COLOR,
} from "@/lib/db/appointments";

export default async function AppointmentsPage({
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
  if (!membership) redirect("/sign-in");

  // Patients only see their own appointments
  let appointments;
  if (membership.role === "patient") {
    const patient = await getPatientByProfileId(supabase, profile.id, membership.organization_id);
    appointments = patient
      ? await getPatientAppointments(supabase, patient.id, membership.organization_id)
      : [];
  } else {
    appointments = await getAppointments(supabase, membership.organization_id);
  }

  const canBook = true; // all roles can book

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between border-b border-[color:var(--border)] pb-6">
        <div>
          <p className="text-sm font-semibold text-[color:var(--muted)]">
            {membership.organization.name}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Appointments
          </h1>
        </div>
        {canBook && (
          <Link
            href={`/org/${slug}/appointments/new`}
            className="rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
          >
            Book appointment
          </Link>
        )}
      </header>

      {appointments.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-12 text-center">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            No appointments yet
          </p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Book an appointment to get started.
          </p>
          <Link
            href={`/org/${slug}/appointments/new`}
            className="mt-5 inline-block rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
          >
            Book appointment
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Date & time
                </th>
                {membership.role !== "patient" && (
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Patient
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Status
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {appointments.map((appt) => (
                <tr key={appt.id} className="transition hover:bg-[color:var(--surface)]">
                  <td className="px-6 py-4 text-[color:var(--foreground)]">
                    <p className="font-medium">
                      {format(new Date(appt.scheduled_start), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {format(new Date(appt.scheduled_start), "h:mm a")} –{" "}
                      {format(new Date(appt.scheduled_end), "h:mm a")}
                    </p>
                  </td>
                  {membership.role !== "patient" && (
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      {appt.patient.full_name}
                    </td>
                  )}
                  <td className="px-6 py-4 text-[color:var(--muted)]">
                    {appt.provider.profile?.full_name ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[appt.status] ?? "bg-zinc-100 text-zinc-500"}`}
                    >
                      {STATUS_LABEL[appt.status] ?? appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/org/${slug}/appointments/${appt.id}`}
                      className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
