"use client";

import { useEffect, useState } from "react";
import {
  fetchRemotesHealth, fetchRemotesStats, fetchBestRemote,
  adminResetRemoteHealth,
} from "@/app/lib/admin-api";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
  );
}

export default function AdminRemotesPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [bestG1, setBestG1] = useState<unknown>(null);
  const [bestG2, setBestG2] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resetName, setResetName] = useState("");
  const [resetGroup, setResetGroup] = useState<1 | 2>(1);
  const [isResetting, setIsResetting] = useState(false);
  const [msgs, setMsgs] = useState<{ type: "ok" | "err"; text: string }[]>([]);

  const addMsg = (type: "ok" | "err", text: string) =>
    setMsgs((p) => [{ type, text }, ...p].slice(0, 5));

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.allSettled([
      fetchRemotesHealth().then((d) => setHealth(d as Record<string, unknown>)),
      fetchRemotesStats().then((d) => setStats(d as Record<string, unknown>)),
      fetchBestRemote(1).then(setBestG1),
      fetchBestRemote(2).then(setBestG2),
    ]);
    setIsLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetName.trim()) return;
    setIsResetting(true);
    try {
      const res = await adminResetRemoteHealth(resetName.trim(), resetGroup);
      addMsg("ok", `✅ Health reset untuk "${resetName}" (Group ${resetGroup}): ${JSON.stringify(res)}`);
      setResetName("");
      await loadAll();
    } catch (ex) {
      addMsg("err", `❌ ${ex instanceof Error ? ex.message : "Gagal"}`);
    } finally { setIsResetting(false); }
  };

  // Helper: flatten health data ke list remote
  const remoteEntries = health
    ? Object.entries(health as Record<string, unknown>).flatMap(([groupKey, groupVal]) => {
        if (typeof groupVal === "object" && groupVal !== null && !Array.isArray(groupVal)) {
          return Object.entries(groupVal as Record<string, unknown>).map(([name, info]) => ({
            group: groupKey, name, info: info as Record<string, unknown>,
          }));
        }
        return [{ group: groupKey, name: groupKey, info: { raw: groupVal } }];
      })
    : [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Remotes Health</h1>
          <p className="mt-1 text-sm text-muted">Monitor kesehatan semua rclone remotes</p>
        </div>
        <button onClick={loadAll} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent">
          🔄 Refresh
        </button>
      </div>

      {/* Messages */}
      {msgs.length > 0 && (
        <div className="mb-4 space-y-2">
          {msgs.map((m, i) => (
            <div key={i} className={`rounded-lg px-4 py-2.5 text-sm ${m.type === "ok" ? "border border-emerald-800/40 bg-emerald-900/20 text-emerald-400" : "border border-red-800/40 bg-red-900/20 text-red-400"}`}>
              {m.text}
            </div>
          ))}
        </div>
      )}

      {/* Best Remote Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[{ label: "Best Remote Group 1", data: bestG1 }, { label: "Best Remote Group 2", data: bestG2 }].map(({ label, data }) => (
          <div key={label} className="rounded-xl border border-border bg-card-bg p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <h3 className="font-semibold text-foreground">{label}</h3>
            </div>
            {isLoading ? <div className="h-8 animate-pulse rounded bg-border" /> :
              data ? (
                <div className="font-mono text-sm">
                  {typeof data === "object"
                    ? Object.entries(data as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-purple-400">{k}:</span>
                          <span className="text-foreground">{String(v)}</span>
                        </div>
                      ))
                    : <span className="text-foreground">{String(data)}</span>}
                </div>
              ) : <p className="text-sm text-muted">Tidak ada data</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Reset form */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card-bg p-5">
            <h2 className="mb-1 font-semibold text-foreground">Reset Remote Health</h2>
            <p className="mb-4 text-xs text-muted">Manual reset health status untuk remote tertentu</p>
            <form onSubmit={handleReset} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Remote Name</label>
                <input type="text" value={resetName} onChange={(e) => setResetName(e.target.value)}
                  placeholder="contoh: gdrive1" required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Group</label>
                <div className="flex overflow-hidden rounded-lg border border-border">
                  {([1, 2] as const).map((g) => (
                    <button key={g} type="button" onClick={() => setResetGroup(g)}
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${resetGroup === g ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
                      Group {g}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={isResetting}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
                {isResetting ? "Resetting..." : "⚡ Reset Health"}
              </button>
            </form>
          </div>
        </div>

        {/* Health Table */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-foreground">
                Health Status
                <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-xs text-muted">{remoteEntries.length} remotes</span>
              </h2>
            </div>
            {isLoading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-border" />)}</div>
            ) : remoteEntries.length === 0 ? (
              <div className="p-6">
                {/* Fallback: tampilkan raw JSON */}
                {health ? (
                  <div className="overflow-auto rounded-lg bg-background p-4 text-sm font-mono text-muted">
                    <pre>{JSON.stringify(health, null, 2)}</pre>
                  </div>
                ) : <p className="text-sm text-muted text-center py-6">Tidak ada data</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      {["Remote", "Group", "Status", "Info"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {remoteEntries.map(({ group, name, info }) => {
                      const isHealthy = info?.healthy === true || info?.status === "ok" || info?.is_healthy === true;
                      return (
                        <tr key={`${group}-${name}`} className="hover:bg-background/30">
                          <td className="px-4 py-3 font-mono text-sm text-foreground">{name}</td>
                          <td className="px-4 py-3 text-xs text-muted">{group}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <StatusDot ok={isHealthy} />
                              <span className={`text-xs font-medium ${isHealthy ? "text-emerald-400" : "text-red-400"}`}>
                                {isHealthy ? "Healthy" : "Unhealthy"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted font-mono">
                            {Object.entries(info ?? {})
                              .filter(([k]) => !["healthy", "status", "is_healthy"].includes(k))
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-4 rounded-xl border border-border bg-card-bg">
              <div className="border-b border-border px-5 py-4"><h2 className="font-semibold text-foreground">Remote Statistics</h2></div>
              <div className="overflow-auto p-5">
                <pre className="text-xs font-mono text-muted whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}