export type AppRole = "platform_admin" | "org_admin" | "provider" | "patient";

export type DashboardStat = {
  label: string;
  value: string;
  hint: string;
};

export type SetupChecklistItem = {
  title: string;
  description: string;
};
