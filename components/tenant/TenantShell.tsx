"use client";

import Link from "next/link";
import { useMemo } from "react";

import SignOutButton from "@/components/auth/SignOutButton";
import { TenantProvider } from "@/lib/tenant/context";
import type { MembershipWithOrg, ProfileRow } from "@/lib/supabase/tenant";
import type { Session } from "@supabase/supabase-js";

const navConfig: Record<string, { label: string; href: string }[]> = {
  org_admin: [
    { label: "Dashboard", href: "" },
    { label: "Patients", href: "patients" },
    { label: "Providers", href: "providers" },
    { label: "Appointments", href: "appointments" },
  ],
  provider: [
    { label: "Today", href: "" },
    { label: "Appointments", href: "appointments" },
    { label: "Availability", href: "availability" },
  ],
  patient: [
    { label: "Upcoming visits", href: "" },
    { label: "Appointments", href: "appointments" },
    { label: "My profile", href: "profile" },
  ],
};

const roleLabel: Record<string, string> = {
  org_admin: "Org administrator",
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
  const navItems = useMemo(() => {
    const activeNav = navConfig[membership.role] ?? [];

    return activeNav.map((item) => ({
      label: item.label,
      href: `/org/${membership.organization.slug}${item.href ? `/${item.href}` : ""}`,
    }));
  }, [membership.organization.slug, membership.role]);

  return (
    <TenantProvider value={{ membership, profile, session }}>
      <div className="min-h-screen bg-[color:var(--background)]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
          <aside className="border-r border-[color:var(--border)] bg-white px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {membership.organization.name}
            </p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--accent-strong)]">
              {roleLabel[membership.role] ?? "Member"}
            </p>
            <p className="text-sm text-[color:var(--muted)]">{profile.full_name}</p>
            <nav className="mt-8 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-10 space-y-1 text-xs text-[color:var(--muted)]">
              <p>Organization ID</p>
              <p className="truncate text-[color:var(--foreground)]">{membership.organization.id}</p>
            </div>
            <div className="mt-6">
              <SignOutButton />
            </div>
          </aside>

          <div className="px-6 py-8 lg:px-10">{children}</div>
        </div>
      </div>
    </TenantProvider>
  );
}
