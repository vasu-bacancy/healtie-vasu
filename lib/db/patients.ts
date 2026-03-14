import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
export type PatientAllergyRow = Database["public"]["Tables"]["patient_allergies"]["Row"];
export type PatientMedicationRow = Database["public"]["Tables"]["patient_medications"]["Row"];
export type ClinicalNoteRow = Database["public"]["Tables"]["clinical_notes"]["Row"];

export async function getPatients(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, dob, sex, phone, email, status, intake_completed, created_at")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPatient(
  supabase: SupabaseClient<Database>,
  patientId: string,
  organizationId: string,
): Promise<PatientRow> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("organization_id", organizationId)
    .single();

  if (error) throw error;
  return data as PatientRow;
}

export async function getPatientAllergies(
  supabase: SupabaseClient<Database>,
  patientId: string,
  organizationId: string,
): Promise<PatientAllergyRow[]> {
  const { data, error } = await supabase
    .from("patient_allergies")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PatientAllergyRow[];
}

export async function getPatientMedications(
  supabase: SupabaseClient<Database>,
  patientId: string,
  organizationId: string,
): Promise<PatientMedicationRow[]> {
  const { data, error } = await supabase
    .from("patient_medications")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PatientMedicationRow[];
}

export async function getPatientClinicalNotes(
  supabase: SupabaseClient<Database>,
  patientId: string,
  organizationId: string,
): Promise<ClinicalNoteRow[]> {
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClinicalNoteRow[];
}
