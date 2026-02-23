"use client";

import { useEffect, useState } from "react";
import {
  fetchGroupsStatus,
  fetchGroupsQuota,
  adminSwitchGroup,
  fetchAdminStorage,
  adminTestStorage,
  adminToggleStorageStatus,
  type GroupsStatus,
  type GroupsQuota,
  type StorageSource,
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

export default function AdminStoragePage() {
  const [sources, setSources] = useState<StorageSource[]>([]);
  const [status, setStatus] = useState<GroupsStatus | null>(null);
  const [quota, setQuota] = useState<GroupsQuota | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<1 | 2>(1);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const [error, setError] = useState("");
  const [switchMsg, setSwitchMsg] = useState("");

  const loadAll = () => {
    setIsLoadingSources(true);
    setIsLoadingStatus(true);
    setIsLoadingQuota(true);

    fetchAdminStorage()
      .then((d) => setSources(Array.isArray(d) ? d : []))
      .catch(() => setSources([]))
      .finally(() => setIsLoadingSources(false));

    fetchGroupsStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setIsLoadingStatus(false));

    fetchGroupsQuota()
      .then(setQuota)
      .catch(() => {})
      .finally(() => setIsLoadingQuota(false));
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
      setTestResults((prev) => ({ ...prev, [id]: { ok: true, msg: JSON.stringify(result) } }));
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [id]: { ok: false, msg: e instanceof Error ? e.message : "Gagal" } }));
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Storage Management</h1>
        <p className="mt-1 text-sm text-muted">Monitor dan kontrol Google Drive storage</p>
      </div>

      {/* Switch Group */}
      <div className="mb-6 rounded-xl border border-border bg-card-bg p-6">
        <h2 className="mb-1 font-semibold text-foreground">Manual Switch Active Group</h2>
        <p className="mb-4 text-sm text-muted">Group 1: gdrive~gdrive10 &nbsp;|&nbsp; Group 2: gdrive11~gdrive20</p>

        {error && <div className="mb-3 rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">⚠️ {error}</div>}
        {switchMsg && <div className="mb-3 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">{switchMsg}</div>}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-border">
            {([1, 2] as const).map((g) => (
              <button key={g} onClick={() => setSwitchTarget(g)}
                className={`px-5 py-2 text-sm font-semibold transition-colors ${switchTarget === g ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
                Group {g}
              </button>
            ))}
          </div>
          <button onClick={handleSwitch} disabled={isSwitching}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
            {isSwitching ? "Switching..." : `⚡ Switch ke Group ${switchTarget}`}
          </button>
          <button onClick={loadAll} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Storage Sources Table */}
      <div className="mb-6 rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Storage Sources
            <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-xs text-muted">{sources.length}</span>
          </h2>
        </div>
        {isLoadingSources ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-border" />)}</div>
        ) : sources.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Tidak ada storage source</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Nama / Remote</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Test Result</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((src) => {
                  const isActive = src.status === "active" || src.is_active === true;
                  const testResult = testResults[src.id];
                  return (
                    <tr key={src.id} className="hover:bg-background/30">
                      <td className="px-4 py-3 text-muted">#{src.id}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {src.name ?? src.remote_name ?? `Storage ${src.id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {testResult ? (
                          <span className={`text-xs ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                            {testResult.ok ? "✅ OK" : `❌ ${testResult.msg}`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleTest(src.id)} disabled={testingId === src.id}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50">
                            {testingId === src.id ? "Testing..." : "Test"}
                          </button>
                          <button onClick={() => handleToggle(src)} disabled={togglingId === src.id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              isActive
                                ? "border border-yellow-800/40 text-yellow-400 hover:bg-yellow-900/20"
                                : "border border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/20"
                            }`}>
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

      {/* Status & Quota */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card-bg">
          <div className="border-b border-border px-6 py-4"><h2 className="font-semibold text-foreground">Groups Status</h2></div>
          <div className="p-6">
            {isLoadingStatus ? <div className="h-40 animate-pulse rounded-lg bg-border" /> :
              status ? <div className="overflow-auto rounded-lg bg-background p-4 text-sm font-mono"><JsonTree data={status} /></div> :
              <p className="text-sm text-muted">Tidak ada data</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card-bg">
          <div className="border-b border-border px-6 py-4"><h2 className="font-semibold text-foreground">Groups Quota</h2></div>
          <div className="p-6">
            {isLoadingQuota ? <div className="h-40 animate-pulse rounded-lg bg-border" /> :
              quota ? <div className="overflow-auto rounded-lg bg-background p-4 text-sm font-mono"><JsonTree data={quota} /></div> :
              <p className="text-sm text-muted">Tidak ada data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}