import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getAppointment } from "@/lib/db/appointments";
import { getEncounterByAppointmentId } from "@/lib/db/encounters";
import { updateAppointmentStatus } from "../../actions";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  KeyValueRow,
  Notice,
  PageHeader,
  SectionHeading,
  Surface,
  inlineActionClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  scheduled: [{ label: "Check in patient", next: "checked_in" }],
  checked_in: [{ label: "Start visit", next: "in_progress" }],
  in_progress: [{ label: "End visit and mark complete", next: "completed" }],
  completed: [],
  cancelled: [],
};

export default async function VisitRoomPage({
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

  const encounter = await getEncounterByAppointmentId(
    supabase,
    id,
    membership.organization_id,
  );

  const canManage = membership.role === "org_admin" || membership.role === "provider";
  const transitions = canManage ? STATUS_TRANSITIONS[appointment.status] ?? [] : [];
  const isActive = appointment.status === "in_progress";
  const isDone = appointment.status === "completed" || appointment.status === "cancelled";

  return (
    <section className="space-y-6">
      <PageHeader
        backHref={`/org/${slug}/appointments/${id}`}
        backLabel="Appointment details"
        title="Virtual visit room"
        description={`${format(new Date(appointment.scheduled_start), "EEEE, MMMM d, yyyy")} · ${format(new Date(appointment.scheduled_start), "h:mm a")} – ${format(new Date(appointment.scheduled_end), "h:mm a")}`}
        meta={<StatusBadge status={appointment.status} className="px-3 py-1" />}
      />

      {appointment.status === "scheduled" ? (
        <Notice tone="accent">
          This room is ready. Check the patient in when they arrive, then start the visit to unlock the SOAP note.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Surface className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Participants
            </p>
            <dl>
              <KeyValueRow label="Patient">
                {canManage ? (
                  <Link href={`/org/${slug}/patients/${appointment.patient_id}`} className={inlineActionClassName}>
                    {appointment.patient.full_name}
                  </Link>
                ) : (
                  appointment.patient.full_name
                )}
              </KeyValueRow>
              <KeyValueRow label="Provider">{appointment.provider.profile?.full_name ?? "—"}</KeyValueRow>
              {appointment.reason ? (
                <KeyValueRow label="Visit reason" stacked>
                  {appointment.reason}
                </KeyValueRow>
              ) : null}
            </dl>
          </Surface>

          {!isDone && canManage ? (
            <Surface className="space-y-4">
              <SectionHeading
                label="Visit controls"
                title="Move the visit forward"
                description="Update the room state as the patient arrives, the call starts, and the encounter ends."
              />
              {transitions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {transitions.map((transition) => (
                    <form key={transition.next} action={updateAppointmentStatus}>
                      <input type="hidden" name="id" value={appointment.id} />
                      <input type="hidden" name="status" value={transition.next} />
                      <button type="submit" className={primaryButtonClassName}>
                        {transition.label}
                      </button>
                    </form>
                  ))}
                  {appointment.status !== "completed" ? (
                    <form action={updateAppointmentStatus}>
                      <input type="hidden" name="id" value={appointment.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <button type="submit" className={secondaryButtonClassName}>
                        Cancel visit
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  This visit is already in its final state.
                </p>
              )}
            </Surface>
          ) : null}

          {encounter ? (
            <Surface className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Encounter
              </p>
              <dl>
                <KeyValueRow label="Status">
                  <span className="capitalize">{encounter.status.replace("_", " ")}</span>
                </KeyValueRow>
                {encounter.started_at ? (
                  <KeyValueRow label="Started">
                    {format(new Date(encounter.started_at), "h:mm a")}
                  </KeyValueRow>
                ) : null}
                {encounter.ended_at ? (
                  <KeyValueRow label="Ended">
                    {format(new Date(encounter.ended_at), "h:mm a")}
                  </KeyValueRow>
                ) : null}
              </dl>
            </Surface>
          ) : null}
        </div>

        <div className="space-y-4">
          <Surface className="space-y-4">
            <SectionHeading
              label="Video call"
              title="Join the visit"
              description="Open the hosted call in a new tab when the patient is ready."
            />
            {appointment.meeting_url ? (
              <a
                href={appointment.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${primaryButtonClassName} flex w-full justify-center`}
              >
                Join video visit
              </a>
            ) : (
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                No video link has been added yet.
              </p>
            )}
            {!appointment.meeting_url && canManage ? (
              <Link href={`/org/${slug}/appointments/${id}`} className={inlineActionClassName}>
                Add a meeting link from appointment details
              </Link>
            ) : null}
          </Surface>

          {canManage && (isActive || isDone) && encounter ? (
            <Link
              href={`/org/${slug}/appointments/${id}/note`}
              className="motion-lift block rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_24px_50px_rgba(24,33,43,0.06)] transition hover:bg-[color:var(--surface-subtle)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Clinical note
              </p>
              <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                Open SOAP note
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Capture the visit summary before the patient chart closes for the day.
              </p>
            </Link>
          ) : null}

          {canManage && !encounter && !isDone ? (
            <Surface className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Clinical note
              </p>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                Start the visit to unlock the SOAP note editor.
              </p>
            </Surface>
          ) : null}
        </div>
      </div>
    </section>
  );
}
