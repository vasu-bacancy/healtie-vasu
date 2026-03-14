"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getProviderByProfileId } from "@/lib/db/providers";
import { getEncounterByAppointmentId } from "@/lib/db/encounters";

async function getNoteContext(appointmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");
  if (membership.role === "patient") {
    throw new Error("Patients can't create or sign visit notes.");
  }

  const provider = await getProviderByProfileId(
    supabase,
    profile.id,
    membership.organization_id,
  );
  if (!provider) throw new Error("This account is not linked to a provider profile.");

  const encounter = await getEncounterByAppointmentId(
    supabase,
    appointmentId,
    membership.organization_id,
  );
  if (!encounter) throw new Error("Start the visit before you create or sign the SOAP note.");

  return { supabase, membership, profile, provider, encounter };
}

export async function saveNote(formData: FormData) {
  const appointmentId = formData.get("appointment_id") as string;
  const { supabase, membership, provider, encounter } = await getNoteContext(appointmentId);

  const noteId = formData.get("note_id") as string | null;
  const fields = {
    organization_id: membership.organization_id,
    encounter_id: encounter.id,
    patient_id: encounter.patient_id,
    provider_id: provider.id,
    note_type: "soap",
    subjective: (formData.get("subjective") as string) || null,
    objective: (formData.get("objective") as string) || null,
    assessment: (formData.get("assessment") as string) || null,
    plan: (formData.get("plan") as string) || null,
  };

  if (noteId) {
    const { error } = await supabase
      .from("clinical_notes")
      .update(fields)
      .eq("id", noteId)
      .eq("organization_id", membership.organization_id);
    if (error) throw error;
  } else {
    const { data: note, error } = await supabase
      .from("clinical_notes")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert({
      organization_id: membership.organization_id,
      actor_profile_id: provider.profile_id,
      entity_type: "clinical_note",
      entity_id: note.id,
      action: "created",
    });
  }

  redirect(
    `/org/${membership.organization.slug}/appointments/${appointmentId}/note?saved=1`,
  );
}

export async function signNote(formData: FormData) {
  const appointmentId = formData.get("appointment_id") as string;
  const noteId = formData.get("note_id") as string;
  const { supabase, membership, provider } = await getNoteContext(appointmentId);

  const { error } = await supabase
    .from("clinical_notes")
    .update({ signed_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("organization_id", membership.organization_id);

  if (error) throw error;

  // Audit log
  await supabase.from("audit_logs").insert({
    organization_id: membership.organization_id,
    actor_profile_id: provider.profile_id,
    entity_type: "clinical_note",
    entity_id: noteId,
    action: "signed",
  });

  redirect(`/org/${membership.organization.slug}/patients/${formData.get("patient_id")}`);
}
