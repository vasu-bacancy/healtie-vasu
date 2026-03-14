"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getProviderByProfileId } from "@/lib/db/providers";

async function getProviderContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  if (membership.role !== "provider" && membership.role !== "org_admin") {
    throw new Error("Unauthorized");
  }

  const provider = await getProviderByProfileId(
    supabase,
    profile.id,
    membership.organization_id,
  );
  if (!provider) throw new Error("Provider record not found for this user.");

  return { supabase, membership, provider };
}

export async function addAvailability(formData: FormData) {
  const { supabase, membership, provider } = await getProviderContext();

  const day_of_week = Number(formData.get("day_of_week"));
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const slot_minutes = Number(formData.get("slot_minutes") ?? 30);

  if (!start_time || !end_time || isNaN(day_of_week)) {
    throw new Error("All fields are required.");
  }
  if (start_time >= end_time) {
    throw new Error("End time must be after start time.");
  }

  const { error } = await supabase.from("provider_availability").insert({
    organization_id: membership.organization_id,
    provider_id: provider.id,
    day_of_week,
    start_time,
    end_time,
    slot_minutes,
  });

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/availability`);
}

export async function deleteAvailability(formData: FormData) {
  const { supabase, membership } = await getProviderContext();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing availability ID.");

  const { error } = await supabase
    .from("provider_availability")
    .delete()
    .eq("id", id)
    .eq("organization_id", membership.organization_id);

  if (error) throw error;

  redirect(`/org/${membership.organization.slug}/availability`);
}
