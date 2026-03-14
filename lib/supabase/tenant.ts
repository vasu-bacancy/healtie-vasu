import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const PROFILE_SELECT = "id, full_name, email, phone, avatar_url, created_at";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];
export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export type MembershipWithOrg = MembershipRow & {
  organization: OrganizationRow;
};

export async function ensureProfileForUser(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null },
): Promise<ProfileRow> {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  const nameFromMetadata =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  const defaultName = user.email ?? "guest";
  const fullName = (typeof nameFromMetadata === "string" ? nameFromMetadata : null) ?? defaultName;

  if (existingProfile) {
    return existingProfile;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: fullName,
      },
      { onConflict: "id" },
    )
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!profile) {
    throw new Error("Unable to bootstrap profile");
  }

  return profile;
}

export async function getActiveMembershipWithOrg(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<MembershipWithOrg | null> {
  if (!profileId) {
    return null;
  }

  const { data, error } = await supabase
    .from("memberships")
    .select(
      `
        id,
        role,
        status,
        organization_id,
        created_at,
        organization:organizations (id, name, slug, status)
      `,
    )
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  return (data?.[0] as MembershipWithOrg | undefined) ?? null;
}
