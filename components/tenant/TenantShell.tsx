"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import SignOutButton from "@/components/auth/SignOutButton";
import { TenantProvider } from "@/lib/tenant/context";
import type { MembershipWithOrg, ProfileRow } from "@/lib/supabase/tenant";
import type { Session } from "@supabase/supabase-js";

const navConfig: Record<string, { label: string; href: string }[]> = {
  org_admin: [
    { label: "Clinic overview", href: "" },
    { label: "Patient records", href: "patients" },
    { label: "Providers", href: "providers" },
    { label: "Appointments", href: "appointments" },
  ],
  provider: [
    { label: "Today's schedule", href: "" },
    { label: "Appointments", href: "appointments" },
    { label: "Availability", href: "availability" },
  ],
  patient: [
    { label: "Home", href: "" },
    { label: "My visits", href: "appointments" },
    { label: "Intake profile", href: "profile" },
  ],
};

const roleLabel: Record<string, string> = {
  org_admin: "Clinic admin",
  provider: "Provider",
  patient: "Patient",
};

export default function TenantShell({
  children,
  membership,
  profile,
  session,
}: {
  children: React.ReactNode;
  membership: MembershipWithOrg;
  profile: ProfileRow;
  session: Session;
}) {
  const pathname = usePathname();
  const activeNav = navConfig[membership.role] ?? [];
  const navItems = activeNav.map((item) => ({
    label: item.label,
    href: `/org/${membership.organization.slug}${item.href ? `/${item.href}` : ""}`,
  }));

  return (
    <TenantProvider value={{ membership, profile, session }}>
      <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[92rem] grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col rounded-[2rem] border border-[color:var(--border)] bg-[color:rgba(255,252,246,0.88)] px-6 py-6 shadow-[0_28px_70px_rgba(24,33,43,0.08)] backdrop-blur-sm">
            <div className="rounded-[1.5rem] border border-[color:var(--accent-soft-strong)] bg-[color:var(--surface-accent)] px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
                {membership.organization.name}
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-none tracking-[-0.04em] text-[color:var(--foreground)]">
                Care workspace
              </h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
                {roleLabel[membership.role] ?? "Member"} access for {profile.full_name}.
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "motion-lift block rounded-[1.25rem] border px-4 py-3 text-sm font-semibold transition",
                    pathname === item.href
                      ? "border-[color:var(--accent-soft-strong)] bg-[color:var(--surface-accent)] text-[color:var(--accent-ink)] shadow-[0_18px_30px_rgba(24,119,110,0.08)]"
                      : "border-transparent bg-transparent text-[color:var(--foreground)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface)]",
                  )}
                >
                  <span className="block">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-[1.4rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Session
              </p>
              <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                {session.user.email}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Org ID: <span className="break-all text-[color:var(--foreground-soft)]">{membership.organization.id}</span>
              </p>
            </div>

            <div className="mt-auto pt-6">
              <SignOutButton />
            </div>
          </aside>

          <main className="rounded-[2rem] border border-[color:var(--border)] bg-[color:rgba(255,252,246,0.82)] px-6 py-7 shadow-[0_28px_70px_rgba(24,33,43,0.07)] backdrop-blur-sm sm:px-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
