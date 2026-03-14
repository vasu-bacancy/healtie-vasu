"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("admin@northstar.test");
  const [password, setPassword] = useState("Demo1234!");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    startTransition(() => {
      router.push("/");
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <label className="text-sm font-semibold text-[color:var(--muted)]" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
          placeholder="admin@northstar.test"
        />
      </div>

      <div className="rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <label className="text-sm font-semibold text-[color:var(--muted)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="rounded-[1.25rem] bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      {error && <p className="text-sm text-[color:#c13b3b]">{error}</p>}
    </form>
  );
}
