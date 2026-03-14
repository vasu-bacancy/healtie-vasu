import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import RegisterForm from "@/components/register/RegisterForm";
import {
  EmptyState,
  inlineActionClassName,
} from "@/components/ui/app-kit";
import { PublicShell } from "@/components/ui/public-shell";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!org) {
    return (
      <PublicShell
        eyebrow="Patient registration"
        title="This invite link is no longer active."
        description="Ask the clinic team for a current invite link, or return to sign in if you already have an account."
      >
        <EmptyState
          title="We couldn’t open this registration link."
          description="This registration link is missing or no longer active. Contact your clinic for a fresh invite."
          action={
            <Link href="/sign-in" className={inlineActionClassName}>
              Back to sign in
            </Link>
          }
          className="min-h-[24rem]"
        />
      </PublicShell>
    );
  }

  return (
    <PublicShell
      eyebrow="Patient registration"
      title={`Create your account for ${org.name}.`}
      description="Once you’re signed up, you can book visits, join virtual appointments, and review your care history."
      aside={
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
            What happens next
          </p>
          <p className="text-sm leading-6 text-[color:var(--accent-ink)]">
            Finish registration once, then return any time to book care, join the visit room, and keep your intake details current.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">
            Account details
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-[-0.04em] text-[color:var(--foreground)]">
            Build your patient profile.
          </h2>
        </div>
        <RegisterForm slug={slug} />
        <p className="text-center text-sm text-[color:var(--muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className={inlineActionClassName}>
            Sign in
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
