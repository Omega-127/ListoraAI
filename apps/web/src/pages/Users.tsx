import { useState, useEffect } from "react";
import { Users as UsersIcon, UserCheck, Eye, Check, RefreshCw } from "lucide-react";
import { listUsers, updateUserRole, getStoredUser, setStoredUser, type UserProfile, type UserRole } from "../lib/api";
import { cn } from "../lib/cn";
import { focus, muted } from "../lib/styles";

const ROLE_CONFIG: Record<UserRole, { label: string; tone: string; icon: typeof UserCheck; desc: string }> = {
  OPERATOR: {
    label: "Operator",
    tone: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: UserCheck,
    desc: "Review discrepancies, run AI investigator, approve/reject and push updates.",
  },
  VIEWER: {
    label: "Viewer",
    tone: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Eye,
    desc: "Read-only access to consistency scores, reports, audit trails, and alerts.",
  },
};

export default function Users() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getStoredUser());
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await listUsers();
        setUsers(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (currentUser?.id === userId) {
        const updated = { ...currentUser, role: newRole };
        setCurrentUser(updated);
        setStoredUser(updated);
      }
      setSuccessMsg(`Role successfully updated to ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // Local demo fallback
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (currentUser?.id === userId) {
        const updated = { ...currentUser, role: newRole };
        setCurrentUser(updated);
        setStoredUser(updated);
      }
      setSuccessMsg(`Role switched to ${newRole} (Demo mode)`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleSwitchCurrentRole = (newRole: UserRole) => {
    const updated: UserProfile = {
      id: currentUser?.id || "demo-current",
      email: currentUser?.email || "user@listora.ai",
      name: currentUser?.name || "Active User",
      role: newRole,
    };
    setCurrentUser(updated);
    setStoredUser(updated);
    setSuccessMsg(`Simulating active session as: ${newRole}`);
    setTimeout(() => {
      setSuccessMsg(null);
      window.location.reload();
    }, 800);
  };

  const activeRole = currentUser?.role || "OPERATOR";
  const isOperator = activeRole === "OPERATOR";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-[var(--primary)]" />
            Users & Role Management
          </h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Role-based access control (RBAC) governing profile edits, approvals, and system observability.
          </p>
        </div>

        {/* Demo Role Switcher */}
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#0d0d0d]/90 p-2 text-xs">
          <span className={`font-medium ${muted}`}>Switch Role:</span>
          {(["OPERATOR", "VIEWER"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleSwitchCurrentRole(r)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                activeRole === r
                  ? "bg-white/20 text-white font-semibold shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
                focus
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-300">
          <Check className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Permission Matrix Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-5 space-y-4">
        <h2 className="text-base font-semibold">Permission Matrix by Role</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-neutral-400">
                <th className="py-2.5 pr-4 font-medium">Capability</th>
                <th className="py-2.5 px-4 font-medium text-amber-400">Operator</th>
                <th className="py-2.5 px-4 font-medium text-blue-400">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[
                { cap: "View Dashboard, Score, Reports & Audit Log", op: true, viewer: true },
                { cap: "Review Mismatches & Run AI Investigator", op: true, viewer: false },
                { cap: "Approve or Reject Sync Proposals", op: true, viewer: false },
                { cap: "Apply Updates to Platforms & Run Verification", op: true, viewer: false },
                { cap: "Edit Canonical Business Profile & Schedules", op: true, viewer: false },
                { cap: "Manage Users & Assign Roles", op: true, viewer: false },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-4 font-medium text-neutral-300">{row.cap}</td>
                  <td className="py-2.5 px-4 text-amber-400">{row.op ? "✓ Allowed" : "— Read Only"}</td>
                  <td className="py-2.5 px-4 text-blue-400">{row.viewer ? "✓ Allowed" : "— Forbidden"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users List */}
      <div className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Active Workspace Users</h2>
            <p className={`text-xs ${muted}`}>
              {isOperator ? "You can change user roles below." : "Viewing only (Operator required to alter user roles)."}
            </p>
          </div>
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />}
        </div>

        <div className="divide-y divide-[var(--border)]">
          {users.map((u) => {
            const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.OPERATOR;
            const Icon = config.icon;
            const isMe = u.email === currentUser?.email;

            return (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                <div className="flex items-start gap-3">
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", config.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-200">{u.name || u.email}</span>
                      {isMe && (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-neutral-400">You</span>
                      )}
                    </div>
                    <p className={`text-xs ${muted}`}>{u.email}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-500">{config.desc}</p>
                  </div>
                </div>

                {/* Role select dropdown / badge */}
                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                  {isOperator ? (
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className={cn(
                        "rounded-lg border border-[var(--border)] bg-black/60 px-3 py-1.5 text-xs font-medium text-neutral-200 outline-none transition-colors",
                        focus
                      )}
                    >
                      <option value="OPERATOR">Operator (Approvals & Sync)</option>
                      <option value="VIEWER">Viewer (Read-Only)</option>
                    </select>
                  ) : (
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", config.tone)}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
