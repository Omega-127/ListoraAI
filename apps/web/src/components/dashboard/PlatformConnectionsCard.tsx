import { useState } from "react";
import {
  Globe,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Lock,
  RefreshCw,
  Radio,
} from "lucide-react";
import {
  type PlatformConnection,
  type ConnectPlatformPayload,
  connectPlatform,
  testPlatformConnection,
  disconnectPlatform,
  getStoredUser,
} from "../../lib/api";
import { cn } from "../../lib/cn";
import { focus, muted } from "../../lib/styles";

interface PlatformConnectionsCardProps {
  platforms: PlatformConnection[];
  onPlatformsChange: (updated: PlatformConnection[]) => void;
  onRefreshListings?: () => void;
}

export function PlatformConnectionsCard({
  platforms,
  onPlatformsChange,
  onRefreshListings,
}: PlatformConnectionsCardProps) {
  const [activeModalPlatform, setActiveModalPlatform] = useState<PlatformConnection | null>(null);
  const [selectedMode, setSelectedMode] = useState<"DEMO" | "LIVE">("DEMO");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [locationId, setLocationId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const currentUser = getStoredUser();
  const isViewer = currentUser?.role === "VIEWER";

  const openConfigure = (platform: PlatformConnection) => {
    setActiveModalPlatform(platform);
    setSelectedMode(platform.mode);
    setClientId(platform.config?.clientId || "");
    setLocationId(platform.config?.locationId || "");
    setMerchantId(platform.config?.merchantId || "");
    setClientSecret("");
    setApiKey("");
    setStatusMessage(null);
  };

  const handleSaveConnection = async () => {
    if (!activeModalPlatform || isViewer) return;
    setSubmitting(true);
    setStatusMessage(null);

    const payload: ConnectPlatformPayload = {
      mode: selectedMode,
      clientId: clientId.trim() || undefined,
      clientSecret: clientSecret.trim() || undefined,
      locationId: locationId.trim() || undefined,
      merchantId: merchantId.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
    };

    try {
      const res = await connectPlatform(activeModalPlatform.id, payload);
      const updatedList = platforms.map((p) => (p.id === activeModalPlatform.id ? res.connection : p));
      onPlatformsChange(updatedList);
      setStatusMessage({
        type: res.connection.status === "CONNECTION_FAILED" ? "error" : "success",
        text: res.message,
      });

      if (res.connection.status !== "CONNECTION_FAILED") {
        setTimeout(() => {
          setActiveModalPlatform(null);
          onRefreshListings?.();
        }, 1200);
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update connection",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (isViewer) return;
    setSubmitting(true);
    try {
      const res = await disconnectPlatform(platformId);
      const updatedList = platforms.map((p) => (p.id === platformId ? res.connection : p));
      onPlatformsChange(updatedList);
      setActiveModalPlatform(null);
      onRefreshListings?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTest = async (platformId: string) => {
    setTestingId(platformId);
    try {
      const res = await testPlatformConnection(platformId);
      const updatedList = platforms.map((p) =>
        p.id === platformId ? { ...p, status: res.status, lastTestedAt: new Date().toISOString() } : p
      );
      onPlatformsChange(updatedList);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--primary)]" />
            Platform Connections & Synchronization
          </h2>
          <p className={`mt-0.5 text-xs ${muted}`}>
            Manage multi-platform listing adapters across Google Maps, Mappls, and Justdial.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            3 Probes Active
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {platforms.map((conn) => {
          const isConnected = conn.status === "CONNECTED";
          const isDemo = conn.status === "DEMO_MODE";
          const isFailed = conn.status === "CONNECTION_FAILED";
          const isNotConnected = conn.status === "NOT_CONNECTED";

          return (
            <div
              key={conn.id}
              className="relative flex flex-col justify-between rounded-lg border border-[var(--border)] bg-black/5 dark:bg-white/[0.02] p-3.5 space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold truncate text-[var(--foreground)]">{conn.name}</h3>
                    <p className={`text-[10px] mt-0.5 ${muted}`}>
                      {conn.capabilities.isOfficialApi ? "Official Platform Adapter" : "Custom Connector"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase shrink-0 border",
                      isConnected && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      isDemo && "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
                      isFailed && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                      isNotConnected && "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                    )}
                  >
                    {isConnected && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {isDemo && <Radio className="h-2.5 w-2.5" />}
                    {isFailed && <XCircle className="h-2.5 w-2.5" />}
                    {isNotConnected && <AlertTriangle className="h-2.5 w-2.5" />}
                    {conn.status.replace("_", " ")}
                  </span>
                </div>

                {/* Capability note */}
                <div className="mt-2.5 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Write Permissions:</span>
                    <span
                      className={cn(
                        "font-medium",
                        conn.canWrite ? "text-emerald-400" : "text-amber-400"
                      )}
                    >
                      {conn.canWrite ? "Direct API Write" : "Read-Only (Public Tier)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Data Source:</span>
                    <span className="font-mono text-neutral-300">
                      {conn.mode === "LIVE" ? "Live External API" : "Simulated Mock Server"}
                    </span>
                  </div>
                </div>

                <p className={`mt-2 text-[10px] leading-relaxed line-clamp-2 ${muted}`}>
                  {conn.policyNotes}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => openConfigure(conn)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white/5 px-2.5 py-1 text-xs font-medium hover:bg-white/10 transition-colors",
                    focus
                  )}
                >
                  <Settings2 className="h-3 w-3 text-neutral-400" />
                  Configure
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickTest(conn.id)}
                  disabled={testingId === conn.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors",
                    focus
                  )}
                  title="Ping connector health"
                >
                  <RefreshCw className={cn("h-3 w-3", testingId === conn.id && "animate-spin")} />
                  {testingId === conn.id ? "Pinging…" : "Probe"}
                </button>

                {conn.capabilities.manualPortalUrl && (
                  <a
                    href={conn.capabilities.manualPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-neutral-500 hover:text-neutral-300 p-1 transition-colors"
                    title={`Open ${conn.name} portal`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {activeModalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[#121212] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-semibold">{activeModalPlatform.name}</h3>
                <p className={`text-xs mt-0.5 ${muted}`}>Configure listing synchronization and API authentication</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalPlatform(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Connection Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode("DEMO")}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors",
                    selectedMode === "DEMO"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : "border-[var(--border)] bg-white/[0.02] text-neutral-400 hover:bg-white/5"
                  )}
                >
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-amber-400" />
                    Demo Mode (Mock)
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-1">
                    Safe local simulation with realistic permissions & holiday restrictions.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode("LIVE")}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors",
                    selectedMode === "LIVE"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-[var(--border)] bg-white/[0.02] text-neutral-400 hover:bg-white/5"
                  )}
                >
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Live API Connection
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-1">
                    Connect official platform REST API using verified merchant credentials.
                  </span>
                </button>
              </div>
            </div>

            {/* Platform specific fields when LIVE is chosen */}
            {selectedMode === "LIVE" && (
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                {activeModalPlatform.id === "googleMaps" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">Google Cloud Client ID</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="apps.googleusercontent.com"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">Google Business Profile Location ID</label>
                      <input
                        type="text"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        placeholder="locations/12345678901234567890"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">Client Secret / OAuth Token</label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                  </>
                )}

                {activeModalPlatform.id === "mappls" && (
                  <>
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                      <strong>Platform Note:</strong> Mappls official public API documentation specifies that listing modification endpoints are restricted to enterprise partner agreements. Standard API keys operate in Read-Only mode.
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">Mappls REST API Client ID</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="33OkryzDHs..."
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">Mappls Client Secret</label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                  </>
                )}

                {activeModalPlatform.id === "justdial" && (
                  <>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2.5 text-[11px] text-blue-300">
                      <strong>Platform Note:</strong> Justdial automated mutations are available via JD Verified Merchant / JD Omni integration. Policy blocks holiday schedule modification on public holiday dates.
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">Verified Merchant ID</label>
                      <input
                        type="text"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        placeholder="JD-M-889104"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300">JD Omni API Secret / Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/50 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-400"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {statusMessage && (
              <div
                className={cn(
                  "rounded-lg p-2.5 text-xs border",
                  statusMessage.type === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
                  statusMessage.type === "error" && "border-rose-500/20 bg-rose-500/10 text-rose-300",
                  statusMessage.type === "info" && "border-blue-500/20 bg-blue-500/10 text-blue-300"
                )}
              >
                {statusMessage.text}
              </div>
            )}

            {isViewer && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Viewer mode is read-only. Business Owner (Operator) role required to modify connections.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => handleDisconnect(activeModalPlatform.id)}
                disabled={submitting || isViewer}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline disabled:opacity-50"
              >
                Disconnect Platform
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalPlatform(null)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnection}
                  disabled={submitting || isViewer}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
                >
                  {submitting ? "Saving…" : "Save Connection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
