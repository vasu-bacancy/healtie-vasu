"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

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
      className="w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent)] transition hover:bg-[color:var(--surface-strong)] disabled:opacity-60"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
