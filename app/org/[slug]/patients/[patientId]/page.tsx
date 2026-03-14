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
import {
  DataPill,
  FormField,
  KeyValueRow,
  PageHeader,
  Surface,
  controlClassName,
  primaryButtonClassName,
} from "@/components/ui/app-kit";

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
      <PageHeader
        backHref={`/org/${slug}/patients`}
        backLabel="Patients"
        title={patient.full_name}
        description="Review demographics, allergies, medications, and signed notes without leaving the chart."
        meta={
          <div className="flex items-center gap-2">
            <DataPill tone={patient.status === "active" ? "success" : "neutral"}>
              {patient.status === "active" ? "Active" : patient.status}
            </DataPill>
            <DataPill tone={patient.intake_completed ? "success" : "warning"}>
              {patient.intake_completed ? "Intake complete" : "Needs intake"}
            </DataPill>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Demographics
          </p>
          <dl>
            <KeyValueRow label="Date of birth">
              {patient.dob ? format(new Date(`${patient.dob}T00:00:00`), "MMMM d, yyyy") : "—"}
            </KeyValueRow>
            <KeyValueRow label="Sex">{patient.sex ?? "—"}</KeyValueRow>
            <KeyValueRow label="Email">{patient.email ?? "—"}</KeyValueRow>
            <KeyValueRow label="Phone">{patient.phone ?? "—"}</KeyValueRow>
            <KeyValueRow label="Registered">
              {format(new Date(patient.created_at), "MMM d, yyyy")}
            </KeyValueRow>
          </dl>
        </Surface>

        <ChartListSection
          title="Allergies"
          emptyText="No allergies have been recorded for this patient yet."
          items={allergies.map((allergy) => ({
            id: allergy.id,
            title: allergy.substance,
            subtitle: allergy.reaction ? `Reaction: ${allergy.reaction}` : null,
          }))}
        >
          {canManage ? (
            <form action={addAllergy} className="space-y-3 border-t border-[color:var(--border)] pt-4">
              <input type="hidden" name="patient_id" value={patientId} />
              <FormField label="Substance" required>
                <input
                  name="substance"
                  type="text"
                  required
                  placeholder="Substance (e.g. Penicillin)"
                  className={controlClassName()}
                />
              </FormField>
              <FormField label="Reaction" hint="Optional. Add a short reaction note.">
                <input
                  name="reaction"
                  type="text"
                  placeholder="Reaction (optional)"
                  className={controlClassName()}
                />
              </FormField>
              <button type="submit" className={primaryButtonClassName}>
                Add allergy
              </button>
            </form>
          ) : null}
        </ChartListSection>

        <ChartListSection
          title="Medications"
          emptyText="No medications have been recorded for this patient yet."
          items={medications.map((medication) => ({
            id: medication.id,
            title: medication.medication_name,
            subtitle: medication.dosage ?? null,
          }))}
        >
          {canManage ? (
            <form action={addMedication} className="space-y-3 border-t border-[color:var(--border)] pt-4">
              <input type="hidden" name="patient_id" value={patientId} />
              <FormField label="Medication name" required>
                <input
                  name="medication_name"
                  type="text"
                  required
                  placeholder="Medication name"
                  className={controlClassName()}
                />
              </FormField>
              <FormField label="Dosage" hint="Optional. Example: 10mg daily.">
                <input
                  name="dosage"
                  type="text"
                  placeholder="Dosage (optional, e.g. 10mg daily)"
                  className={controlClassName()}
                />
              </FormField>
              <button type="submit" className={primaryButtonClassName}>
                Add medication
              </button>
            </form>
          ) : null}
        </ChartListSection>

        <Surface className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Clinical notes
          </p>
          {notes.length === 0 ? (
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              No signed visit notes are in this chart yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="space-y-3 rounded-[1rem] border border-[color:var(--border)] bg-[color:var(--surface-subtle)] px-4 py-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                      {note.note_type.toUpperCase()} note
                    </p>
                    <div className="flex items-center gap-2">
                      {note.signed_at ? <DataPill tone="success">Signed</DataPill> : null}
                      <p className="text-xs text-[color:var(--muted)]">
                        {format(new Date(note.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <SoapBlock label="S" value={note.subjective} />
                  <SoapBlock label="O" value={note.objective} />
                  <SoapBlock label="A" value={note.assessment} />
                  <SoapBlock label="P" value={note.plan} />
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </section>
  );
}

function ChartListSection({
  title,
  emptyText,
  items,
  children,
}: {
  title: string;
  emptyText: string;
  items: Array<{ id: string; title: string; subtitle: string | null }>;
  children?: React.ReactNode;
}) {
  return (
    <Surface className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm leading-6 text-[color:var(--muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-[1rem] border border-[color:var(--border)] bg-[color:var(--surface-subtle)] px-4 py-3 text-sm"
            >
              <p className="font-semibold text-[color:var(--foreground)]">{item.title}</p>
              {item.subtitle ? (
                <p className="text-[color:var(--muted)]">{item.subtitle}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {children}
    </Surface>
  );
}

function SoapBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-semibold text-[color:var(--muted)]">{label}</p>
      <p className="leading-6 text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
