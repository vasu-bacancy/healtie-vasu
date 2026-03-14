"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatientByProfileId } from "@/lib/db/appointments";

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  return { supabase, membership, profile };
}

export async function bookAppointment(formData: FormData) {
  const { supabase, membership, profile } = await getAuthContext();

  const provider_id = formData.get("provider_id") as string;
  const scheduled_start = formData.get("scheduled_start") as string;
  const scheduled_end = formData.get("scheduled_end") as string;
  const reason = (formData.get("reason") as string).trim() || null;
  const visit_type = (formData.get("visit_type") as string) || "virtual";

  // Resolve patient_id — patients book for themselves, admins/providers supply it
  let patient_id = formData.get("patient_id") as string | null;
  if (membership.role === "patient") {
    const patient = await getPatientByProfileId(
      supabase,
      profile.id,
      membership.organization_id,
    );
    if (!patient) throw new Error("No patient record found for your account.");
    patient_id = patient.id;
  }

  if (!patient_id || !provider_id || !scheduled_start || !scheduled_end) {
    throw new Error("Missing required booking fields.");
  }

  const { data: appt, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: membership.organization_id,
      patient_id,
      provider_id,
      scheduled_start,
      scheduled_end,
      status: "scheduled",
      visit_type: visit_type as "virtual" | "in_person",
      reason,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/appointments/${appt.id}`);
}

export async function updateAppointmentStatus(formData: FormData) {
  const { supabase, membership, profile } = await getAuthContext();

  if (membership.role === "patient") throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const status = formData.get("status") as AppointmentStatus;
  const orgId = membership.organization_id;

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw error;

  // Create encounter when visit starts
  if (status === "in_progress") {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, provider_id")
      .eq("id", id)
      .single();

    if (appt) {
      await supabase.from("encounters").upsert(
        {
          organization_id: orgId,
          appointment_id: id,
          patient_id: appt.patient_id,
          provider_id: appt.provider_id,
          status: "in_progress",
          started_at: new Date().toISOString(),
        },
        { onConflict: "appointment_id" },
      );
    }
  }

  // Close encounter when visit completes
  if (status === "completed") {
    await supabase
      .from("encounters")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("appointment_id", id)
      .eq("organization_id", orgId);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    organization_id: orgId,
    actor_profile_id: profile.id,
    entity_type: "appointment",
    entity_id: id,
    action: `status_changed_to_${status}`,
  });

  redirect(`/org/${membership.organization.slug}/appointments/${id}/room`);
}

export async function updateMeetingUrl(formData: FormData) {
  const { supabase, membership } = await getAuthContext();

  if (membership.role === "patient") throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const meeting_url = (formData.get("meeting_url") as string).trim() || null;

  const { error } = await supabase
    .from("appointments")
    .update({ meeting_url })
    .eq("id", id)
    .eq("organization_id", membership.organization_id);

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/appointments/${id}`);
}

type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled";
