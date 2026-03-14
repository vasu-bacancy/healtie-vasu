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
      {/* Full name */}
      <Field label="Full name" error={errors.full_name?.message} required>
        <input
          id="full_name"
          type="text"
          {...register("full_name")}
          placeholder="Jane Smith"
          className={inputCls(!!errors.full_name)}
        />
      </Field>

      {/* Email */}
      <Field label="Email" error={errors.email?.message} required>
        <input
          id="email"
          type="email"
          {...register("email")}
          placeholder="jane@example.com"
          className={inputCls(!!errors.email)}
        />
      </Field>

      {/* Password */}
      <Field label="Password" error={errors.password?.message} required>
        <input
          id="password"
          type="password"
          {...register("password")}
          placeholder="••••••••"
          className={inputCls(!!errors.password)}
        />
      </Field>

      {/* Confirm password */}
      <Field label="Confirm password" error={errors.confirm_password?.message} required>
        <input
          id="confirm_password"
          type="password"
          {...register("confirm_password")}
          placeholder="••••••••"
          className={inputCls(!!errors.confirm_password)}
        />
      </Field>

      {/* DOB + Sex side by side */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth" error={errors.dob?.message} required>
          <input
            id="dob"
            type="date"
            {...register("dob")}
            className={inputCls(!!errors.dob)}
          />
        </Field>

        <Field label="Sex" error={errors.sex?.message} required>
          <select
            id="sex"
            {...register("sex")}
            className={inputCls(!!errors.sex)}
            defaultValue=""
          >
            <option value="" disabled>
              — Select —
            </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </Field>
      </div>

      {/* Phone (optional) */}
      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="+1 555 000 0000"
          className={inputCls(!!errors.phone)}
        />
      </Field>

      {/* Server error */}
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
        {isPending ? "Creating account…" : "Create account"}
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
  error,
  required,
  children,
}: {
  label: string;
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
      {children}
      {error && <p className="mt-1 text-xs text-[color:#c13b3b]">{error}</p>}
    </div>
  );
}
