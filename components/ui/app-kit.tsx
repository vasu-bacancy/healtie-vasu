import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-[1.1rem] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--surface)] shadow-[0_18px_40px_rgba(24,119,110,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--accent-strong)] hover:shadow-[0_24px_48px_rgba(24,119,110,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-[1.1rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";

export const subtleButtonClassName =
  "inline-flex items-center justify-center rounded-[1.1rem] border border-[color:var(--border)] bg-[color:var(--surface-subtle)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition duration-200 hover:bg-[color:var(--surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";

export const inlineActionClassName =
  "text-sm font-semibold text-[color:var(--accent)] underline decoration-[color:var(--accent-soft-strong)] underline-offset-4 transition hover:text-[color:var(--accent-strong)]";

export function controlClassName(hasError = false) {
  return clsx(
    "w-full rounded-[1rem] border bg-[color:var(--surface)] px-3.5 py-3 text-sm text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] outline-none transition placeholder:text-[color:var(--muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
    hasError
      ? "border-[color:var(--danger)]"
      : "border-[color:var(--border-strong)] hover:border-[color:var(--accent-soft-strong)]",
  );
}

export const textareaClassName = `${controlClassName()} min-h-[8rem] resize-y`;

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  meta,
  backHref,
  backLabel,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-[color:var(--border)] pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-3">
        {backHref && backLabel ? (
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]">
            <span aria-hidden>←</span>
            <span>{backLabel}</span>
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none tracking-[-0.04em] text-[color:var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-[15px]">
              {description}
            </p>
          ) : null}
          {meta}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
    </header>
  );
}

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "accent" | "warning" | "success";
};

export function Surface({ children, className, tone = "default" }: SurfaceProps) {
  return (
    <section
      className={clsx(
        "rounded-[1.75rem] border p-6 shadow-[0_24px_50px_rgba(24,33,43,0.06)] transition duration-200",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </section>
  );
}

const toneStyles = {
  default: "border-[color:var(--border)] bg-[color:var(--surface)]",
  soft: "border-[color:var(--border)] bg-[color:var(--surface-subtle)]",
  accent: "border-[color:var(--accent-soft-strong)] bg-[color:var(--surface-accent)]",
  warning: "border-[color:rgba(217,119,6,0.22)] bg-[color:var(--surface-warning)]",
  success: "border-[color:rgba(4,120,87,0.18)] bg-[color:var(--surface-success)]",
} as const;

export function SectionHeading({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
          {label}
        </p>
      ) : null}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h2>
        {description ? <p className="text-sm leading-6 text-[color:var(--muted)]">{description}</p> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Surface
      tone="soft"
      className={clsx("flex min-h-[14rem] flex-col items-center justify-center text-center", className)}
    >
      <div className="max-w-md space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
          Ready for the first step
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-[-0.03em] text-[color:var(--foreground)]">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--muted)]">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </Surface>
  );
}

export function Notice({
  children,
  tone = "accent",
  className,
}: {
  children: ReactNode;
  tone?: "accent" | "warning" | "success";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[1.3rem] border px-5 py-4 text-sm leading-6",
        noticeStyles[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

const noticeStyles = {
  accent: "border-[color:var(--accent-soft-strong)] bg-[color:var(--surface-accent)] text-[color:var(--accent-ink)]",
  warning: "border-[color:rgba(217,119,6,0.24)] bg-[color:var(--surface-warning)] text-[color:var(--warning-ink)]",
  success: "border-[color:rgba(4,120,87,0.18)] bg-[color:var(--surface-success)] text-[color:var(--success-ink)]",
} as const;

export function MetricCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  tone?: "default" | "accent" | "warning";
}) {
  const content = (
    <Surface
      tone={tone === "accent" ? "accent" : tone === "warning" ? "warning" : "default"}
      className="h-full min-h-[10.5rem] p-5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
        {value}
      </p>
      {hint ? <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{hint}</p> : null}
    </Surface>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block transition duration-200 hover:-translate-y-0.5">
      {content}
    </Link>
  );
}

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_24px_50px_rgba(24,33,43,0.06)]", className)}>
      {children}
    </div>
  );
}

export function FormField({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[color:var(--foreground)]">
        {label}
        {required ? <span className="ml-1 text-[color:var(--danger)]">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-[color:var(--muted)]">{hint}</p> : null}
      {error ? <p className="text-xs leading-5 text-[color:var(--danger)]">{error}</p> : null}
    </div>
  );
}

export function DataPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "accent";
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", pillStyles[tone])}>
      {children}
    </span>
  );
}

const pillStyles = {
  neutral: "bg-[color:var(--surface-strong)] text-[color:var(--foreground-soft)]",
  success: "bg-[color:var(--surface-success)] text-[color:var(--success-ink)]",
  warning: "bg-[color:var(--surface-warning)] text-[color:var(--warning-ink)]",
  accent: "bg-[color:var(--surface-accent)] text-[color:var(--accent-ink)]",
} as const;

export function KeyValueRow({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={clsx("gap-4 border-b border-[color:var(--border)] py-3 last:border-b-0 last:pb-0", stacked ? "space-y-1" : "flex items-start")}>
      <dt className={clsx("shrink-0 text-sm text-[color:var(--muted)]", stacked ? "" : "w-32")}>{label}</dt>
      <dd className="text-sm font-medium leading-6 text-[color:var(--foreground)]">{children}</dd>
    </div>
  );
}
