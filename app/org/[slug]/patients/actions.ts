"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";

async function getAuthorizedMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership || membership.role === "patient") {
    throw new Error("Only clinic staff can update patient records.");
  }
  return { supabase, membership };
}

export async function createPatient(formData: FormData) {
  const { supabase, membership } = await getAuthorizedMembership();

  const full_name = (formData.get("full_name") as string).trim();
  if (!full_name) throw new Error("Enter the patient's full name before saving.");

  const dob = (formData.get("dob") as string) || null;
  const sex = (formData.get("sex") as string) || null;
  const phone = (formData.get("phone") as string).trim() || null;
  const email = (formData.get("email") as string).trim() || null;

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      organization_id: membership.organization_id,
      full_name,
      dob,
      sex,
      phone,
      email,
      status: "active",
      intake_completed: true,
    })
    .select("id")
    .single();

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/patients/${patient.id}`);
}

export async function addAllergy(formData: FormData) {
  const { supabase, membership } = await getAuthorizedMembership();

  const patientId = formData.get("patient_id") as string;
  const substance = (formData.get("substance") as string).trim();
  const reaction = (formData.get("reaction") as string).trim() || null;

  if (!substance) throw new Error("Enter the allergy name before saving.");

  const { error } = await supabase.from("patient_allergies").insert({
    organization_id: membership.organization_id,
    patient_id: patientId,
    substance,
    reaction,
  });

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/patients/${patientId}`);
}

export async function addMedication(formData: FormData) {
  const { supabase, membership } = await getAuthorizedMembership();

  const patientId = formData.get("patient_id") as string;
  const medication_name = (formData.get("medication_name") as string).trim();
  const dosage = (formData.get("dosage") as string).trim() || null;

  if (!medication_name) throw new Error("Enter the medication name before saving.");

  const { error } = await supabase.from("patient_medications").insert({
    organization_id: membership.organization_id,
    patient_id: patientId,
    medication_name,
    dosage,
  });

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/patients/${patientId}`);
}
