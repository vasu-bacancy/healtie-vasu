"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema, type RegisterFormValues } from "@/lib/register/schema";

type RegisterResult = { success: true } | { success: false; error: string };

export async function registerPatient(
  slug: string,
  values: RegisterFormValues,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Please review the highlighted fields and try again." };
  }

  const { full_name, email, password, dob, sex, phone } = parsed.data;
  const admin = createAdminClient();

  // 1. Look up org by slug
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!org) {
    return { success: false, error: "This registration link is no longer valid. Ask your clinic for a new one." };
  }

  // 2. Check for duplicate email
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return {
      success: false,
      error: "An account already exists for this email. Sign in instead, or use a different email address.",
    };
  }

  // 3. Create Supabase auth user (email_confirm: true skips email verification)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError || !authData.user) {
    return { success: false, error: "We couldn't create your account right now. Please try again in a moment." };
  }

  const userId = authData.user.id;

  // Helper to roll back auth user on subsequent failures
  async function rollback(patientId?: string) {
    if (patientId) {
      await admin.from("patients").delete().eq("id", patientId);
    }
    await admin.auth.admin.deleteUser(userId);
  }

  // 4. Insert profile
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    full_name,
    phone: phone || null,
  });

  if (profileError) {
    await rollback();
    return { success: false, error: "We couldn't finish setting up your account. Please try again." };
  }

  // 5. Insert patient record
  const { data: patient, error: patientError } = await admin
    .from("patients")
    .insert({
      organization_id: org.id,
      profile_id: userId,
      full_name,
      dob,
      sex,
      phone: phone || null,
      email,
      status: "active",
      intake_completed: false,
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    await rollback();
    return { success: false, error: "We couldn't finish setting up your patient record. Please try again." };
  }

  // 6. Insert membership
  const { error: membershipError } = await admin.from("memberships").insert({
    organization_id: org.id,
    profile_id: userId,
    role: "patient",
    status: "active",
  });

  if (membershipError) {
    await rollback(patient.id);
    return { success: false, error: "We couldn't finish linking your account to this clinic. Please try again." };
  }

  return { success: true };
}
