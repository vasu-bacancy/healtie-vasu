import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getAppointment } from "@/lib/db/appointments";
import { getEncounterByAppointmentId, getClinicalNoteByEncounterId } from "@/lib/db/encounters";
import { saveNote, signNote } from "./actions";

export default async function SoapNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug, id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");
  if (membership.role === "patient") redirect(`/org/${slug}/appointments/${id}`);

  const appt = await getAppointment(supabase, id, membership.organization_id).catch(
    () => null,
  );
  if (!appt) notFound();

  const encounter = await getEncounterByAppointmentId(
    supabase,
    id,
    membership.organization_id,
  );

  if (!encounter) {
    return (
      <section className="space-y-6">
        <header className="border-b border-[color:var(--border)] pb-6">
          <Link
            href={`/org/${slug}/appointments/${id}/room`}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            ← Visit room
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            SOAP note
          </h1>
        </header>
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-10 text-center">
          <p className="text-sm text-[color:var(--muted)]">
            No encounter found. Start the visit first to create a SOAP note.
          </p>
          <Link
            href={`/org/${slug}/appointments/${id}/room`}
            className="mt-4 inline-block text-sm font-semibold text-[color:var(--accent)] hover:underline"
          >
            Go to visit room →
          </Link>
        </div>
      </section>
    );
  }

  const note = await getClinicalNoteByEncounterId(
    supabase,
    encounter.id,
    membership.organization_id,
  );

  const isSigned = !!note?.signed_at;

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between border-b border-[color:var(--border)] pb-6">
        <div className="space-y-1">
          <Link
            href={`/org/${slug}/appointments/${id}/room`}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            ← Visit room
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            SOAP note
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            {appt.patient.full_name} ·{" "}
            {format(new Date(appt.scheduled_start), "MMM d, yyyy")}
          </p>
        </div>
        {isSigned && (
          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Signed {format(new Date(note!.signed_at!), "MMM d, h:mm a")}
          </span>
        )}
      </header>

      {saved === "1" && !isSigned && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Note saved as draft.
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        <form action={saveNote} className="space-y-4">
          <input type="hidden" name="appointment_id" value={id} />
          {note && <input type="hidden" name="note_id" value={note.id} />}

          {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
            <div
              key={field}
              className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-2"
            >
              <label
                htmlFor={field}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-bold text-white">
                  {field[0].toUpperCase()}
                </span>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <textarea
                id={field}
                name={field}
                rows={4}
                disabled={isSigned}
                defaultValue={note?.[field] ?? ""}
                placeholder={PLACEHOLDERS[field]}
                className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] disabled:opacity-60"
              />
            </div>
          ))}

          {!isSigned && (
            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                className="rounded-[1rem] border border-[color:var(--border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
              >
                Save draft
              </button>
            </div>
          )}
        </form>

        {/* Sign form — separate so it doesn't interfere with save */}
        {note && !isSigned && (
          <form action={signNote} className="mt-4">
            <input type="hidden" name="appointment_id" value={id} />
            <input type="hidden" name="note_id" value={note.id} />
            <input type="hidden" name="patient_id" value={appt.patient_id} />
            <button
              type="submit"
              className="w-full rounded-[1rem] bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Sign &amp; file note
            </button>
            <p className="mt-2 text-center text-xs text-[color:var(--muted)]">
              Once signed, the note will appear in the patient&apos;s chart and cannot be edited.
            </p>
          </form>
        )}

        {isSigned && (
          <div className="mt-4 text-center">
            <Link
              href={`/org/${slug}/patients/${appt.patient_id}`}
              className="text-sm font-semibold text-[color:var(--accent)] hover:underline"
            >
              View in patient chart →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

const PLACEHOLDERS: Record<string, string> = {
  subjective: "Patient's chief complaint, history, and symptoms in their own words…",
  objective: "Vital signs, physical exam findings, lab results, observations…",
  assessment: "Diagnosis or differential diagnosis based on subjective and objective data…",
  plan: "Treatment plan, medications, referrals, follow-up instructions…",
};
