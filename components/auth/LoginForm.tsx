"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  FormField,
  Notice,
  controlClassName,
  primaryButtonClassName,
} from "@/components/ui/app-kit";

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
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <FormField
        label="Email address"
        hint="Use the email linked to your clinic or patient account."
      >
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={controlClassName()}
          placeholder="name@clinic.com"
        />
      </FormField>

      <FormField
        label="Password"
        hint="Demo credentials are prefilled. Replace them if you created your own account."
      >
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className={controlClassName()}
          placeholder="••••••••"
        />
      </FormField>

      <button
        type="submit"
        className={primaryButtonClassName}
        disabled={isPending}
      >
        {isPending ? "Signing you in…" : "Sign in"}
      </button>

      {error && (
        <Notice tone="warning">{error}</Notice>
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
