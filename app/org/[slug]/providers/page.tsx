import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getProviders } from "@/lib/db/providers";

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
      <header className="flex items-center justify-between border-b border-[color:var(--border)] pb-6">
        <div>
          <p className="text-sm font-semibold text-[color:var(--muted)]">
            {membership.organization.name}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Providers
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Manage the clinicians patients can book with in this organization.
          </p>
        </div>
        {membership.role === "org_admin" && (
          <Link
            href={`/org/${slug}/providers/new`}
            className="rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
          >
            Add a provider
          </Link>
        )}
      </header>

      {providers.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-12 text-center">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">No providers added yet</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Add a provider before patients can book new visits.
          </p>
          {membership.role === "org_admin" && (
            <Link
              href={`/org/${slug}/providers/new`}
              className="mt-5 inline-block rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Add the first provider
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Timezone
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {providers.map((p) => (
                <tr key={p.id} className="transition hover:bg-[color:var(--surface)]">
                  <td className="px-6 py-4 font-medium text-[color:var(--foreground)]">
                    {p.profile?.full_name ?? p.profile?.email ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-[color:var(--muted)]">
                    {p.specialty ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-[color:var(--muted)]">{p.timezone}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/org/${slug}/providers/${p.id}`}
                      className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                    >
                      Open profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
