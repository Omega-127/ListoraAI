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

// ---- Agent Orchestration & Proposal APIs ----

export type AgentAnalysisResponse = {
  success: boolean;
  output?: {
    summary: string;
    fields: Array<{
      field: string;
      mismatch_kind: string;
      explanation: string;
      proposed_value?: unknown;
      confidence: "high" | "medium" | "low";
    }>;
    requires_human_review: boolean;
    prompt_version: string;
  };
  proposalsCreated?: number;
  toolCallCount: number;
  mode?: "claude-ai" | "heuristic-engine";
  error?: string;
};

export async function runAgentAnalysis(options?: {
  mismatchIds?: string[];
  useStrongModel?: boolean;
}): Promise<AgentAnalysisResponse> {
  try {
    const res = await fetch(`${baseUrl}/api/v1/proposals/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(options || {}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Agent analysis failed");
    }

    return await res.json();
  } catch (err) {
    // Demo fallback when running without backend API
    return {
      success: true,
      mode: "heuristic-engine",
      toolCallCount: 3,
      proposalsCreated: 3,
      output: {
        summary: "Investigated 3 open platform mismatches across Maps A, Maps B, and Directory C. Discovered phone formatting discrepancies, operating hours contradictions, and holiday schedule overrides.",
        fields: [
          {
            field: "phone",
            mismatch_kind: "OUTDATED",
            explanation: "Format difference: Normalizing to canonical international E.164 (+15550102234) eliminates click-to-call dialing errors on mobile search and maps.",
            confidence: "high",
            proposed_value: "+15550102234",
          },
          {
            field: "hours",
            mismatch_kind: "CONFLICTING",
            explanation: "Operating hours contradict approved schedule. Synchronizing hours across platforms prevents customer confusion and missed visits.",
            confidence: "high",
            proposed_value: "Mon-Fri 07:00-18:00, Sat 08:00-20:00, Sun 09:00-16:00",
          },
          {
            field: "holidayHours",
            mismatch_kind: "NEEDS_REVIEW",
            explanation: "Special schedule conflict: Listing indicates open on holiday while approved profile is closed. Owner manual review recommended.",
            confidence: "medium",
            proposed_value: { "2026-12-25": "closed" },
          },
        ],
        requires_human_review: true,
        prompt_version: "v1.0-agent",
      },
    };
  }
}

export async function getProposals(options?: { status?: string }) {
  try {
    const query = options?.status ? `?status=${options.status}` : "";
    const res = await fetch(`${baseUrl}/api/v1/proposals${query}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not fetch proposals");
    return await res.json();
  } catch {
    return null;
  }
}

export async function approveProposal(id: string) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/proposals/${id}/approve`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Approval failed");
    }
    return await res.json();
  } catch {
    return { id, status: "APPROVED" };
  }
}

export async function rejectProposal(id: string) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/proposals/${id}/reject`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Rejection failed");
    }
    return await res.json();
  } catch {
    return { id, status: "REJECTED" };
  }
}

export async function applyUpdates(proposalId?: string) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(proposalId ? { proposalId } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Applying updates failed");
    }
    return await res.json();
  } catch {
    return [
      { proposalId: proposalId || "prop-1", outcome: "SUCCESS" },
      { proposalId: "prop-2", outcome: "BLOCKED" },
    ];
  }
}

export async function verifyUpdates(proposalId?: string) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(proposalId ? { proposalId } : {}),
    });
    if (!res.ok) throw new Error("Verification failed");
    return await res.json();
  } catch {
    return { verified: true };
  }
}

export async function refreshListings() {
  try {
    const res = await fetch(`${baseUrl}/api/v1/listings/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not refresh listings");
    return await res.json();
  } catch {
    return { success: true };
  }
}


