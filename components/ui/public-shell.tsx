import type { ReactNode } from "react";

export function PublicShell({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between rounded-[2.25rem] border border-[color:var(--border)] bg-[color:rgba(255,252,246,0.78)] px-7 py-8 shadow-[0_30px_70px_rgba(24,33,43,0.08)] backdrop-blur-sm sm:px-10 sm:py-10">
          <div className="space-y-6">
            <p className="hero-pill">{eyebrow}</p>
            <div className="space-y-4">
              <h1 className="max-w-xl font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-6xl">
                {title}
              </h1>
              <p className="max-w-lg text-sm leading-7 text-[color:var(--foreground-soft)] sm:text-[15px]">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[color:var(--accent-soft-strong)] bg-[color:var(--surface-accent)] px-5 py-5">
            {aside ?? (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
                  Core flow
                </p>
                <p className="text-sm leading-6 text-[color:var(--accent-ink)]">
                  Clinics onboard patients, providers publish availability, and visits move from booking to room to signed note without leaving the workspace.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-[color:var(--border)] bg-[color:rgba(255,252,246,0.88)] px-6 py-8 shadow-[0_30px_70px_rgba(24,33,43,0.08)] backdrop-blur-sm sm:px-8 sm:py-10">
          {children}
        </div>
      </section>
    </main>
  );
}
