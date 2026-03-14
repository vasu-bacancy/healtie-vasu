import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getAppointment } from "@/lib/db/appointments";
import {
  getEncounterByAppointmentId,
  getClinicalNoteByEncounterId,
} from "@/lib/db/encounters";
import { saveNote, signNote } from "./actions";
import {
  DataPill,
  EmptyState,
  Notice,
  PageHeader,
  Surface,
  controlClassName,
  inlineActionClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

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

  const appointment = await getAppointment(supabase, id, membership.organization_id).catch(
    () => null,
  );
  if (!appointment) notFound();

  const encounter = await getEncounterByAppointmentId(
    supabase,
    id,
    membership.organization_id,
  );

  if (!encounter) {
    return (
      <section className="space-y-6">
        <PageHeader
          backHref={`/org/${slug}/appointments/${id}/room`}
          backLabel="Visit room"
          title="SOAP note"
          description="Start the visit from the room before creating the note."
        />
        <EmptyState
          title="The note unlocks when the visit starts."
          description="Open the visit room and start the encounter before documenting the SOAP note."
          action={
            <Link href={`/org/${slug}/appointments/${id}/room`} className={inlineActionClassName}>
              Go to visit room
            </Link>
          }
        />
      </section>
    );
  }

  const note = await getClinicalNoteByEncounterId(
    supabase,
    encounter.id,
    membership.organization_id,
  );
  const isSigned = Boolean(note?.signed_at);

  return (
    <section className="space-y-6">
      <PageHeader
        backHref={`/org/${slug}/appointments/${id}/room`}
        backLabel="Visit room"
        title="SOAP note"
        description={`${appointment.patient.full_name} · ${format(new Date(appointment.scheduled_start), "MMM d, yyyy")}`}
        meta={
          isSigned ? (
            <DataPill tone="success">
              Signed {format(new Date(note!.signed_at!), "MMM d, h:mm a")}
            </DataPill>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Save a draft while the visit is in progress, then sign the note when it is final.
            </p>
          )
        }
      />

      {saved === "1" && !isSigned ? (
        <Notice tone="success">
          Draft saved. Review it, then sign when you’re ready to file it.
        </Notice>
      ) : null}

      <div className="mx-auto max-w-3xl">
        <form action={saveNote} className="space-y-4">
          <input type="hidden" name="appointment_id" value={id} />
          {note ? <input type="hidden" name="note_id" value={note.id} /> : null}

          {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
            <Surface key={field} className="space-y-3">
              <label
                htmlFor={field}
                className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-[color:var(--surface)]">
                  {field[0].toUpperCase()}
                </span>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <p className="text-sm leading-6 text-[color:var(--muted)]">{FIELD_GUIDANCE[field]}</p>
              <textarea
                id={field}
                name={field}
                rows={5}
                disabled={isSigned}
                defaultValue={note?.[field] ?? ""}
                placeholder={PLACEHOLDERS[field]}
                className={`${controlClassName()} min-h-[11rem] resize-y disabled:opacity-60`}
              />
            </Surface>
          ))}

          {!isSigned ? (
            <div className="flex justify-end">
              <button type="submit" className={secondaryButtonClassName}>
                Save draft note
              </button>
            </div>
          ) : null}
        </form>

        {note && !isSigned ? (
          <form action={signNote} className="mt-4 space-y-3">
            <input type="hidden" name="appointment_id" value={id} />
            <input type="hidden" name="note_id" value={note.id} />
            <input type="hidden" name="patient_id" value={appointment.patient_id} />
            <button type="submit" className={`${primaryButtonClassName} w-full justify-center py-3`}>
              Sign and file note
            </button>
            <p className="text-center text-xs leading-5 text-[color:var(--muted)]">
              Once signed, the note appears in the patient chart and can no longer be edited.
            </p>
          </form>
        ) : null}

        {isSigned ? (
          <div className="mt-5 text-center">
            <Link href={`/org/${slug}/patients/${appointment.patient_id}`} className={inlineActionClassName}>
              Open patient chart
            </Link>
          </div>
        ) : null}
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

const FIELD_GUIDANCE: Record<string, string> = {
  subjective: "What the patient reports and why they came in today.",
  objective: "What you observed, measured, or confirmed during the visit.",
  assessment: "Your clinical impression based on the information gathered.",
  plan: "What happens next, including treatment, follow-up, and referrals.",
};
