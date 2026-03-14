import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type ProviderRow = Database["public"]["Tables"]["providers"]["Row"];
export type ProviderAvailabilityRow =
  Database["public"]["Tables"]["provider_availability"]["Row"];
export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export type ProviderWithProfile = ProviderRow & {
  profile: { id: string; full_name: string | null; email: string };
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function getProviders(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ProviderWithProfile[]> {
  const { data, error } = await supabase
    .from("providers")
    .select("*, profile:profiles(id, full_name, email)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProviderWithProfile[];
}

export async function getProvider(
  supabase: SupabaseClient<Database>,
  providerId: string,
  organizationId: string,
): Promise<ProviderWithProfile> {
  const { data, error } = await supabase
    .from("providers")
    .select("*, profile:profiles(id, full_name, email)")
    .eq("id", providerId)
    .eq("organization_id", organizationId)
    .single();

  if (error) throw error;
  return data as ProviderWithProfile;
}

export async function getProviderByProfileId(
  supabase: SupabaseClient<Database>,
  profileId: string,
  organizationId: string,
): Promise<ProviderRow | null> {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("profile_id", profileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProviderAvailability(
  supabase: SupabaseClient<Database>,
  providerId: string,
  organizationId: string,
): Promise<ProviderAvailabilityRow[]> {
  const { data, error } = await supabase
    .from("provider_availability")
    .select("*")
    .eq("provider_id", providerId)
    .eq("organization_id", organizationId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProviderAppointmentsForDate(
  supabase: SupabaseClient<Database>,
  providerId: string,
  organizationId: string,
  date: string, // YYYY-MM-DD
): Promise<AppointmentRow[]> {
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("provider_id", providerId)
    .eq("organization_id", organizationId)
    .gte("scheduled_start", dayStart)
    .lte("scheduled_start", dayEnd)
    .neq("status", "cancelled");

  if (error) throw error;
  return data ?? [];
}

/** Generate bookable slots for a given date, excluding already-booked times. */
export function generateBookableSlots(
  availability: ProviderAvailabilityRow[],
  bookedAppointments: AppointmentRow[],
  date: string, // YYYY-MM-DD
): { start: string; end: string; label: string }[] {
  const d = new Date(date + "T00:00:00");
  const dayOfWeek = d.getDay();

  const windows = availability.filter((a) => a.day_of_week === dayOfWeek);
  const slots: { start: string; end: string; label: string }[] = [];

  for (const window of windows) {
    const [sh, sm] = window.start_time.split(":").map(Number);
    const [eh, em] = window.end_time.split(":").map(Number);

    let cursor = new Date(date + "T00:00:00");
    cursor.setHours(sh, sm, 0, 0);

    const windowEnd = new Date(date + "T00:00:00");
    windowEnd.setHours(eh, em, 0, 0);

    while (cursor < windowEnd) {
      const slotEnd = new Date(cursor.getTime() + window.slot_minutes * 60_000);
      if (slotEnd > windowEnd) break;

      const isBooked = bookedAppointments.some((appt) => {
        const as = new Date(appt.scheduled_start);
        const ae = new Date(appt.scheduled_end);
        return cursor < ae && slotEnd > as;
      });

      if (!isBooked) {
        const fmt = (d: Date) =>
          d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        slots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
          label: `${fmt(cursor)} – ${fmt(slotEnd)}`,
        });
      }

      cursor = new Date(cursor.getTime() + window.slot_minutes * 60_000);
    }
  }

  return slots;
}
