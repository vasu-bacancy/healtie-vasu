import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getProvider, getProviderAvailability, DAY_NAMES } from "@/lib/db/providers";
import { KeyValueRow, PageHeader, Surface } from "@/components/ui/app-kit";

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
      <PageHeader
        backHref={`/org/${slug}/providers`}
        backLabel="Providers"
        title={provider.profile?.full_name ?? provider.profile?.email ?? "—"}
        description={provider.specialty ?? "Provider profile"}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Provider details
          </p>
          <dl>
            <KeyValueRow label="Email address">{provider.profile?.email ?? "—"}</KeyValueRow>
            <KeyValueRow label="Specialty">{provider.specialty ?? "—"}</KeyValueRow>
            <KeyValueRow label="License number">{provider.license_number ?? "—"}</KeyValueRow>
            <KeyValueRow label="Timezone">{provider.timezone}</KeyValueRow>
          </dl>
          {provider.bio && (
            <div className="border-t border-[color:var(--border)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                Bio
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground)]">{provider.bio}</p>
            </div>
          )}
        </Surface>

        <Surface className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Weekly availability
          </p>

          {availability.length === 0 ? (
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              This provider still needs weekly availability before patients can schedule with them.
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
                        <span key={w.id} className="rounded-[0.9rem] bg-[color:var(--surface-subtle)] px-3 py-2 text-[color:var(--muted)]">
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
        </Surface>
      </div>
    </section>
  );
}
