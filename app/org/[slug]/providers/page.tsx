import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getProviders } from "@/lib/db/providers";
import {
  EmptyState,
  PageHeader,
  TableWrap,
  primaryButtonClassName,
  inlineActionClassName,
} from "@/components/ui/app-kit";

export default async function ProvidersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  if (membership.role === "patient") redirect(`/org/${slug}`);

  const providers = await getProviders(supabase, membership.organization_id);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={membership.organization.name}
        title="Providers"
        description="Manage the clinicians patients can book with in this organization."
        action={
          membership.role === "org_admin" ? (
            <Link href={`/org/${slug}/providers/new`} className={primaryButtonClassName}>
              Add a provider
            </Link>
          ) : null
        }
      />

      {providers.length === 0 ? (
        <EmptyState
          title="No providers are bookable yet."
          description="Add a provider before patients can schedule new visits."
          action={
            membership.role === "org_admin" ? (
              <Link href={`/org/${slug}/providers/new`} className={primaryButtonClassName}>
                Add the first provider
              </Link>
            ) : null
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--surface-subtle)]">
              <tr className="border-b border-[color:var(--border)]">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Specialty
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Timezone
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {providers.map((p) => (
                <tr key={p.id} className="motion-lift transition hover:bg-[color:var(--surface-subtle)]">
                  <td className="px-6 py-5 font-medium text-[color:var(--foreground)]">
                    {p.profile?.full_name ?? p.profile?.email ?? "—"}
                  </td>
                  <td className="px-6 py-5 text-[color:var(--muted)]">
                    {p.specialty ?? "—"}
                  </td>
                  <td className="px-6 py-5 text-[color:var(--muted)]">{p.timezone}</td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/org/${slug}/providers/${p.id}`} className={inlineActionClassName}>
                      Open profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </section>
  );
}
