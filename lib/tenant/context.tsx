"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { ProfileRow, MembershipWithOrg } from "@/lib/supabase/tenant";
import type { Session } from "@supabase/supabase-js";

export type TenantContextValue = {
  profile: ProfileRow;
  membership: MembershipWithOrg;
  session: Session;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TenantContextValue;
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantContext() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }

  return context;
}
