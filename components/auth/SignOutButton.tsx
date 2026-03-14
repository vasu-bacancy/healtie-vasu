"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createClient } from "@/lib/supabase/client";
import { subtleButtonClassName } from "@/components/ui/app-kit";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    await supabase.auth.signOut();
    startTransition(() => {
      router.replace("/");
    });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className={`${subtleButtonClassName} w-full text-xs uppercase tracking-[0.3em] text-[color:var(--accent)] disabled:opacity-60`}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
