"use client";

import type { ReactNode } from "react";

import { useTenantContext } from "@/lib/tenant/context";

function RoleStat({
  title,
  value,
}: {
  title: string;
  value: ReactNode;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[color:var(--border)] bg-white px-6 py-5 shadow-[0_12px_40px_rgba(24,33,43,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--muted)]">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">{value}</p>
    </article>
  );
}

export default function OrgDashboardPage() {
  const { membership } = useTenantContext();

  const primaryAction = {
    org_admin: "Review tenant health",
    provider: "Prepare for today’s visit",
    patient: "Book a follow-up",
  }[membership.role] ?? "Open the dashboard";

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-[color:var(--border)] pb-6">
        <p className="text-sm font-semibold text-[color:var(--muted)]">
          {membership.organization.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          {primaryAction}
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          Tenant slug: <span className="font-medium text-[color:var(--foreground)]">{membership.organization.slug}</span>
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <RoleStat title="Appointments" value="2 upcoming" />
        <RoleStat title="Providers" value="1 active" />
        <RoleStat title="Patients" value="1 admitted" />
      </div>

      <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-6">
        <p className="text-sm font-semibold text-[color:var(--muted)]">Next steps</p>
        <ul className="mt-4 grid gap-3 text-sm text-[color:var(--foreground)]">
          <li className="rounded-xl border border-[color:var(--border)] px-4 py-3">Check patient intake for Peter Patient.</li>
          <li className="rounded-xl border border-[color:var(--border)] px-4 py-3">Confirm provider availability for Priya Provider.</li>
          <li className="rounded-xl border border-[color:var(--border)] px-4 py-3">Open today&apos;s virtual room and complete the note.</li>
        </ul>
      </div>
    </section>
  );
}
