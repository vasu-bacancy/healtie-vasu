import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;
  const showBanner = registered === "1";

  return (
    <main className="app-shell min-h-screen">
      <section className="grid-line mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-6 px-6 py-8 sm:px-8 lg:px-12">
        <div className="w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-8 py-10 shadow-[0_25px_70px_rgba(24,33,43,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Sign in</p>
          <h1 className="mt-4 text-3xl font-semibold text-[color:var(--foreground)]">Sign in to your clinic workspace</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Use the demo account below, or sign in with the patient or provider account your clinic created for you.
          </p>
          {showBanner && (
            <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Your account is ready. Sign in with the email and password you just created.
            </div>
          )}
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-[color:var(--muted)]">
            New patient?{" "}
            <Link
              href="/register/northstar-care"
              className="font-semibold text-[color:var(--accent)] hover:underline"
            >
              Create a patient account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
