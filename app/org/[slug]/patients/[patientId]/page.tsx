import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import {
  getPatient,
  getPatientAllergies,
  getPatientMedications,
  getPatientClinicalNotes,
} from "@/lib/db/patients";
import { addAllergy, addMedication } from "../actions";

export default async function PatientChartPage({
  params,
}: {
  params: Promise<{ slug: string; patientId: string }>;
}) {
  const { slug, patientId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  const [patient, allergies, medications, notes] = await Promise.all([
    getPatient(supabase, patientId, membership.organization_id).catch(() => null),
    getPatientAllergies(supabase, patientId, membership.organization_id),
    getPatientMedications(supabase, patientId, membership.organization_id),
    getPatientClinicalNotes(supabase, patientId, membership.organization_id),
  ]);

  if (!patient) notFound();

  const canManage = membership.role === "org_admin" || membership.role === "provider";

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between border-b border-[color:var(--border)] pb-6">
        <div className="space-y-1">
          <Link
            href={`/org/${slug}/patients`}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            ← Patients
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {patient.full_name}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                patient.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {patient.status}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                patient.intake_completed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Intake {patient.intake_completed ? "complete" : "pending"}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demographics */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Demographics
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Date of birth">
              {patient.dob
                ? format(new Date(patient.dob + "T00:00:00"), "MMMM d, yyyy")
                : "—"}
            </Row>
            <Row label="Sex">{patient.sex ?? "—"}</Row>
            <Row label="Email">{patient.email ?? "—"}</Row>
            <Row label="Phone">{patient.phone ?? "—"}</Row>
            <Row label="Registered">
              {format(new Date(patient.created_at), "MMM d, yyyy")}
            </Row>
          </dl>
        </div>

        {/* Allergies */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Allergies
          </h2>

          {allergies.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No allergies on record.</p>
          ) : (
            <ul className="space-y-2">
              {allergies.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between rounded-xl border border-[color:var(--border)] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{a.substance}</p>
                    {a.reaction && (
                      <p className="text-[color:var(--muted)]">Reaction: {a.reaction}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canManage && (
            <form action={addAllergy} className="space-y-2 pt-2 border-t border-[color:var(--border)]">
              <input type="hidden" name="patient_id" value={patientId} />
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                Add allergy
              </p>
              <input
                name="substance"
                type="text"
                required
                placeholder="Substance (e.g. Penicillin)"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
              <input
                name="reaction"
                type="text"
                placeholder="Reaction (optional)"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
              <button
                type="submit"
                className="rounded-[0.75rem] bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
              >
                Add
              </button>
            </form>
          )}
        </div>

        {/* Medications */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Medications
          </h2>

          {medications.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No medications on record.</p>
          ) : (
            <ul className="space-y-2">
              {medications.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between rounded-xl border border-[color:var(--border)] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {m.medication_name}
                    </p>
                    {m.dosage && (
                      <p className="text-[color:var(--muted)]">{m.dosage}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canManage && (
            <form action={addMedication} className="space-y-2 pt-2 border-t border-[color:var(--border)]">
              <input type="hidden" name="patient_id" value={patientId} />
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                Add medication
              </p>
              <input
                name="medication_name"
                type="text"
                required
                placeholder="Medication name"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
              <input
                name="dosage"
                type="text"
                placeholder="Dosage (optional, e.g. 10mg daily)"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              />
              <button
                type="submit"
                className="rounded-[0.75rem] bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
              >
                Add
              </button>
            </form>
          )}
        </div>

        {/* Clinical Notes */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Clinical notes
          </h2>

          {notes.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-[color:var(--border)] px-4 py-3 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                      {note.note_type.toUpperCase()} note
                    </p>
                    <div className="flex items-center gap-2">
                      {note.signed_at && (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Signed
                        </span>
                      )}
                      <p className="text-xs text-[color:var(--muted)]">
                        {format(new Date(note.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  {note.subjective && (
                    <div>
                      <p className="text-xs font-semibold text-[color:var(--muted)]">S</p>
                      <p className="text-[color:var(--foreground)]">{note.subjective}</p>
                    </div>
                  )}
                  {note.objective && (
                    <div>
                      <p className="text-xs font-semibold text-[color:var(--muted)]">O</p>
                      <p className="text-[color:var(--foreground)]">{note.objective}</p>
                    </div>
                  )}
                  {note.assessment && (
                    <div>
                      <p className="text-xs font-semibold text-[color:var(--muted)]">A</p>
                      <p className="text-[color:var(--foreground)]">{note.assessment}</p>
                    </div>
                  )}
                  {note.plan && (
                    <div>
                      <p className="text-xs font-semibold text-[color:var(--muted)]">P</p>
                      <p className="text-[color:var(--foreground)]">{note.plan}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-32 shrink-0 text-[color:var(--muted)]">{label}</dt>
      <dd className="font-medium text-[color:var(--foreground)]">{children}</dd>
    </div>
  );
}
