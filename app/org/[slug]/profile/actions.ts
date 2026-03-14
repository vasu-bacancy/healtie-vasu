"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatientByProfileId } from "@/lib/db/appointments";

export async function updatePatientProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership || membership.role !== "patient") {
    throw new Error("Only patients can update intake details from this page.");
  }

  const patient = await getPatientByProfileId(supabase, profile.id, membership.organization_id);
  if (!patient) throw new Error("We couldn't find a patient record for this account.");

  const full_name = (formData.get("full_name") as string).trim();
  const dob = (formData.get("dob") as string) || null;
  const sex = (formData.get("sex") as string) || null;
  const phone = (formData.get("phone") as string).trim() || null;
  const email = (formData.get("email") as string).trim() || null;

  if (!full_name) throw new Error("Enter your full name before saving.");

  // Use admin client — RLS restricts patient writes to org_admin/provider only
  const admin = createAdminClient();
  const { error } = await admin
    .from("patients")
    .update({ full_name, dob, sex, phone, email, intake_completed: true })
    .eq("id", patient.id)
    .eq("organization_id", membership.organization_id);

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/profile?saved=1`);
}
