import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";
import { Notice, inlineActionClassName } from "@/components/ui/app-kit";
import { PublicShell } from "@/components/ui/public-shell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;
  const showBanner = registered === "1";

  return (
    <PublicShell
      eyebrow="Healtie access"
      title="Sign in to your clinic workspace."
      description="Use the demo account below, or sign in with the patient or provider account your clinic created for you."
      aside={
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
            Demo account
          </p>
          <p className="text-sm leading-6 text-[color:var(--accent-ink)]">
            `admin@northstar.test` and `Demo1234!` open the seeded organization so you can walk admin, provider, and patient flows without database setup.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">
            Sign in
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-[-0.04em] text-[color:var(--foreground)]">
            Pick up where the visit left off.
          </h2>
        </div>
          {showBanner && (
            <Notice tone="success">
              Your account is ready. Sign in with the email and password you just created.
            </Notice>
          )}
        <LoginForm />
        <p className="text-center text-sm text-[color:var(--muted)]">
            New patient?{" "}
            <Link
              href="/register/northstar-care"
              className={inlineActionClassName}
            >
              Create a patient account
            </Link>
          </p>
      </div>
    </PublicShell>
  );
}
