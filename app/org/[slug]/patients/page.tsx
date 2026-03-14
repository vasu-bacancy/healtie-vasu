import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, getActiveMembershipWithOrg } from "@/lib/supabase/tenant";
import { getPatients } from "@/lib/db/patients";

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
      <header className="flex items-center justify-between border-b border-[color:var(--border)] pb-6">
        <div>
          <p className="text-sm font-semibold text-[color:var(--muted)]">
            {membership.organization.name}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Patients
          </h1>
        </div>
        {canManage && (
          <Link
            href={`/org/${slug}/patients/new`}
            className="rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
          >
            Add a patient
          </Link>
        )}
      </header>

      {patients.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white p-12 text-center">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">No patients yet</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Add your first patient so the care team can book visits and document care.
          </p>
          {canManage && (
            <Link
              href={`/org/${slug}/patients/new`}
              className="mt-5 inline-block rounded-[1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              Add the first patient
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Date of birth
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Intake
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {patients.map((patient) => (
                <tr key={patient.id} className="transition hover:bg-[color:var(--surface)]">
                  <td className="px-6 py-4 font-medium text-[color:var(--foreground)]">
                    {patient.full_name}
                  </td>
                  <td className="px-6 py-4 text-[color:var(--muted)]">
                    {patient.dob ? format(new Date(patient.dob + "T00:00:00"), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        patient.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {patient.status === "active" ? "Active" : patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        patient.intake_completed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {patient.intake_completed ? "Complete" : "Needs intake"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/org/${slug}/patients/${patient.id}`}
                      className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                    >
                      View chart
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
