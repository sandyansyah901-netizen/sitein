"use client";

import { useEffect, useState } from "react";
import {
  fetchGroupsStatus,
  fetchGroupsQuota,
  adminSwitchGroup,
  fetchAdminStorage,
  adminTestStorage,
  adminToggleStorageStatus,
  fetchGdriveUsage,
  type GroupsStatus,
  type GroupsQuota,
  type GroupQuotaItem,
  type GroupStatusItem,
  type StorageSource,
  type StorageTestResult,
  type GdriveUsageResult,
  type GdriveRemoteUsage,
} from "@/app/lib/admin-api";

function JsonTree({ data }: { data: unknown }) {
  if (data === null || data === undefined) return <span className="text-muted">null</span>;
  if (typeof data === "boolean") return <span className={data ? "text-emerald-400" : "text-red-400"}>{String(data)}</span>;
  if (typeof data === "number") return <span className="text-blue-400">{data}</span>;
  if (typeof data === "string") return <span className="text-amber-300">"{data}"</span>;
  if (Array.isArray(data)) return (
    <span className="text-muted">
      [{data.map((v, i) => <span key={i}><JsonTree data={v} />{i < data.length - 1 ? ", " : ""}</span>)}]
    </span>
  );
  if (typeof data === "object") {
    return (
      <div className="ml-4 border-l border-border pl-3 space-y-0.5">
        {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex items-start gap-1.5 text-sm">
            <span className="shrink-0 font-mono text-purple-400">{k}:</span>
            <JsonTree data={v} />
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-foreground">{JSON.stringify(data)}</span>;
}

// ── QuotaBar ─────────────────────────────────────────────────────────────────
function QuotaBar({ item }: { item: GroupQuotaItem }) {
  const pct = item.quota_gb > 0 ? Math.min((item.uploaded_gb / item.quota_gb) * 100, 100) : 0;
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          Group {item.group}
          {item.prefix && (
            <span className="ml-1.5 rounded bg-border px-1.5 py-0.5 font-mono text-[10px] text-muted">{item.prefix}</span>
          )}
          <span className="ml-1.5 font-mono text-[10px] text-muted">{item.primary}</span>
        </span>
        <span className={`text-[11px] font-semibold ${item.is_full ? "text-red-400" : "text-muted"}`}>
          {item.is_full ? "⚠️ Full" : `${item.uploaded_gb.toFixed(1)} GB uploaded (sesi ini)`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── GDrive Usage Bar (real usage) ────────────────────────────────────────────
function GdriveUsageBar({ item }: { item: GdriveRemoteUsage }) {
  const pct = item.total_gb > 0 ? Math.min((item.used_gb / item.total_gb) * 100, 100) : 0;
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-blue-500";
  return (
    <div className={`rounded-lg border p-3 ${item.error ? "border-yellow-800/40 bg-yellow-900/10" : "border-border bg-background/50"}`}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground font-mono">{item.remote}
          <span className="ml-1.5 text-[10px] text-muted font-sans">Group {item.group}</span>
        </span>
        {item.error ? (
          <span className="text-[10px] text-yellow-400">⚠️ Error</span>
        ) : (
          <span className="text-[11px] text-muted">
            {item.used_gb.toFixed(1)} / {item.total_gb.toFixed(0)} GB ({pct.toFixed(1)}%)
          </span>
        )}
      </div>
      {item.error ? (
        <p className="text-[10px] text-yellow-400 truncate">{item.error}</p>
      ) : (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>Free: {item.free_gb.toFixed(1)} GB</span>
            {item.trashed_gb !== undefined && item.trashed_gb > 0 && (
              <span>Trash: {item.trashed_gb.toFixed(1)} GB</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── GroupCard ─────────────────────────────────────────────────────────────────
function GroupCard({ item, isActive }: { item: GroupStatusItem; isActive: boolean }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${isActive ? "border-accent bg-accent/5" : "border-border bg-card-bg"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">Group {item.group}</span>
        <div className="flex items-center gap-1.5">
          {isActive && <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">● ACTIVE</span>}
          {item.path_prefix && item.path_prefix !== "none (normal path)" && (
            <span className="rounded bg-border px-1.5 py-0.5 font-mono text-[10px] text-muted">{item.path_prefix}</span>
          )}
        </div>
      </div>
      <div className="space-y-0.5 text-xs text-muted">
        <p><span className="text-foreground/70">Primary:</span> <span className="font-mono text-accent">{item.primary}</span></p>
        {item.backups.length > 0 && (
          <p><span className="text-foreground/70">Backup:</span> <span className="font-mono">{item.backups.join(", ")}</span></p>
        )}
        <p><span className="text-foreground/70">Quota:</span> {item.quota_gb} GB</p>
      </div>
    </div>
  );
}

function getSourceName(src: StorageSource): string {
  return (src.source_name ?? src.name ?? src.remote_name ?? `Storage ${src.id}`) as string;
}

export default function AdminStoragePage() {
  const [sources, setSources] = useState<StorageSource[]>([]);
  const [status, setStatus] = useState<GroupsStatus | null>(null);
  const [quota, setQuota] = useState<GroupsQuota | null>(null);
  const [gdriveUsage, setGdriveUsage] = useState<GdriveUsageResult | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [isLoadingGdrive, setIsLoadingGdrive] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [quotaError, setQuotaError] = useState("");
  const [gdriveError, setGdriveError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<number>(1);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, StorageTestResult & { ok: boolean }>>({});
  const [error, setError] = useState("");
  const [switchMsg, setSwitchMsg] = useState("");

  const loadAll = () => {
    setIsLoadingSources(true);
    setIsLoadingStatus(true);
    setIsLoadingQuota(true);
    setStatusError("");
    setQuotaError("");

    fetchAdminStorage()
      .then((d) => setSources(Array.isArray(d) ? d : []))
      .catch(() => setSources([]))
      .finally(() => setIsLoadingSources(false));

    fetchGroupsStatus()
      .then((s) => {
        setStatus(s);
        if (s.active_upload_group) setSwitchTarget(s.active_upload_group);
      })
      .catch((e) => setStatusError(e instanceof Error ? e.message : "Gagal memuat status"))
      .finally(() => setIsLoadingStatus(false));

    fetchGroupsQuota()
      .then(setQuota)
      .catch((e) => setQuotaError(e instanceof Error ? e.message : "Gagal memuat quota"))
      .finally(() => setIsLoadingQuota(false));
  };

  const handleRefreshGdriveUsage = async () => {
    setIsLoadingGdrive(true);
    setGdriveError("");
    try {
      const data = await fetchGdriveUsage();
      setGdriveUsage(data);
    } catch (e) {
      setGdriveError(e instanceof Error ? e.message : "Gagal memuat GDrive usage");
    } finally {
      setIsLoadingGdrive(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSwitch = async () => {
    if (!confirm(`Switch active upload group ke Group ${switchTarget}?`)) return;
    setError(""); setSwitchMsg("");
    setIsSwitching(true);
    try {
      await adminSwitchGroup(switchTarget);
      setSwitchMsg(`✅ Berhasil switch ke Group ${switchTarget}`);
      loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Switch gagal");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await adminTestStorage(id);
      setTestResults((prev) => ({ ...prev, [id]: { ...result, ok: result.success } }));
    } catch (e) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { ok: false, success: false, storage_id: id, status: "error", error: e instanceof Error ? e.message : "Gagal" },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (source: StorageSource) => {
    const currentStatus = source.status ?? (source.is_active ? "active" : "suspended");
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    setTogglingId(source.id);
    try {
      await adminToggleStorageStatus(source.id, newStatus as "active" | "suspended");
      loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const configuredGroups = status?.configured_groups ?? [];
  const activeGroup = status?.active_upload_group ?? null;
  const groupsMap = status?.groups ?? {};
  const daemonHealth = status?.daemon_health;
  const quotaGroups = status?.quota?.groups ?? quota?.quota_tracker?.groups ?? {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Storage Management</h1>
        <p className="mt-1 text-sm text-muted">Monitor dan kontrol Google Drive storage</p>
      </div>

      {/* ── Group Overview Cards ──────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoadingStatus ? (
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-border" />)
        ) : statusError ? (
          <div className="col-span-full rounded-xl border border-yellow-800/40 bg-yellow-900/10 px-4 py-3 text-sm text-yellow-400">
            ⚠️ Groups status tidak tersedia — {statusError}
            <button onClick={loadAll} className="ml-3 underline hover:no-underline">Coba lagi</button>
          </div>
        ) : configuredGroups.length > 0 ? (
          configuredGroups.map((g) => {
            const groupInfo = groupsMap[String(g)];
            if (!groupInfo) return null;
            return <GroupCard key={g} item={groupInfo} isActive={g === activeGroup} />;
          })
        ) : (
          <div className="col-span-full rounded-xl border border-border bg-card-bg px-4 py-6 text-center text-sm text-muted">
            Tidak ada configured groups
          </div>
        )}
      </div>

      {/* ── Daemon Health (dari groups/status) ───────────────────────────── */}
      {daemonHealth && Object.keys(daemonHealth.daemons ?? {}).length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card-bg p-6">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-semibold text-foreground">Daemon Health</h2>
            {daemonHealth.group1_daemons_ready !== undefined && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${daemonHealth.group1_daemons_ready === daemonHealth.group1_daemons_total ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                {daemonHealth.group1_daemons_ready}/{daemonHealth.group1_daemons_total} ready
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(daemonHealth.daemons).map(([remote, d]) => (
              <div key={remote} className={`rounded-lg border px-3 py-2 text-xs ${d.ready ? "border-emerald-800/40 bg-emerald-900/10" : d.alive ? "border-yellow-800/40 bg-yellow-900/10" : "border-red-800/40 bg-red-900/10"}`}>
                <p className="font-mono font-semibold text-foreground">{remote}</p>
                <p className={`mt-0.5 ${d.ready ? "text-emerald-400" : d.alive ? "text-yellow-400" : "text-red-400"}`}>
                  {d.ready ? "✅ ready" : d.alive ? "⏳ starting" : "❌ down"}
                </p>
                {d.port && <p className="text-muted">:{d.port}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Manual Switch Active Group ────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-card-bg p-6">
        <h2 className="mb-1 font-semibold text-foreground">Manual Switch Active Group</h2>
        <p className="mb-4 text-sm text-muted">
          Active sekarang:{" "}
          <span className="font-semibold text-foreground">
            {isLoadingStatus ? (
              <span className="inline-block h-4 w-16 animate-pulse rounded bg-border align-middle" />
            ) : activeGroup ? (
              <>
                Group {activeGroup}
                {groupsMap[String(activeGroup)] && (
                  <span className="ml-1 text-muted">({groupsMap[String(activeGroup)].primary})</span>
                )}
              </>
            ) : (
              <span className="text-muted">Tidak ada data</span>
            )}
          </span>
        </p>

        {error && <div className="mb-3 rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">⚠️ {error}</div>}
        {switchMsg && <div className="mb-3 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">{switchMsg}</div>}

        <div className="flex flex-wrap items-center gap-3">
          {configuredGroups.length > 0 ? (
            <div className="flex overflow-hidden rounded-lg border border-border">
              {configuredGroups.map((g) => {
                const info = groupsMap[String(g)];
                return (
                  <button
                    key={g}
                    onClick={() => setSwitchTarget(g)}
                    title={info ? `${info.primary}${info.path_prefix !== "none (normal path)" ? ` — prefix ${info.path_prefix}` : ""}` : `Group ${g}`}
                    className={`px-5 py-2 text-sm font-semibold transition-colors ${switchTarget === g ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
                  >
                    Group {g}
                    {g === activeGroup && <span className="ml-1 text-[10px] opacity-70">●</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={switchTarget}
                onChange={(e) => setSwitchTarget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
              <span className="text-xs text-muted">Group number</span>
            </div>
          )}

          <button
            onClick={handleSwitch}
            disabled={isSwitching || (configuredGroups.length > 0 && switchTarget === activeGroup)}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {isSwitching
              ? "Switching..."
              : configuredGroups.length > 0 && switchTarget === activeGroup
                ? `✅ Group ${switchTarget} Aktif`
                : `⚡ Switch ke Group ${switchTarget}`}
          </button>
          <button onClick={loadAll} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Upload Quota Tracker (in-memory) ─────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-card-bg p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Upload Quota Tracker</h2>
            <p className="text-[10px] text-muted">In-memory counter — reset setiap restart server</p>
          </div>
          {status?.auto_switch_enabled && (
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">Auto-Switch ON</span>
          )}
        </div>
        {isLoadingStatus || isLoadingQuota ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-border" />)}</div>
        ) : statusError && quotaError ? (
          <div className="rounded-lg border border-yellow-800/40 bg-yellow-900/10 px-3 py-2 text-sm text-yellow-400">⚠️ Quota tidak tersedia</div>
        ) : Object.keys(quotaGroups).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(quotaGroups).map(([key, item]) => (
              <QuotaBar key={key} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Tidak ada data quota</p>
        )}
      </div>

      {/* ── Real GDrive Usage ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-card-bg p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Real GDrive Usage</h2>
            <p className="text-[10px] text-muted">
              {gdriveUsage
                ? `Terakhir refresh: ${new Date(gdriveUsage.fetched_at).toLocaleTimeString("id-ID")} · ${gdriveUsage.total_remotes_queried} remote`
                : "Data aktual dari rclone about (~1-3 detik)"}
            </p>
          </div>
          <button
            onClick={handleRefreshGdriveUsage}
            disabled={isLoadingGdrive}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {isLoadingGdrive ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Checking...
              </>
            ) : "📊 Refresh Usage"}
          </button>
        </div>

        {gdriveError && (
          <div className="mb-3 rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">⚠️ {gdriveError}</div>
        )}

        {!gdriveUsage && !isLoadingGdrive && !gdriveError ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
            Klik <span className="font-semibold">Refresh Usage</span> untuk melihat penggunaan GDrive aktual
          </div>
        ) : isLoadingGdrive ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-border" />)}</div>
        ) : gdriveUsage ? (
          <div className="space-y-4">
            {Object.entries(gdriveUsage.groups).map(([key, grp]) => (
              <div key={key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Group {grp.group}</span>
                  <span className="text-[10px] text-muted">
                    Total: {grp.total_used_gb.toFixed(1)} GB used / {grp.total_capacity_gb.toFixed(0)} GB
                  </span>
                </div>
                <div className="space-y-2">
                  {grp.remotes.map((r) => <GdriveUsageBar key={r.remote} item={r} />)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Storage Sources Table ─────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Storage Sources
            <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-xs text-muted">{sources.length}</span>
          </h2>
        </div>
        {isLoadingSources ? (
          <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-border" />)}</div>
        ) : sources.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Tidak ada storage source</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Manga</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Test Result</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((src) => {
                  const isActive = src.status === "active" || src.is_active === true;
                  const testResult = testResults[src.id];
                  const totalManga = src.total_manga ?? src.manga_count;
                  return (
                    <tr key={src.id} className="hover:bg-background/30">
                      <td className="px-4 py-3 text-muted">#{src.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{getSourceName(src)}</p>
                        {(src.base_folder_id ?? src.base_path) && (
                          <p className="font-mono text-[10px] text-muted">{(src.base_folder_id ?? src.base_path) as string}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {totalManga !== undefined ? `${totalManga} manga${src.total_chapters ? ` / ${src.total_chapters} ch` : ""}` : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {testResult ? (
                          <div className="space-y-0.5">
                            <span className={`text-xs font-semibold ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                              {testResult.ok
                                ? `✅ ${testResult.healthy_remotes ?? "?"}/${testResult.total_remotes ?? "?"} remotes OK`
                                : `❌ ${testResult.error ?? testResult.status}`}
                            </span>
                            {/* Per-remote daemon status */}
                            {testResult.remotes_status && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(testResult.remotes_status).map(([name, rs]) => (
                                  <span key={name} className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${rs.ready ? "bg-emerald-900/30 text-emerald-400" : rs.alive ? "bg-yellow-900/30 text-yellow-400" : "bg-red-900/30 text-red-400"}`}>
                                    {name}: {rs.status}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTest(src.id)}
                            disabled={testingId === src.id}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            {testingId === src.id ? "Testing..." : "Test"}
                          </button>
                          <button
                            onClick={() => handleToggle(src)}
                            disabled={togglingId === src.id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${isActive
                                ? "border border-yellow-800/40 text-yellow-400 hover:bg-yellow-900/20"
                                : "border border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/20"
                              }`}
                          >
                            {togglingId === src.id ? "..." : isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Raw JSON Debug ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card-bg">
          <div className="border-b border-border px-6 py-4"><h2 className="font-semibold text-foreground">Groups Status (raw)</h2></div>
          <div className="p-6">
            {isLoadingStatus ? <div className="h-40 animate-pulse rounded-lg bg-border" /> :
              statusError ? <p className="text-sm text-yellow-400">⚠️ {statusError}</p> :
                status ? <div className="overflow-auto rounded-lg bg-background p-4 text-sm font-mono max-h-64"><JsonTree data={status} /></div> :
                  <p className="text-sm text-muted">Tidak ada data</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card-bg">
          <div className="border-b border-border px-6 py-4"><h2 className="font-semibold text-foreground">Groups Quota (raw)</h2></div>
          <div className="p-6">
            {isLoadingQuota ? <div className="h-40 animate-pulse rounded-lg bg-border" /> :
              quotaError ? <p className="text-sm text-yellow-400">⚠️ {quotaError}</p> :
                quota ? <div className="overflow-auto rounded-lg bg-background p-4 text-sm font-mono max-h-64"><JsonTree data={quota} /></div> :
                  <p className="text-sm text-muted">Tidak ada data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}