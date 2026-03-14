import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getAppointment } from "@/lib/db/appointments";
import { updateAppointmentStatus, updateMeetingUrl } from "../actions";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  FormField,
  KeyValueRow,
  PageHeader,
  SectionHeading,
  Surface,
  controlClassName,
  inlineActionClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  scheduled: [
    { label: "Check in patient", next: "checked_in" },
    { label: "Cancel appointment", next: "cancelled" },
  ],
  checked_in: [
    { label: "Start visit", next: "in_progress" },
    { label: "Cancel appointment", next: "cancelled" },
  ],
  in_progress: [{ label: "Mark visit complete", next: "completed" }],
  completed: [],
  cancelled: [],
};

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  const appointment = await getAppointment(supabase, id, membership.organization_id).catch(
    () => null,
  );
  if (!appointment) notFound();

  const canManage = membership.role === "org_admin" || membership.role === "provider";
  const transitions = canManage ? STATUS_TRANSITIONS[appointment.status] ?? [] : [];

  return (
    <section className="space-y-6">
      <PageHeader
        backHref={`/org/${slug}/appointments`}
        backLabel="Appointments"
        title="Appointment details"
        description={`${format(new Date(appointment.scheduled_start), "EEEE, MMMM d, yyyy")} · ${format(new Date(appointment.scheduled_start), "h:mm a")} – ${format(new Date(appointment.scheduled_end), "h:mm a")}`}
        meta={<StatusBadge status={appointment.status} className="px-3 py-1" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Visit details
          </p>
          <dl>
            <KeyValueRow label="Patient">
              {canManage ? (
                <Link
                  href={`/org/${slug}/patients/${appointment.patient_id}`}
                  className={inlineActionClassName}
                >
                  {appointment.patient.full_name}
                </Link>
              ) : (
                appointment.patient.full_name
              )}
            </KeyValueRow>
            <KeyValueRow label="Provider">{appointment.provider.profile?.full_name ?? "—"}</KeyValueRow>
            <KeyValueRow label="Visit type">
              <span className="capitalize">{appointment.visit_type.replace("_", " ")}</span>
            </KeyValueRow>
            <KeyValueRow label="Reason for visit">{appointment.reason ?? "Not provided"}</KeyValueRow>
            <KeyValueRow label="Booked on">
              {format(new Date(appointment.created_at), "MMM d, yyyy")}
            </KeyValueRow>
          </dl>
        </Surface>

        <div className="space-y-4">
          <Surface className="space-y-4">
            <SectionHeading
              label="Video call"
              title="Meeting link"
              description="Share the hosted video link patients should use to join the visit."
            />
            {appointment.meeting_url ? (
              <div className="space-y-3">
                <a
                  href={appointment.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${primaryButtonClassName} w-full truncate`}
                >
                  Join video visit
                </a>
                <p className="truncate text-xs text-[color:var(--muted)]">{appointment.meeting_url}</p>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                No video link has been added yet.
              </p>
            )}

            {canManage ? (
              <form action={updateMeetingUrl} className="space-y-3 border-t border-[color:var(--border)] pt-4">
                <input type="hidden" name="id" value={appointment.id} />
                <FormField label="Hosted meeting URL" hint="Paste the link patients should use to join.">
                  <input
                    name="meeting_url"
                    type="url"
                    defaultValue={appointment.meeting_url ?? ""}
                    placeholder="https://meet.google.com/..."
                    className={controlClassName()}
                  />
                </FormField>
                <button type="submit" className={secondaryButtonClassName}>
                  {appointment.meeting_url ? "Save meeting link" : "Add meeting link"}
                </button>
              </form>
            ) : null}
          </Surface>

          {canManage && transitions.length > 0 ? (
            <Surface className="space-y-4">
              <SectionHeading
                label="Progress"
                title="Manage visit status"
                description="Move the appointment forward as the patient checks in and the visit wraps up."
              />
              <div className="flex flex-wrap gap-2">
                {transitions.map((transition) => (
                  <form key={transition.next} action={updateAppointmentStatus}>
                    <input type="hidden" name="id" value={appointment.id} />
                    <input type="hidden" name="status" value={transition.next} />
                    <button
                      type="submit"
                      className={
                        transition.next === "cancelled"
                          ? secondaryButtonClassName
                          : primaryButtonClassName
                      }
                    >
                      {transition.next === "checked_in"
                        ? "Mark as checked in"
                        : transition.next === "completed"
                          ? "Mark visit complete"
                          : transition.label}
                    </button>
                  </form>
                ))}
              </div>
            </Surface>
          ) : null}

          {appointment.status !== "cancelled" ? (
            <Link
              href={`/org/${slug}/appointments/${appointment.id}/room`}
              className={`${primaryButtonClassName} flex w-full justify-center py-4`}
            >
              Open visit room
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
