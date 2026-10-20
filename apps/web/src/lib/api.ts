const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type LoginPayload = {
  email: string;
  password: string;
};

export type ApiError = {
  error?: string;
  message?: string;
};

export async function login(payload: LoginPayload): Promise<{ email: string }> {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as ApiError & { email?: string; message?: string };

  if (!res.ok) {
    throw new Error(data.error || data.message || "Invalid credentials");
  }

  return { email: data.email ?? payload.email };
}
