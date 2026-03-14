import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getAppointment, STATUS_LABEL, STATUS_COLOR } from "@/lib/db/appointments";
import { getEncounterByAppointmentId } from "@/lib/db/encounters";
import { updateAppointmentStatus } from "../../actions";

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

  const appt = await getAppointment(supabase, id, membership.organization_id).catch(
    () => null,
  );
  if (!appt) notFound();

  const encounter = await getEncounterByAppointmentId(
    supabase,
    id,
    membership.organization_id,
  );

  const canManage = membership.role === "org_admin" || membership.role === "provider";
  const transitions = canManage ? (STATUS_TRANSITIONS[appt.status] ?? []) : [];
  const isActive = appt.status === "in_progress";
  const isDone = appt.status === "completed" || appt.status === "cancelled";

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between border-b border-[color:var(--border)] pb-6">
        <div className="space-y-1">
          <Link
            href={`/org/${slug}/appointments/${id}`}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            ← Appointment details
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Virtual visit room
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            {format(new Date(appt.scheduled_start), "EEEE, MMMM d, yyyy")} ·{" "}
            {format(new Date(appt.scheduled_start), "h:mm a")} –{" "}
            {format(new Date(appt.scheduled_end), "h:mm a")}
          </p>
        </div>
        <span
          className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[appt.status] ?? "bg-zinc-100 text-zinc-500"}`}
        >
          {STATUS_LABEL[appt.status] ?? appt.status}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: context + controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Participants */}
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Participants
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--muted)]">Patient</span>
                {canManage ? (
                  <Link
                    href={`/org/${slug}/patients/${appt.patient_id}`}
                    className="font-semibold text-[color:var(--accent)] hover:underline"
                  >
                    {appt.patient.full_name}
                  </Link>
                ) : (
                  <span className="font-semibold text-[color:var(--foreground)]">
                    {appt.patient.full_name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--muted)]">Provider</span>
                <span className="font-semibold text-[color:var(--foreground)]">
                  {appt.provider.profile?.full_name ?? "—"}
                </span>
              </div>
              {appt.reason && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[color:var(--muted)]">Visit reason</span>
                  <span className="text-right font-medium text-[color:var(--foreground)]">
                    {appt.reason}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status controls */}
          {!isDone && canManage && (
            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Visit controls
              </h2>
              <p className="text-sm text-[color:var(--muted)]">
                Update the visit status as the patient arrives, the call starts, and the visit ends.
              </p>
              {transitions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {transitions.map((t) => (
                    <form key={t.next} action={updateAppointmentStatus}>
                      <input type="hidden" name="id" value={appt.id} />
                      <input type="hidden" name="status" value={t.next} />
                      <button
                        type="submit"
                        className="rounded-[0.75rem] bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
                      >
                        {t.label}
                      </button>
                    </form>
                  ))}
                  {/* Cancel always available */}
                  {appt.status !== "completed" && (
                    <form action={updateAppointmentStatus}>
                      <input type="hidden" name="id" value={appt.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <button
                        type="submit"
                        className="rounded-[0.75rem] border border-[color:#c13b3b] px-4 py-2 text-sm font-semibold text-[color:#c13b3b] transition hover:bg-[color:#fef2f2]"
                      >
                        Cancel visit
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  This visit is already in its final state.
                </p>
              )}
            </div>
          )}

          {/* Encounter info */}
          {encounter && (
            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Encounter
              </h2>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted)]">Status</span>
                  <span className="font-semibold capitalize text-[color:var(--foreground)]">
                    {encounter.status.replace("_", " ")}
                  </span>
                </div>
                {encounter.started_at && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted)]">Started</span>
                    <span className="font-medium text-[color:var(--foreground)]">
                      {format(new Date(encounter.started_at), "h:mm a")}
                    </span>
                  </div>
                )}
                {encounter.ended_at && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted)]">Ended</span>
                    <span className="font-medium text-[color:var(--foreground)]">
                      {format(new Date(encounter.ended_at), "h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: meeting + note */}
        <div className="space-y-4">
          {/* Meeting link */}
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Video call
            </h2>
            {appt.meeting_url ? (
              <a
                href={appt.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-[1rem] bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Join video visit
              </a>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[color:var(--muted)]">
                  No video link has been added yet.
                </p>
                {canManage && (
                  <Link
                    href={`/org/${slug}/appointments/${id}`}
                    className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                  >
                    Go to appointment details to add a link
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Clinical note shortcut */}
          {canManage && (isActive || isDone) && encounter && (
            <Link
              href={`/org/${slug}/appointments/${id}/note`}
              className="flex w-full flex-col items-start rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 transition hover:bg-[color:var(--surface)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Clinical note
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                Open SOAP note
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Capture the visit summary before you close the patient chart.
              </p>
            </Link>
          )}

          {canManage && !encounter && !isDone && (
            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Clinical note
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Start the visit to open the SOAP note.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
