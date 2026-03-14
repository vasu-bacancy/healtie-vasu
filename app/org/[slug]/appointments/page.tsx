import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import {
  getAppointments,
  getPatientAppointments,
  getPatientByProfileId,
} from "@/lib/db/appointments";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  EmptyState,
  PageHeader,
  TableWrap,
  primaryButtonClassName,
  inlineActionClassName,
} from "@/components/ui/app-kit";

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
      <PageHeader
        eyebrow={membership.organization.name}
        title="Appointments"
        description="Keep booking, room access, and visit status moving from one clear queue."
        action={
          canBook ? (
            <Link href={`/org/${slug}/appointments/new`} className={primaryButtonClassName}>
              Book a visit
            </Link>
          ) : null
        }
      />

      {appointments.length === 0 ? (
        <EmptyState
          title="No visits are on the schedule yet."
          description="Book a visit to choose a provider, time, and meeting link."
          action={
            <Link href={`/org/${slug}/appointments/new`} className={primaryButtonClassName}>
              Book your first visit
            </Link>
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--surface-subtle)]">
              <tr className="border-b border-[color:var(--border)]">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Date & time
                </th>
                {membership.role !== "patient" && (
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Patient
                  </th>
                )}
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Status
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {appointments.map((appt) => (
                <tr key={appt.id} className="motion-lift transition hover:bg-[color:var(--surface-subtle)]">
                  <td className="px-6 py-5 text-[color:var(--foreground)]">
                    <p className="font-medium">
                      {format(new Date(appt.scheduled_start), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {format(new Date(appt.scheduled_start), "h:mm a")} –{" "}
                      {format(new Date(appt.scheduled_end), "h:mm a")}
                    </p>
                  </td>
                  {membership.role !== "patient" && (
                    <td className="px-6 py-5 text-[color:var(--foreground)]">
                      {appt.patient.full_name}
                    </td>
                  )}
                  <td className="px-6 py-5 text-[color:var(--muted)]">
                    {appt.provider.profile?.full_name ?? "—"}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/org/${slug}/appointments/${appt.id}`} className={inlineActionClassName}>
                      View appointment
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </section>
  );
}
