import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { createProvider } from "../actions";
import {
  FormField,
  PageHeader,
  Surface,
  controlClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/app-kit";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default async function NewProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await ensureProfileForUser(supabase, user);
  const membership = await getActiveMembershipWithOrg(supabase, profile.id);
  if (!membership || membership.role !== "org_admin") redirect(`/org/${slug}/providers`);

  return (
    <section className="space-y-6">
      <PageHeader
        backHref={`/org/${slug}/providers`}
        backLabel="Providers"
        title="Create provider account"
        description="Invite a provider so they can sign in, set availability, and document visits."
      />

      <div className="mx-auto max-w-xl">
        <form action={createProvider} className="space-y-4">
          <Surface className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Account
            </p>

            <FormField label="Full name" required>
              <input name="full_name" type="text" required placeholder="Dr. Jane Smith" className={controlClassName()} />
            </FormField>

            <FormField label="Email address" required>
              <input name="email" type="email" required placeholder="jane@clinic.com" className={controlClassName()} />
            </FormField>

            <FormField label="Temporary password" required hint="Provider can change this after first sign-in.">
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className={controlClassName()}
              />
            </FormField>
          </Surface>

          <Surface className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Professional details
            </p>

            <FormField label="Specialty">
              <input name="specialty" type="text" placeholder="e.g. Primary Care" className={controlClassName()} />
            </FormField>

            <FormField label="License number">
              <input name="license_number" type="text" placeholder="e.g. MD-123456" className={controlClassName()} />
            </FormField>

            <FormField label="Timezone" required>
              <select name="timezone" defaultValue="UTC" className={controlClassName()}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Bio">
              <textarea name="bio" rows={3} placeholder="Brief professional bio…" className={`${controlClassName()} resize-none`} />
            </FormField>
          </Surface>

          <div className="flex gap-3 justify-end">
            <Link href={`/org/${slug}/providers`} className={secondaryButtonClassName}>
              Cancel
            </Link>
            <button type="submit" className={primaryButtonClassName}>
              Create provider account
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
