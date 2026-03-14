import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import {
  getProviderByProfileId,
  getProviderAvailability,
  DAY_NAMES,
} from "@/lib/db/providers";
import { addAvailability, deleteAvailability } from "./actions";
import {
  EmptyState,
  FormField,
  PageHeader,
  Surface,
  controlClassName,
  primaryButtonClassName,
} from "@/components/ui/app-kit";

export default async function AvailabilityPage({
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

  if (membership.role !== "provider" && membership.role !== "org_admin") {
    redirect(`/org/${slug}`);
  }

  const provider = await getProviderByProfileId(
    supabase,
    profile.id,
    membership.organization_id,
  );

  if (!provider) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Availability"
          description="This account still needs a provider profile before weekly booking windows can be managed."
        />
        <EmptyState
          title="This account is not linked to a provider profile yet."
          description="Ask a clinic admin to finish setup before managing booking windows."
        />
      </section>
    );
  }

  const availability = await getProviderAvailability(
    supabase,
    provider.id,
    membership.organization_id,
  );

  // Group by day for display
  const byDay: Record<number, typeof availability> = {};
  for (const a of availability) {
    if (!byDay[a.day_of_week]) byDay[a.day_of_week] = [];
    byDay[a.day_of_week].push(a);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={membership.organization.name}
        title="My availability"
        description="Set the weekly hours when patients can book time with you."
      />

      <Surface className="space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Weekly schedule
        </p>

        {availability.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No bookable hours yet. Add your first weekly window below.
          </p>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const windows = byDay[day];
              if (!windows?.length) return null;
              return (
                <div key={day} className="flex items-start gap-4">
                  <span className="w-28 shrink-0 text-sm font-semibold text-[color:var(--foreground)]">
                    {DAY_NAMES[day]}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {windows.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-2 rounded-[1rem] border border-[color:var(--border)] bg-[color:var(--surface-subtle)] px-3 py-2 text-sm"
                      >
                        <span className="text-[color:var(--foreground)]">
                          {w.start_time.slice(0, 5)} – {w.end_time.slice(0, 5)}
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          {w.slot_minutes}-minute visits
                        </span>
                        <form action={deleteAvailability}>
                          <input type="hidden" name="id" value={w.id} />
                          <button
                            type="submit"
                            className="text-xs font-semibold text-[color:var(--danger)] transition hover:opacity-80"
                          >
                            Remove window
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>

      <Surface className="space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Add availability window
        </p>
        <form action={addAvailability} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField label="Day">
            <select
              name="day_of_week"
              required
              className={controlClassName()}
            >
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {DAY_NAMES[d]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Start time">
            <input
              name="start_time"
              type="time"
              required
              defaultValue="09:00"
              className={controlClassName()}
            />
          </FormField>

          <FormField label="End time">
            <input
              name="end_time"
              type="time"
              required
              defaultValue="17:00"
              className={controlClassName()}
            />
          </FormField>

          <FormField label="Visit length">
            <select
              name="slot_minutes"
              defaultValue="30"
              className={controlClassName()}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </FormField>

          <div className="col-span-2 sm:col-span-4 flex justify-end">
            <button type="submit" className={primaryButtonClassName}>
              Add booking window
            </button>
          </div>
        </form>
      </Surface>
    </section>
  );
}
