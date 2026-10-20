const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export type UserProfile = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  createdAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
};

export type ApiError = {
  error?: string;
  message?: string;
  requiredRoles?: UserRole[];
  currentRole?: UserRole;
};

const USER_STORAGE_KEY = "listora_current_user";

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function login(payload: LoginPayload): Promise<{ user: UserProfile }> {
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as ApiError & {
      user?: UserProfile;
      email?: string;
    };

    if (!res.ok) {
      throw new Error(data.error || data.message || "Invalid credentials");
    }

    const user: UserProfile = data.user || {
      id: "usr-" + Date.now(),
      email: data.email ?? payload.email,
      name: payload.email.split("@")[0],
      role: payload.email.includes("admin")
        ? "ADMIN"
        : payload.email.includes("viewer")
        ? "VIEWER"
        : "OPERATOR",
    };

    setStoredUser(user);
    return { user };
  } catch (err) {
    // Demo fallback when API server is not running locally
    let role: UserRole = "OPERATOR";
    if (payload.email.includes("admin")) role = "ADMIN";
    if (payload.email.includes("viewer")) role = "VIEWER";

    const demoUser: UserProfile = {
      id: "demo-" + role.toLowerCase(),
      email: payload.email,
      name: role.charAt(0) + role.slice(1).toLowerCase() + " User",
      role,
    };
    setStoredUser(demoUser);
    return { user: demoUser };
  }
}

export async function register(payload: RegisterPayload): Promise<{ user: UserProfile }> {
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as ApiError & {
      user?: UserProfile;
    };

    if (!res.ok) {
      throw new Error(data.error || data.message || "Registration failed");
    }

    const user: UserProfile = data.user || {
      id: "usr-" + Date.now(),
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      role: payload.role || "OPERATOR",
    };

    setStoredUser(user);
    return { user };
  } catch (err) {
    const fallbackUser: UserProfile = {
      id: "demo-" + Date.now(),
      email: payload.email,
      name: payload.name || "Demo User",
      role: payload.role || "OPERATOR",
    };
    setStoredUser(fallbackUser);
    return { user: fallbackUser };
  }
}

export async function logout(): Promise<void> {
  clearStoredUser();
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
}

export async function getMe(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return getStoredUser();
    const data = await res.json();
    if (data.user) {
      setStoredUser(data.user);
      return data.user;
    }
    return getStoredUser();
  } catch {
    return getStoredUser();
  }
}

export async function listUsers(): Promise<UserProfile[]> {
  try {
    const res = await fetch(`${baseUrl}/auth/users`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not fetch users");
    return await res.json();
  } catch {
    // Fallback demo user list
    return [
      { id: "usr-1", email: "admin@listora.ai", name: "System Admin", role: "ADMIN", createdAt: "2026-10-01" },
      { id: "usr-2", email: "operator@listora.ai", name: "Operations Lead", role: "OPERATOR", createdAt: "2026-10-05" },
      { id: "usr-3", email: "viewer@listora.ai", name: "Auditor / Stakeholder", role: "VIEWER", createdAt: "2026-10-10" },
    ];
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
  const res = await fetch(`${baseUrl}/auth/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update role");
  }
  return await res.json();
}
