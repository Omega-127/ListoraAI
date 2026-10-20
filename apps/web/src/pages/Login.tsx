import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell, fieldClass, labelClass, primaryBtnClass } from "../components/AuthShell";
import { login, type UserRole } from "../lib/api";
import { focus, muted } from "../lib/styles";
import { ShieldCheck, UserCheck, Eye } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setPending(false);
    }
  }

  function fillDemo(role: UserRole) {
    if (role === "ADMIN") {
      setEmail("admin@listora.ai");
      setPassword("password123");
    } else if (role === "OPERATOR") {
      setEmail("operator@listora.ai");
      setPassword("password123");
    } else {
      setEmail("viewer@listora.ai");
      setPassword("password123");
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to review mismatches and approve listing updates."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className={`font-medium text-[var(--foreground)] underline-offset-4 hover:underline ${focus}`}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="you@business.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="••••••••"
          />
        </div>

        {/* Demo Role Presets */}
        <div className="rounded-lg border border-[var(--border)] bg-black/40 p-3">
          <p className={`text-[11px] font-medium uppercase tracking-wider mb-2 ${muted}`}>
            Quick Demo Role Login:
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillDemo("ADMIN")}
              className="flex items-center justify-center gap-1.5 rounded border border-white/10 bg-white/5 py-1.5 px-2 hover:bg-white/15 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("OPERATOR")}
              className="flex items-center justify-center gap-1.5 rounded border border-white/10 bg-white/5 py-1.5 px-2 hover:bg-white/15 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Operator</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("VIEWER")}
              className="flex items-center justify-center gap-1.5 rounded border border-white/10 bg-white/5 py-1.5 px-2 hover:bg-white/15 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-blue-400" />
              <span>Viewer</span>
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
