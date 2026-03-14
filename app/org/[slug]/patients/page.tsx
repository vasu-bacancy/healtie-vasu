import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatients } from "@/lib/db/patients";
import {
  DataPill,
  EmptyState,
  PageHeader,
  TableWrap,
  primaryButtonClassName,
  inlineActionClassName,
} from "@/components/ui/app-kit";

export default async function PatientsPage({
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

  const canManage = membership.role === "org_admin" || membership.role === "provider";
  const patients = await getPatients(supabase, membership.organization_id);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={membership.organization.name}
        title="Patients"
        description="Keep the patient roster clean so the care team can schedule visits and file documentation without context switching."
        action={
          canManage ? (
            <Link href={`/org/${slug}/patients/new`} className={primaryButtonClassName}>
              Add a patient
            </Link>
          ) : null
        }
      />

      {patients.length === 0 ? (
        <EmptyState
          title="The roster is ready for the first patient."
          description="Add your first patient so the care team can book visits and document care in a single place."
          action={
            canManage ? (
              <Link href={`/org/${slug}/patients/new`} className={primaryButtonClassName}>
                Add the first patient
              </Link>
            ) : null
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--surface-subtle)]">
              <tr className="border-b border-[color:var(--border)]">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Date of birth
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Intake
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {patients.map((patient) => (
                <tr key={patient.id} className="motion-lift transition hover:bg-[color:var(--surface-subtle)]">
                  <td className="px-6 py-5 font-medium text-[color:var(--foreground)]">
                    {patient.full_name}
                  </td>
                  <td className="px-6 py-5 text-[color:var(--muted)]">
                    {patient.dob ? format(new Date(patient.dob + "T00:00:00"), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-5">
                    <DataPill tone={patient.status === "active" ? "success" : "neutral"}>
                      {patient.status === "active" ? "Active" : patient.status}
                    </DataPill>
                  </td>
                  <td className="px-6 py-5">
                    <DataPill tone={patient.intake_completed ? "success" : "warning"}>
                      {patient.intake_completed ? "Complete" : "Needs intake"}
                    </DataPill>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/org/${slug}/patients/${patient.id}`} className={inlineActionClassName}>
                      View chart
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </section>
  );
}
