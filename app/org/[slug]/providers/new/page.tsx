import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { createProvider } from "../actions";

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
      <header className="flex items-center gap-4 border-b border-[color:var(--border)] pb-6">
        <Link
          href={`/org/${slug}/providers`}
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          ← Providers
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Create provider account
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          Invite a provider so they can sign in, set availability, and document visits.
        </p>
      </header>

      <div className="mx-auto max-w-xl">
        <form action={createProvider} className="space-y-4">

          {/* Account */}
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Account
            </h2>

            <Field label="Full name" required>
              <input name="full_name" type="text" required placeholder="Dr. Jane Smith"
                className={inputCls} />
            </Field>

            <Field label="Email address" required>
              <input name="email" type="email" required placeholder="jane@clinic.com"
                className={inputCls} />
            </Field>

            <Field label="Temporary password" required hint="Provider can change this after first sign-in.">
              <input name="password" type="password" required minLength={8} placeholder="Min. 8 characters"
                className={inputCls} />
            </Field>
          </div>

          {/* Professional */}
          <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Professional details
            </h2>

            <Field label="Specialty">
              <input name="specialty" type="text" placeholder="e.g. Primary Care"
                className={inputCls} />
            </Field>

            <Field label="License number">
              <input name="license_number" type="text" placeholder="e.g. MD-123456"
                className={inputCls} />
            </Field>

            <Field label="Timezone" required>
              <select name="timezone" defaultValue="UTC" className={inputCls}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </Field>

            <Field label="Bio">
              <textarea name="bio" rows={3} placeholder="Brief professional bio…"
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="flex gap-3 justify-end">
            <Link
              href={`/org/${slug}/providers`}
              className="rounded-[1rem] border border-[color:var(--border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Create provider account
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[color:var(--foreground)]">
        {label}{required && <span className="ml-0.5 text-[color:#c13b3b]"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[color:var(--muted)]">{hint}</p>}
    </div>
  );
}
