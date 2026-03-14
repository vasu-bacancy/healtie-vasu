"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";

export async function createProvider(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership || membership.role !== "org_admin") throw new Error("Unauthorized");

  const full_name = (formData.get("full_name") as string).trim();
  const email = (formData.get("email") as string).trim();
  const password = (formData.get("password") as string);
  const specialty = (formData.get("specialty") as string).trim() || null;
  const license_number = (formData.get("license_number") as string).trim() || null;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const bio = (formData.get("bio") as string).trim() || null;

  if (!full_name || !email || !password) throw new Error("Name, email, and password are required.");

  const admin = createAdminClient();
  const orgId = membership.organization_id;

  // Check for duplicate email
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) throw new Error("An account with this email already exists.");

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError || !authData.user) throw new Error(authError?.message ?? "Failed to create account.");

  const userId = authData.user.id;

  // Insert profile
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    full_name,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Failed to create profile.");
  }

  // Insert membership
  const { error: membershipError } = await admin.from("memberships").insert({
    organization_id: orgId,
    profile_id: userId,
    role: "provider",
    status: "active",
  });
  if (membershipError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Failed to create membership.");
  }

  // Insert provider record
  const { data: provider, error: providerError } = await admin
    .from("providers")
    .insert({ organization_id: orgId, profile_id: userId, specialty, license_number, timezone, bio })
    .select("id")
    .single();
  if (providerError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Failed to create provider record.");
  }

  redirect(`/org/${membership.organization.slug}/providers/${provider.id}`);
}
