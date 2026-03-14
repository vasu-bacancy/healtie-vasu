import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getProvider, getProviderAvailability, DAY_NAMES } from "@/lib/db/providers";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string; providerId: string }>;
}) {
  const { slug, providerId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership) redirect("/sign-in");

  if (membership.role === "patient") redirect(`/org/${slug}`);

  const [provider, availability] = await Promise.all([
    getProvider(supabase, providerId, membership.organization_id).catch(() => null),
    getProviderAvailability(supabase, providerId, membership.organization_id),
  ]);

  if (!provider) notFound();

  // Group availability by day
  const byDay: Record<number, typeof availability> = {};
  for (const a of availability) {
    if (!byDay[a.day_of_week]) byDay[a.day_of_week] = [];
    byDay[a.day_of_week].push(a);
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-4 border-b border-[color:var(--border)] pb-6">
        <div className="space-y-1">
          <Link
            href={`/org/${slug}/providers`}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            ← Providers
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {provider.profile?.full_name ?? provider.profile?.email ?? "—"}
          </h1>
          {provider.specialty && (
            <p className="text-sm text-[color:var(--muted)]">{provider.specialty}</p>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile details */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Provider details
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Email address">{provider.profile?.email ?? "—"}</Row>
            <Row label="Specialty">{provider.specialty ?? "—"}</Row>
            <Row label="License number">{provider.license_number ?? "—"}</Row>
            <Row label="Timezone">{provider.timezone}</Row>
          </dl>
          {provider.bio && (
            <div className="border-t border-[color:var(--border)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                Bio
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground)]">{provider.bio}</p>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Weekly availability
          </h2>

          {availability.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              No booking windows have been added for this provider yet.
            </p>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const windows = byDay[day];
                if (!windows?.length) return null;
                return (
                  <div key={day} className="flex items-start gap-4 text-sm">
                    <span className="w-24 shrink-0 font-semibold text-[color:var(--foreground)]">
                      {DAY_NAMES[day]}
                    </span>
                    <div className="flex flex-col gap-1">
                      {windows.map((w) => (
                        <span key={w.id} className="text-[color:var(--muted)]">
                          {w.start_time.slice(0, 5)} – {w.end_time.slice(0, 5)}{" "}
                          <span className="text-xs">({w.slot_minutes}-minute visits)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-[color:var(--muted)]">{label}</dt>
      <dd className="font-medium text-[color:var(--foreground)]">{children}</dd>
    </div>
  );
}
