import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ease, focus, muted } from "../lib/styles";
import ThemeTogglerDemo from "./ThemeToggler";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(255,255,255,0.04),transparent_50%)] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(15,23,42,0.06),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(15,23,42,0.03),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.25] dark:opacity-[0.35] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
      />

      <header className="relative z-50 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 px-6 backdrop-blur-sm md:px-[8vw]">
        <Link to="/" className={`text-lg font-semibold ${focus}`}>
          ListoraAI
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className={`text-sm ${muted} hover:text-[var(--foreground)] ${focus}`}>
            Home
          </Link>
          <ThemeTogglerDemo />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-16 pt-14 md:pt-20">
        <div className="auth-enter w-full max-w-md opacity-0">
          <h1 className="text-center text-3xl font-semibold tracking-tight md:text-4xl text-[var(--foreground)]">{title}</h1>
          <p className={`mx-auto mt-3 max-w-[36ch] text-center text-base ${muted}`}>{subtitle}</p>

          <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 shadow-xl">
            {children}
          </div>

          <p className={`mt-6 text-center text-sm ${muted}`}>{footer}</p>
        </div>
      </main>
    </div>
  );
}

export const fieldClass = `w-full rounded-lg border border-[var(--border)] bg-white dark:bg-black/40 px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-[border-color,background-color] duration-200 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${ease}`;

export const labelClass = "mb-1.5 block text-sm font-medium text-[var(--foreground)]";

export const primaryBtnClass = `w-full rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-[opacity,transform] duration-200 enabled:hover:opacity-95 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${focus} ${ease}`;
