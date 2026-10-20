import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell, fieldClass, labelClass, primaryBtnClass } from "../components/AuthShell";
import { login } from "../lib/api";
import { focus, muted } from "../lib/styles";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      // Temporary: no register API yet — authenticate with the owner login endpoint.
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start checking listings against the profile you approve."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={`font-medium text-[var(--foreground)] underline-offset-4 hover:underline ${focus}`}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="register-name" className={labelClass}>
            Name
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="Alex Owner"
          />
        </div>
        <div>
          <label htmlFor="register-email" className={labelClass}>
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className={labelClass}>
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label htmlFor="register-confirm" className={labelClass}>
            Confirm password
          </label>
          <input
            id="register-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldClass}
            placeholder="Repeat password"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-white/10 px-3 py-2 text-sm text-[#a3a3a3]">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Creating account…" : "Create account"}
        </button>

        <p className={`text-xs leading-relaxed ${muted}`}>
          Account creation API is coming soon. For the demo, use the owner credentials — this form signs you in with the
          existing login endpoint.
        </p>
      </form>
    </AuthShell>
  );
}
