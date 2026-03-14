import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import RegisterForm from "@/components/register/RegisterForm";

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
      <main className="app-shell min-h-screen">
        <section className="grid-line mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-6 px-6 py-8 sm:px-8 lg:px-12">
          <div className="w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-8 py-10 shadow-[0_25px_70px_rgba(24,33,43,0.12)] text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:#c13b3b]">
              Invalid link
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-[color:var(--foreground)]">
              Registration link not found
            </h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              This registration link is not valid or the organization is no longer active.
              Please contact your care provider for a valid link.
            </p>
            <Link
              href="/sign-in"
              className="mt-6 inline-block text-sm font-semibold text-[color:var(--accent)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <section className="grid-line mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-6 px-6 py-8 sm:px-8 lg:px-12">
        <div className="w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-8 py-10 shadow-[0_25px_70px_rgba(24,33,43,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">
            Patient registration
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[color:var(--foreground)]">
            Join {org.name}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Create your patient account to book appointments and view your care history.
          </p>
          <div className="mt-6">
            <RegisterForm slug={slug} />
          </div>
          <p className="mt-6 text-center text-sm text-[color:var(--muted)]">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-[color:var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
