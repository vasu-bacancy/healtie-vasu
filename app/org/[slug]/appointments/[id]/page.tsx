import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getAppointment, STATUS_LABEL, STATUS_COLOR } from "@/lib/db/appointments";
import { updateAppointmentStatus, updateMeetingUrl } from "../actions";

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  scheduled: [
    { label: "Check in", next: "checked_in" },
    { label: "Cancel", next: "cancelled" },
  ],
  checked_in: [
    { label: "Start visit", next: "in_progress" },
    { label: "Cancel", next: "cancelled" },
  ],
  in_progress: [{ label: "Complete", next: "completed" }],
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

  const appt = await getAppointment(supabase, id, membership.organization_id).catch(
    () => null,
  );
  if (!appt) notFound();

  const canManage = membership.role === "org_admin" || membership.role === "provider";
  const transitions = canManage ? (STATUS_TRANSITIONS[appt.status] ?? []) : [];

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between border-b border-[color:var(--border)] pb-6">
        <div className="space-y-1">
          <Link
            href={`/org/${slug}/appointments`}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            ← Appointments
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {format(new Date(appt.scheduled_start), "EEEE, MMMM d, yyyy")}
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Details
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Patient">
              {canManage ? (
                <Link
                  href={`/org/${slug}/patients/${appt.patient_id}`}
                  className="font-medium text-[color:var(--accent)] hover:underline"
                >
                  {appt.patient.full_name}
                </Link>
              ) : (
                appt.patient.full_name
              )}
            </Row>
            <Row label="Provider">{appt.provider.profile?.full_name ?? "—"}</Row>
            <Row label="Visit type">
              <span className="capitalize">{appt.visit_type.replace("_", " ")}</span>
            </Row>
            <Row label="Reason">{appt.reason ?? "—"}</Row>
            <Row label="Booked">
              {format(new Date(appt.created_at), "MMM d, yyyy")}
            </Row>
          </dl>
        </div>

        {/* Meeting + Status */}
        <div className="space-y-4">
          {/* Meeting URL */}
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Meeting link
            </h2>
            {appt.meeting_url ? (
              <div className="space-y-3">
                <a
                  href={appt.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Join meeting →
                </a>
                <p className="text-xs text-[color:var(--muted)] truncate">{appt.meeting_url}</p>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--muted)]">No meeting link set.</p>
            )}

            {canManage && (
              <form action={updateMeetingUrl} className="space-y-2 border-t border-[color:var(--border)] pt-3">
                <input type="hidden" name="id" value={appt.id} />
                <input
                  name="meeting_url"
                  type="url"
                  defaultValue={appt.meeting_url ?? ""}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                />
                <button
                  type="submit"
                  className="rounded-[0.75rem] border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
                >
                  {appt.meeting_url ? "Update link" : "Add link"}
                </button>
              </form>
            )}
          </div>

          {/* Status controls */}
          {canManage && transitions.length > 0 && (
            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Update status
              </h2>
              <div className="flex flex-wrap gap-2">
                {transitions.map((t) => (
                  <form key={t.next} action={updateAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value={t.next} />
                    <button
                      type="submit"
                      className={`rounded-[0.75rem] px-4 py-2 text-sm font-semibold transition ${
                        t.next === "cancelled"
                          ? "border border-[color:#c13b3b] text-[color:#c13b3b] hover:bg-[color:#fef2f2]"
                          : "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-strong)]"
                      }`}
                    >
                      {t.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {/* Room link */}
          {appt.status !== "cancelled" && (
            <Link
              href={`/org/${slug}/appointments/${appt.id}/room`}
              className="flex w-full items-center justify-center rounded-[1.5rem] bg-[color:var(--accent)] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Enter visit room →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-[color:var(--muted)]">{label}</dt>
      <dd className="font-medium text-[color:var(--foreground)]">{children}</dd>
    </div>
  );
}
