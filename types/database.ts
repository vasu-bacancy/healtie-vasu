export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type BaseTable<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export type Database = {
  public: {
    Tables: {
      appointments: BaseTable<
        {
          created_at: string;
          created_by: string | null;
          id: string;
          meeting_url: string | null;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          reason: string | null;
          scheduled_end: string;
          scheduled_start: string;
          status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
          visit_type: "virtual" | "in_person";
        },
        {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          meeting_url?: string | null;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          reason?: string | null;
          scheduled_end: string;
          scheduled_start: string;
          status?: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
          visit_type?: "virtual" | "in_person";
        },
        Partial<{
          created_at: string;
          created_by: string | null;
          id: string;
          meeting_url: string | null;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          reason: string | null;
          scheduled_end: string;
          scheduled_start: string;
          status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
          visit_type: "virtual" | "in_person";
        }>
      >;
      audit_logs: BaseTable<
        {
          action: string;
          actor_profile_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
        },
        {
          action: string;
          actor_profile_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          organization_id: string;
        },
        Partial<{
          action: string;
          actor_profile_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
          organization_id: string;
        }>
      >;
      clinical_notes: BaseTable<
        {
          assessment: string | null;
          created_at: string;
          encounter_id: string;
          id: string;
          note_type: string;
          objective: string | null;
          organization_id: string;
          patient_id: string;
          plan: string | null;
          provider_id: string;
          signed_at: string | null;
          subjective: string | null;
        },
        {
          assessment?: string | null;
          created_at?: string;
          encounter_id: string;
          id?: string;
          note_type?: string;
          objective?: string | null;
          organization_id: string;
          patient_id: string;
          plan?: string | null;
          provider_id: string;
          signed_at?: string | null;
          subjective?: string | null;
        },
        Partial<{
          assessment: string | null;
          created_at: string;
          encounter_id: string;
          id: string;
          note_type: string;
          objective: string | null;
          organization_id: string;
          patient_id: string;
          plan: string | null;
          provider_id: string;
          signed_at: string | null;
          subjective: string | null;
        }>
      >;
      encounters: BaseTable<
        {
          appointment_id: string;
          created_at: string;
          ended_at: string | null;
          id: string;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          started_at: string | null;
          status: "draft" | "in_progress" | "completed";
        },
        {
          appointment_id: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          started_at?: string | null;
          status?: "draft" | "in_progress" | "completed";
        },
        Partial<{
          appointment_id: string;
          created_at: string;
          ended_at: string | null;
          id: string;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          started_at: string | null;
          status: "draft" | "in_progress" | "completed";
        }>
      >;
      memberships: BaseTable<
        {
          created_at: string;
          id: string;
          organization_id: string;
          profile_id: string;
          role: "org_admin" | "provider" | "patient";
          status: "active" | "invited" | "suspended";
        },
        {
          created_at?: string;
          id?: string;
          organization_id: string;
          profile_id: string;
          role: "org_admin" | "provider" | "patient";
          status?: "active" | "invited" | "suspended";
        },
        Partial<{
          created_at: string;
          id: string;
          organization_id: string;
          profile_id: string;
          role: "org_admin" | "provider" | "patient";
          status: "active" | "invited" | "suspended";
        }>
      >;
      notifications: BaseTable<
        {
          body: string;
          created_at: string;
          id: string;
          organization_id: string;
          profile_id: string;
          read_at: string | null;
          title: string;
          type: string;
        },
        {
          body: string;
          created_at?: string;
          id?: string;
          organization_id: string;
          profile_id: string;
          read_at?: string | null;
          title: string;
          type: string;
        },
        Partial<{
          body: string;
          created_at: string;
          id: string;
          organization_id: string;
          profile_id: string;
          read_at: string | null;
          title: string;
          type: string;
        }>
      >;
      organizations: BaseTable<
        {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          status: "active" | "sandbox" | "archived";
        },
        {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          status?: "active" | "sandbox" | "archived";
        },
        Partial<{
          created_at: string;
          id: string;
          name: string;
          slug: string;
          status: "active" | "sandbox" | "archived";
        }>
      >;
      patient_allergies: BaseTable<
        {
          created_at: string;
          id: string;
          organization_id: string;
          patient_id: string;
          reaction: string | null;
          substance: string;
        },
        {
          created_at?: string;
          id?: string;
          organization_id: string;
          patient_id: string;
          reaction?: string | null;
          substance: string;
        },
        Partial<{
          created_at: string;
          id: string;
          organization_id: string;
          patient_id: string;
          reaction: string | null;
          substance: string;
        }>
      >;
      patient_medications: BaseTable<
        {
          created_at: string;
          dosage: string | null;
          id: string;
          medication_name: string;
          organization_id: string;
          patient_id: string;
        },
        {
          created_at?: string;
          dosage?: string | null;
          id?: string;
          medication_name: string;
          organization_id: string;
          patient_id: string;
        },
        Partial<{
          created_at: string;
          dosage: string | null;
          id: string;
          medication_name: string;
          organization_id: string;
          patient_id: string;
        }>
      >;
      patients: BaseTable<
        {
          created_at: string;
          dob: string | null;
          email: string | null;
          full_name: string;
          id: string;
          intake_completed: boolean;
          organization_id: string;
          phone: string | null;
          profile_id: string | null;
          sex: string | null;
          status: "active" | "inactive";
        },
        {
          created_at?: string;
          dob?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          intake_completed?: boolean;
          organization_id: string;
          phone?: string | null;
          profile_id?: string | null;
          sex?: string | null;
          status?: "active" | "inactive";
        },
        Partial<{
          created_at: string;
          dob: string | null;
          email: string | null;
          full_name: string;
          id: string;
          intake_completed: boolean;
          organization_id: string;
          phone: string | null;
          profile_id: string | null;
          sex: string | null;
          status: "active" | "inactive";
        }>
      >;
      profiles: BaseTable<
        {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
        },
        {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
        },
        Partial<{
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
        }>
      >;
      provider_availability: BaseTable<
        {
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          organization_id: string;
          provider_id: string;
          slot_minutes: number;
          start_time: string;
        },
        {
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          organization_id: string;
          provider_id: string;
          slot_minutes?: number;
          start_time: string;
        },
        Partial<{
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          organization_id: string;
          provider_id: string;
          slot_minutes: number;
          start_time: string;
        }>
      >;
      providers: BaseTable<
        {
          bio: string | null;
          created_at: string;
          id: string;
          license_number: string | null;
          organization_id: string;
          profile_id: string;
          specialty: string | null;
          timezone: string;
        },
        {
          bio?: string | null;
          created_at?: string;
          id?: string;
          license_number?: string | null;
          organization_id: string;
          profile_id: string;
          specialty?: string | null;
          timezone?: string;
        },
        Partial<{
          bio: string | null;
          created_at: string;
          id: string;
          license_number: string | null;
          organization_id: string;
          profile_id: string;
          specialty: string | null;
          timezone: string;
        }>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      appointment_status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled";
      encounter_status: "draft" | "in_progress" | "completed";
      membership_role: "org_admin" | "provider" | "patient";
      membership_status: "active" | "invited" | "suspended";
      organization_status: "active" | "sandbox" | "archived";
      patient_status: "active" | "inactive";
      visit_type: "virtual" | "in_person";
    };
    CompositeTypes: Record<string, never>;
  };
};
