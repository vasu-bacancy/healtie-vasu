import { redirect } from "next/navigation";

import TenantShell from "@/components/tenant/TenantShell";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { createClient as createServerClient } from "@/lib/supabase/server";

type OrgParams = {
  slug: string;
};

type Props = {
  children: React.ReactNode;
  params: OrgParams | Promise<OrgParams>;
};

export default async function OrgLayout({ children, params }: Props) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { slug } = await params;

  if (!session?.user) {
    redirect("/sign-in");
  }
  if (!user) {
    redirect("/sign-in");
  }

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);

  if (!membership) {
    redirect("/sign-in");
  }

  if (membership.organization.slug !== slug) {
    redirect(`/org/${membership.organization.slug}`);
  }

  return (
    <TenantShell membership={membership} profile={profile} session={session}>
      {children}
    </TenantShell>
  );
}
