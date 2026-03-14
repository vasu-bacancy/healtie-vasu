import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type EncounterRow = Database["public"]["Tables"]["encounters"]["Row"];
export type ClinicalNoteRow = Database["public"]["Tables"]["clinical_notes"]["Row"];

export async function getEncounterByAppointmentId(
  supabase: SupabaseClient<Database>,
  appointmentId: string,
  organizationId: string,
): Promise<EncounterRow | null> {
  const { data, error } = await supabase
    .from("encounters")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as EncounterRow | null;
}

export async function getClinicalNoteByEncounterId(
  supabase: SupabaseClient<Database>,
  encounterId: string,
  organizationId: string,
): Promise<ClinicalNoteRow | null> {
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("encounter_id", encounterId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as ClinicalNoteRow | null;
}
