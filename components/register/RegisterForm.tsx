"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerSchema, type RegisterFormValues } from "@/lib/register/schema";
import { registerPatient } from "@/app/register/[slug]/actions";

export default function RegisterForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerPatient(slug, values);
      if (result.success) {
        router.push("/sign-in?registered=1");
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Field
        label="Full name"
        description="Use the same name your care team expects to see in your chart."
        error={errors.full_name?.message}
        required
      >
        <input
          id="full_name"
          type="text"
          {...register("full_name")}
          placeholder="Jane Smith"
          className={inputCls(!!errors.full_name)}
        />
      </Field>

      <Field
        label="Email address"
        description="We'll use this to sign you in and send appointment updates."
        error={errors.email?.message}
        required
      >
        <input
          id="email"
          type="email"
          {...register("email")}
          placeholder="jane@example.com"
          className={inputCls(!!errors.email)}
        />
      </Field>

      <Field
        label="Create a password"
        description="Use at least 8 characters."
        error={errors.password?.message}
        required
      >
        <input
          id="password"
          type="password"
          {...register("password")}
          placeholder="••••••••"
          className={inputCls(!!errors.password)}
        />
      </Field>

      <Field
        label="Confirm password"
        description="Enter the same password again to avoid sign-in issues."
        error={errors.confirm_password?.message}
        required
      >
        <input
          id="confirm_password"
          type="password"
          {...register("confirm_password")}
          placeholder="••••••••"
          className={inputCls(!!errors.confirm_password)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Date of birth"
          description="This helps your care team match the right record."
          error={errors.dob?.message}
          required
        >
          <input
            id="dob"
            type="date"
            {...register("dob")}
            className={inputCls(!!errors.dob)}
          />
        </Field>

        <Field
          label="Sex"
          description="Choose the sex listed on your clinical record."
          error={errors.sex?.message}
          required
        >
          <select
            id="sex"
            {...register("sex")}
            className={inputCls(!!errors.sex)}
            defaultValue=""
          >
            <option value="" disabled>
              Select an option
            </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </Field>
      </div>

      <Field
        label="Phone number"
        description="Optional. Use this if you want reminder calls or texts."
        error={errors.phone?.message}
      >
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="+1 555 000 0000"
          className={inputCls(!!errors.phone)}
        />
      </Field>

      {serverError && (
        <p className="rounded-xl bg-[color:#fef2f2] px-4 py-3 text-sm text-[color:#c13b3b]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-[1.25rem] bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating your account…" : "Create patient account"}
      </button>
    </form>
  );
}

function inputCls(hasError: boolean) {
  return `mt-2 w-full rounded-xl border ${
    hasError ? "border-[color:#c13b3b]" : "border-[color:var(--border)]"
  } bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]`;
}

function Field({
  label,
  description,
  error,
  required,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <label className="text-sm font-semibold text-[color:var(--muted)]">
        {label}
        {required && <span className="ml-0.5 text-[color:#c13b3b]"> *</span>}
      </label>
      {description && <p className="mt-1 text-xs text-[color:var(--muted)]">{description}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-[color:#c13b3b]">{error}</p>}
    </div>
  );
}
