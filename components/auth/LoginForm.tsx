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
      setError(getSignInErrorMessage(error.message));
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
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
          placeholder="name@clinic.com"
        />
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Use the email linked to your clinic or patient account.
        </p>
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
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Demo credentials are prefilled. Replace them if you created your own account.
        </p>
      </div>

      <button
        type="submit"
        className="rounded-[1.25rem] bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Signing you in…" : "Sign in"}
      </button>

      {error && (
        <p className="rounded-xl bg-[color:#fef2f2] px-4 py-3 text-sm text-[color:#c13b3b]">
          {error}
        </p>
      )}
    </form>
  );
}

function getSignInErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "We couldn't sign you in with that email and password. Check your details and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "This email address still needs to be confirmed before you can sign in.";
  }

  return "We couldn't sign you in right now. Please try again.";
}
