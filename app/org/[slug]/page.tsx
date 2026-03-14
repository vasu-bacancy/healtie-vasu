import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatients } from "@/lib/db/patients";
import { getProviders, getProviderByProfileId, getProviderAppointmentsForDate } from "@/lib/db/providers";
import { getAppointments, getPatientAppointments, getPatientByProfileId, STATUS_LABEL, STATUS_COLOR } from "@/lib/db/appointments";

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  const orgId = membership.organization_id;
  const role = membership.role;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // ── Org Admin ──────────────────────────────────────────────────────────────
  if (role === "org_admin") {
    const [patients, providers, appointments] = await Promise.all([
      getPatients(supabase, orgId),
      getProviders(supabase, orgId),
      getAppointments(supabase, orgId),
    ]);

    const activePatients = patients.filter((p) => p.status === "active").length;
    const pendingIntake = patients.filter((p) => !p.intake_completed).length;
    const upcoming = appointments.filter(
      (a) => new Date(a.scheduled_start) >= now && a.status !== "cancelled",
    );
    const nextFive = upcoming.slice(0, 5);

    return (
      <section className="space-y-6">
        <header className="border-b border-[color:var(--border)] pb-6">
          <p className="text-sm font-semibold text-[color:var(--muted)]">{membership.organization.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">Dashboard</h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active patients" value={activePatients} href={`/org/${slug}/patients`} />
          <StatCard title="Providers" value={providers.length} href={`/org/${slug}/providers`} />
          <StatCard title="Upcoming appointments" value={upcoming.length} href={`/org/${slug}/appointments`} />
          <StatCard title="Pending intake" value={pendingIntake} href={`/org/${slug}/patients`} accent={pendingIntake > 0} />
        </div>

        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Upcoming appointments</h2>
            <Link href={`/org/${slug}/appointments`} className="text-xs font-semibold text-[color:var(--accent)] hover:underline">View all</Link>
          </div>
          {nextFive.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No upcoming appointments.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {nextFive.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{appt.patient.full_name}</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {format(new Date(appt.scheduled_start), "MMM d, h:mm a")} · {appt.provider.profile?.full_name ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[appt.status]}`}>
                      {STATUS_LABEL[appt.status]}
                    </span>
                    <Link href={`/org/${slug}/appointments/${appt.id}`} className="text-xs font-semibold text-[color:var(--accent)] hover:underline">View</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  // ── Provider ───────────────────────────────────────────────────────────────
  if (role === "provider") {
    const provider = await getProviderByProfileId(supabase, profile.id, orgId);

    const todayAppts = provider
      ? await getProviderAppointmentsForDate(supabase, provider.id, orgId, today)
      : [];

    // Unsigned notes for this provider
    const { data: pendingNotes } = provider
      ? await supabase
          .from("clinical_notes")
          .select("id, created_at, patient:patients(full_name), encounter:encounters(appointment_id)")
          .eq("provider_id", provider.id)
          .eq("organization_id", orgId)
          .is("signed_at", null)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };

    return (
      <section className="space-y-6">
        <header className="border-b border-[color:var(--border)] pb-6">
          <p className="text-sm font-semibold text-[color:var(--muted)]">{membership.organization.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Today&apos;s schedule
          </h1>
          <p className="text-sm text-[color:var(--muted)]">{format(now, "EEEE, MMMM d, yyyy")}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Appointments today" value={todayAppts.length} href={`/org/${slug}/appointments`} />
          <StatCard title="Unsigned notes" value={pendingNotes?.length ?? 0} href={`/org/${slug}/appointments`} accent={(pendingNotes?.length ?? 0) > 0} />
        </div>

        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Today&apos;s appointments</h2>
            <Link href={`/org/${slug}/appointments`} className="text-xs font-semibold text-[color:var(--accent)] hover:underline">All appointments</Link>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No appointments scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {todayAppts.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {format(new Date(appt.scheduled_start), "h:mm a")} – {format(new Date(appt.scheduled_end), "h:mm a")}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">{appt.reason ?? "No reason given"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[appt.status]}`}>
                      {STATUS_LABEL[appt.status]}
                    </span>
                    <Link href={`/org/${slug}/appointments/${appt.id}/room`} className="text-xs font-semibold text-[color:var(--accent)] hover:underline">
                      Room
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(pendingNotes?.length ?? 0) > 0 && (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Unsigned notes</h2>
            <ul className="divide-y divide-amber-200">
              {pendingNotes!.map((note: any) => (
                <li key={note.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {(note.patient as any)?.full_name ?? "Unknown patient"}
                    </p>
                    <p className="text-xs text-amber-700">
                      Created {format(new Date(note.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {(note.encounter as any)?.appointment_id && (
                    <Link
                      href={`/org/${slug}/appointments/${(note.encounter as any).appointment_id}/note`}
                      className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                    >
                      Sign note
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  // ── Patient ────────────────────────────────────────────────────────────────
  const patient = await getPatientByProfileId(supabase, profile.id, orgId);
  const allAppts = patient ? await getPatientAppointments(supabase, patient.id, orgId) : [];

  const upcomingAppts = allAppts.filter(
    (a) => new Date(a.scheduled_start) >= now && a.status !== "cancelled",
  );
  const nextAppt = upcomingAppts[0] ?? null;
  const pastAppts = allAppts.filter((a) => new Date(a.scheduled_start) < now).length;

  return (
    <section className="space-y-6">
      <header className="border-b border-[color:var(--border)] pb-6">
        <p className="text-sm font-semibold text-[color:var(--muted)]">{membership.organization.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
      </header>

      {patient && !patient.intake_completed && (
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <strong>Complete your profile</strong> — your care team needs your demographics before your first visit.
          </p>
          <a
            href={`/org/${slug}/profile`}
            className="shrink-0 rounded-[1rem] bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Complete now
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Upcoming visits" value={upcomingAppts.length} href={`/org/${slug}/appointments`} />
        <StatCard title="Past visits" value={pastAppts} href={`/org/${slug}/appointments`} />
      </div>

      {/* Next appointment */}
      {nextAppt ? (
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Next appointment</h2>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-[color:var(--foreground)]">
              {format(new Date(nextAppt.scheduled_start), "EEEE, MMMM d")}
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              {format(new Date(nextAppt.scheduled_start), "h:mm a")} – {format(new Date(nextAppt.scheduled_end), "h:mm a")}
              {" · "}{nextAppt.provider.profile?.full_name ?? "Provider"}
            </p>
            {nextAppt.reason && (
              <p className="text-sm text-[color:var(--muted)]">Reason: {nextAppt.reason}</p>
            )}
          </div>
          <div className="flex gap-3">
            {nextAppt.meeting_url && (
              <a
                href={nextAppt.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[1rem] bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Join meeting →
              </a>
            )}
            <Link
              href={`/org/${slug}/appointments/${nextAppt.id}`}
              className="rounded-[1rem] border border-[color:var(--border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
            >
              View details
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Next appointment</h2>
          <p className="text-sm text-[color:var(--muted)]">No upcoming appointments.</p>
          <Link
            href={`/org/${slug}/appointments/new`}
            className="inline-block rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
          >
            Book an appointment
          </Link>
        </div>
      )}

      {/* Quick links */}
      {patient && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/org/${slug}/patients/${patient.id}`}
            className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-5 transition hover:bg-[color:var(--surface)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">My chart</p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">View health record →</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">Allergies, medications, clinical notes</p>
          </Link>
          <Link
            href={`/org/${slug}/appointments/new`}
            className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-5 transition hover:bg-[color:var(--surface)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Book visit</p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">Schedule appointment →</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">Find available slots with your provider</p>
          </Link>
        </div>
      )}
    </section>
  );
}

function StatCard({
  title,
  value,
  href,
  accent = false,
}: {
  title: string;
  value: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[1.5rem] border px-6 py-5 shadow-[0_12px_40px_rgba(24,33,43,0.06)] transition hover:shadow-md ${
        accent
          ? "border-amber-200 bg-amber-50"
          : "border-[color:var(--border)] bg-white"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${accent ? "text-amber-700" : "text-[color:var(--muted)]"}`}>
        {title}
      </p>
      <p className={`mt-3 text-3xl font-semibold ${accent ? "text-amber-800" : "text-[color:var(--foreground)]"}`}>
        {value}
      </p>
    </Link>
  );
}
