import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
export type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

export type AppointmentWithDetails = AppointmentRow & {
  patient: { id: string; full_name: string };
  provider: { id: string; profile: { full_name: string | null } };
};

const APPOINTMENT_SELECT = `
  *,
  patient:patients(id, full_name),
  provider:providers(id, profile:profiles(full_name))
`;

export async function getAppointments(
  _supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<AppointmentWithDetails[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("organization_id", organizationId)
    .order("scheduled_start", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AppointmentWithDetails[];
}

export async function getPatientAppointments(
  _supabase: SupabaseClient<Database>,
  patientId: string,
  organizationId: string,
): Promise<AppointmentWithDetails[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("patient_id", patientId)
    .eq("organization_id", organizationId)
    .order("scheduled_start", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AppointmentWithDetails[];
}

export async function getAppointment(
  _supabase: SupabaseClient<Database>,
  id: string,
  organizationId: string,
): Promise<AppointmentWithDetails> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error) throw error;
  return data as AppointmentWithDetails;
}

export async function getPatientByProfileId(
  supabase: SupabaseClient<Database>,
  profileId: string,
  organizationId: string,
): Promise<PatientRow | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("profile_id", profileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  checked_in: "bg-amber-50 text-amber-700",
  in_progress: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};
