"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerSchema, type RegisterFormValues } from "@/lib/register/schema";
import { registerPatient } from "@/app/register/[slug]/actions";
import {
  FormField,
  Notice,
  controlClassName,
  primaryButtonClassName,
} from "@/components/ui/app-kit";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField
        label="Full name"
        hint="Use the same name your care team expects to see in your chart."
        error={errors.full_name?.message}
        required
      >
        <input
          id="full_name"
          type="text"
          {...register("full_name")}
          placeholder="Jane Smith"
          className={controlClassName(!!errors.full_name)}
        />
      </FormField>

      <FormField
        label="Email address"
        hint="We'll use this to sign you in and send appointment updates."
        error={errors.email?.message}
        required
      >
        <input
          id="email"
          type="email"
          {...register("email")}
          placeholder="jane@example.com"
          className={controlClassName(!!errors.email)}
        />
      </FormField>

      <FormField
        label="Create a password"
        hint="Use at least 8 characters."
        error={errors.password?.message}
        required
      >
        <input
          id="password"
          type="password"
          {...register("password")}
          placeholder="••••••••"
          className={controlClassName(!!errors.password)}
        />
      </FormField>

      <FormField
        label="Confirm password"
        hint="Enter the same password again to avoid sign-in issues."
        error={errors.confirm_password?.message}
        required
      >
        <input
          id="confirm_password"
          type="password"
          {...register("confirm_password")}
          placeholder="••••••••"
          className={controlClassName(!!errors.confirm_password)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Date of birth"
          hint="This helps your care team match the right record."
          error={errors.dob?.message}
          required
        >
          <input
            id="dob"
            type="date"
            {...register("dob")}
            className={controlClassName(!!errors.dob)}
          />
        </FormField>

        <FormField
          label="Sex"
          hint="Choose the sex listed on your clinical record."
          error={errors.sex?.message}
          required
        >
          <select
            id="sex"
            {...register("sex")}
            className={controlClassName(!!errors.sex)}
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
        </FormField>
      </div>

      <FormField
        label="Phone number"
        hint="Optional. Use this if you want reminder calls or texts."
        error={errors.phone?.message}
      >
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="+1 555 000 0000"
          className={controlClassName(!!errors.phone)}
        />
      </FormField>

      {serverError && (
        <Notice tone="warning">{serverError}</Notice>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={primaryButtonClassName}
      >
        {isPending ? "Creating your account…" : "Create patient account"}
      </button>
    </form>
  );
}
