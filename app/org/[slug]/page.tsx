import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatients } from "@/lib/db/patients";
import {
  getProviders,
  getProviderByProfileId,
  getProviderAppointmentsForDate,
} from "@/lib/db/providers";
import {
  getAppointments,
  getPatientAppointments,
  getPatientByProfileId,
} from "@/lib/db/appointments";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  MetricCard,
  Notice,
  PageHeader,
  SectionHeading,
  Surface,
  inlineActionClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

type PendingNoteRow = {
  id: string;
  created_at: string;
  patient: { full_name: string } | { full_name: string }[] | null;
  encounter: { appointment_id: string | null } | { appointment_id: string | null }[] | null;
};

export default async function OrgDashboardPage({
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

  const orgId = membership.organization_id;
  const role = membership.role;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  if (role === "org_admin") {
    const [patients, providers, appointments] = await Promise.all([
      getPatients(supabase, orgId),
      getProviders(supabase, orgId),
      getAppointments(supabase, orgId),
    ]);

    const activePatients = patients.filter((patient) => patient.status === "active").length;
    const pendingIntake = patients.filter((patient) => !patient.intake_completed).length;
    const upcoming = appointments.filter(
      (appointment) =>
        new Date(appointment.scheduled_start) >= now && appointment.status !== "cancelled",
    );
    const nextFive = upcoming.slice(0, 5);

    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow={membership.organization.name}
          title="Clinic dashboard"
          description="Track patient volume, provider coverage, and the visits that need the team’s attention next."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active patients"
            value={activePatients}
            hint="Patients with a current chart in this organization."
            href={`/org/${slug}/patients`}
          />
          <MetricCard
            label="Providers"
            value={providers.length}
            hint="Clinicians available for booking."
            href={`/org/${slug}/providers`}
          />
          <MetricCard
            label="Upcoming visits"
            value={upcoming.length}
            hint="Booked appointments that are still ahead."
            href={`/org/${slug}/appointments`}
          />
          <MetricCard
            label="Pending intake"
            value={pendingIntake}
            hint="Patients who still need chart details before care."
            href={`/org/${slug}/patients`}
            tone={pendingIntake > 0 ? "warning" : "default"}
          />
        </div>

        <Surface className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <SectionHeading
              label="Queue"
              title="Upcoming appointments"
              description="Review the next scheduled visits without opening the full appointment list."
            />
            <Link href={`/org/${slug}/appointments`} className={inlineActionClassName}>
              See all appointments
            </Link>
          </div>
          <AppointmentList
            items={nextFive.map((appointment) => ({
              id: appointment.id,
              title: appointment.patient.full_name,
              subtitle: `${format(new Date(appointment.scheduled_start), "MMM d, h:mm a")} · ${appointment.provider.profile?.full_name ?? "—"}`,
              status: appointment.status,
              href: `/org/${slug}/appointments/${appointment.id}`,
              actionLabel: "Review visit",
            }))}
            emptyText="No appointments are scheduled yet. New bookings will appear here automatically."
          />
        </Surface>
      </section>
    );
  }

  if (role === "provider") {
    const provider = await getProviderByProfileId(supabase, profile.id, orgId);

    const todayAppointments = provider
      ? await getProviderAppointmentsForDate(supabase, provider.id, orgId, today)
      : [];

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

    const noteRows = ((pendingNotes ?? []) as PendingNoteRow[]).map((note) => ({
      ...note,
      patientName: extractPatientName(note.patient),
      appointmentId: extractAppointmentId(note.encounter),
    }));

    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow={membership.organization.name}
          title="Today’s schedule"
          description="Start visits from this queue, then finish any unsigned notes before the day closes."
          meta={
            <p className="text-sm text-[color:var(--muted)]">
              {format(now, "EEEE, MMMM d, yyyy")}
            </p>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Visits today"
            value={todayAppointments.length}
            hint="Scheduled visits in today’s clinic queue."
            href={`/org/${slug}/appointments`}
          />
          <MetricCard
            label="Notes to sign"
            value={pendingNotes?.length ?? 0}
            hint="Unsigned notes waiting to be filed."
            href={`/org/${slug}/appointments`}
            tone={(pendingNotes?.length ?? 0) > 0 ? "warning" : "default"}
          />
        </div>

        <Surface className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <SectionHeading
              label="Queue"
              title="Today’s appointments"
              description="Jump straight into the room when it is time to start the visit."
            />
            <Link href={`/org/${slug}/appointments`} className={inlineActionClassName}>
              See all appointments
            </Link>
          </div>
          <AppointmentList
            items={todayAppointments.map((appointment) => ({
              id: appointment.id,
              title: `${format(new Date(appointment.scheduled_start), "h:mm a")} – ${format(new Date(appointment.scheduled_end), "h:mm a")}`,
              subtitle: appointment.reason ?? "No reason provided",
              status: appointment.status,
              href: `/org/${slug}/appointments/${appointment.id}/room`,
              actionLabel: "Open room",
            }))}
            emptyText="Your schedule is clear today. New visits will show up here as soon as they are booked."
          />
        </Surface>

        {(pendingNotes?.length ?? 0) > 0 ? (
          <Surface tone="warning" className="space-y-5">
            <SectionHeading
              label="Documentation"
              title="Finish notes"
              description="Sign these notes so they appear in the patient chart."
            />
            <ul className="divide-y divide-[color:rgba(217,119,6,0.16)]">
              {noteRows.map((note) => (
                <li key={note.id} className="flex items-center justify-between gap-4 py-4 text-sm">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{note.patientName}</p>
                    <p className="text-xs text-[color:var(--warning-ink)]">
                      Created {format(new Date(note.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {note.appointmentId ? (
                    <Link
                      href={`/org/${slug}/appointments/${note.appointmentId}/note`}
                      className={inlineActionClassName}
                    >
                      Finish note
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
      </section>
    );
  }

  const patient = await getPatientByProfileId(supabase, profile.id, orgId);
  const allAppointments = patient ? await getPatientAppointments(supabase, patient.id, orgId) : [];
  const upcomingAppointments = allAppointments.filter(
    (appointment) =>
      new Date(appointment.scheduled_start) >= now && appointment.status !== "cancelled",
  );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const pastVisits = allAppointments.filter(
    (appointment) => new Date(appointment.scheduled_start) < now,
  ).length;
  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : "";

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={membership.organization.name}
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        description="Book your next visit, join when it’s time, and keep your intake details current so the care team can prepare."
      />

      {patient && !patient.intake_completed ? (
        <Notice tone="warning" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong>Finish intake.</strong> Your care team needs your current details before the first visit.
          </p>
          <Link href={`/org/${slug}/profile`} className={primaryButtonClassName}>
            Finish intake
          </Link>
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Upcoming visits"
          value={upcomingAppointments.length}
          hint="Appointments you can still join or review."
          href={`/org/${slug}/appointments`}
        />
        <MetricCard
          label="Past visits"
          value={pastVisits}
          hint="Completed visits already on record."
          href={`/org/${slug}/appointments`}
        />
      </div>

      {nextAppointment ? (
        <Surface tone="accent" className="space-y-5">
          <SectionHeading
            label="Next visit"
            title={format(new Date(nextAppointment.scheduled_start), "EEEE, MMMM d")}
            description={`${format(new Date(nextAppointment.scheduled_start), "h:mm a")} – ${format(new Date(nextAppointment.scheduled_end), "h:mm a")} · ${nextAppointment.provider.profile?.full_name ?? "Provider"}`}
          />
          {nextAppointment.reason ? (
            <p className="text-sm leading-6 text-[color:var(--accent-ink)]">
              Reason: {nextAppointment.reason}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {nextAppointment.meeting_url ? (
              <a
                href={nextAppointment.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryButtonClassName}
              >
                Join video visit
              </a>
            ) : null}
            <Link
              href={`/org/${slug}/appointments/${nextAppointment.id}`}
              className={secondaryButtonClassName}
            >
              View appointment
            </Link>
          </div>
        </Surface>
      ) : (
        <Surface className="space-y-4">
          <SectionHeading
            label="Next visit"
            title="Nothing is booked yet."
            description="Book an appointment to choose a time that works for you."
          />
          <Link href={`/org/${slug}/appointments/new`} className={primaryButtonClassName}>
            Book appointment
          </Link>
        </Surface>
      )}

      {patient ? (
        <div className="grid gap-4 md:grid-cols-2">
          <QuickLinkCard
            href={`/org/${slug}/patients/${patient.id}`}
            label="My chart"
            title="Review your health record"
            description="See allergies, medications, and signed notes."
          />
          <QuickLinkCard
            href={`/org/${slug}/appointments/new`}
            label="Appointments"
            title="Schedule an appointment"
            description="Choose an open time with your provider."
          />
        </div>
      ) : null}
    </section>
  );
}

function AppointmentList({
  items,
  emptyText,
}: {
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    status: string;
    href: string;
    actionLabel: string;
  }>;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm leading-6 text-[color:var(--muted)]">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-[color:var(--border)]">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 py-4 text-sm">
          <div>
            <p className="font-semibold text-[color:var(--foreground)]">{item.title}</p>
            <p className="text-xs leading-5 text-[color:var(--muted)]">{item.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={item.status} className="px-2 py-0.5" />
            <Link href={item.href} className={inlineActionClassName}>
              {item.actionLabel}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuickLinkCard({
  href,
  label,
  title,
  description,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="motion-lift block rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_24px_50px_rgba(24,33,43,0.06)] transition hover:bg-[color:var(--surface-subtle)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{description}</p>
    </Link>
  );
}

function extractPatientName(patient: PendingNoteRow["patient"]) {
  if (Array.isArray(patient)) {
    return patient[0]?.full_name ?? "Unknown patient";
  }

  return patient?.full_name ?? "Unknown patient";
}

function extractAppointmentId(encounter: PendingNoteRow["encounter"]) {
  if (Array.isArray(encounter)) {
    return encounter[0]?.appointment_id ?? null;
  }

  return encounter?.appointment_id ?? null;
}
