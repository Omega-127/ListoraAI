import { useState, useEffect, type CSSProperties } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  CheckSquare,
  FileText,
  Gauge,
  ScrollText,
  BellRing,
  Users as UsersIcon,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
  UserCheck,
  Eye,
} from "lucide-react";
import * as Sidebar from "@animate-ui/react/primitives/sidebar";
import { Bell } from "../animate-ui/icons/bell";
import { cn } from "../../lib/cn";
import { focus, muted } from "../../lib/styles";
import { getStoredUser, logout, type UserRole, type UserProfile } from "../../lib/api";

const NAV: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound },
  { to: "/dashboard/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/dashboard/report", label: "Report", icon: FileText },
  { to: "/dashboard/score", label: "Score", icon: Gauge },
  { to: "/dashboard/audit", label: "Audit", icon: ScrollText },
  { to: "/dashboard/alerts", label: "Alerts", icon: BellRing },
  { to: "/dashboard/users", label: "Users & Roles", icon: UsersIcon },
];

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
        <ShieldCheck className="h-3 w-3" />
        Admin
      </span>
    );
  }
  if (role === "OPERATOR") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
        <UserCheck className="h-3 w-3" />
        Operator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
      <Eye className="h-3 w-3" />
      Viewer
    </span>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Dashboard">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          data-sidebar="menu-button"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "text-[var(--foreground)]" : muted,
              !isActive && "hover:text-[var(--foreground)]",
              focus,
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const activeRole: UserRole = user?.role || "ADMIN";

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        <Link to="/" className={cn("text-base font-semibold tracking-tight", focus)}>
          ListoraAI
        </Link>
        <RoleBadge role={activeRole} />
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <p className={cn("mb-2 px-5 text-[11px] font-medium uppercase tracking-wider", muted)}>
          Workspace
        </p>
        <NavItems onNavigate={onNavigate} />
      </div>

      {/* User profile & Logout */}
      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-200 truncate">{user?.name || "Active Session"}</p>
            <p className={`text-[11px] truncate ${muted}`}>{user?.email || "admin@listora.ai"}</p>
          </div>
          <RoleBadge role={activeRole} />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            muted,
            "hover:text-[var(--foreground)] hover:bg-white/5",
            focus,
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          <span>Log out</span>
        </button>
      </div>
    </>
  );
}

function DesktopSidebar() {
  const { isMobile, openMobile, setOpenMobile } = Sidebar.useSidebar();

  if (isMobile) {
    if (!openMobile) return null;
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <button
          type="button"
          aria-label="Close menu"
          className="absolute inset-0 bg-black/60"
          onClick={() => setOpenMobile(false)}
        />
        <Sidebar.Highlight className="relative flex h-full w-[18rem] flex-col border-r border-[var(--border)] bg-[#0d0d0d]">
          <SidebarBody onNavigate={() => setOpenMobile(false)} />
        </Sidebar.Highlight>
      </div>
    );
  }

  return (
    <>
      <Sidebar.Gap className="relative hidden w-[var(--sidebar-width)] bg-transparent md:block" />
      <Sidebar.Container className="fixed inset-y-0 left-0 z-30 hidden h-svh w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[#0d0d0d] md:flex md:flex-col">
        <Sidebar.Highlight className="flex h-full w-full flex-col">
          <SidebarBody />
        </Sidebar.Highlight>
      </Sidebar.Container>
    </>
  );
}

function ShellChrome() {
  const { toggleSidebar, isMobile, openMobile } = Sidebar.useSidebar();
  const [user] = useState<UserProfile | null>(getStoredUser());
  const activeRole: UserRole = user?.role || "ADMIN";

  return (
    <>
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/90 px-4 backdrop-blur-sm md:px-6">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isMobile ? (openMobile ? "Close sidebar" : "Open sidebar") : "Toggle sidebar"}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] hover:bg-white/5",
              focus,
            )}
          >
            <Sidebar.TriggerIcon
              open={<PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />}
              closed={<PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />}
            />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <Link to="/dashboard/users" className="hover:opacity-80 transition-opacity">
              <RoleBadge role={activeRole} />
            </Link>

            <NavLink
              to="/dashboard/alerts"
              className={cn(
                "relative grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] hover:bg-white/5",
                focus,
              )}
              aria-label="Alerts"
            >
              <Bell size={16} animateOnHover />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            </NavLink>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default function DashboardShell() {
  return (
    <div className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_0%_0%,rgba(255,255,255,0.05),transparent_55%)]"
      />
      <Sidebar.Provider
        defaultOpen
        className="relative flex min-h-svh w-full"
        style={
          {
            "--sidebar-width": "15.5rem",
            "--sidebar-width-icon": "3.25rem",
          } as CSSProperties
        }
      >
        <ShellChrome />
      </Sidebar.Provider>
    </div>
  );
}
