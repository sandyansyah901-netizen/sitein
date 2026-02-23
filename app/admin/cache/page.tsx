"use client";

import { useEffect, useState } from "react";
import {
  fetchCacheStats,
  adminCacheCleanup,
  adminClearChapterCache,
  adminClearMangaCache,
  type CacheStats,
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

export default function AdminCachePage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [chapterId, setChapterId] = useState("");
  const [mangaId, setMangaId] = useState("");
  const [isClearingChapter, setIsClearingChapter] = useState(false);
  const [isClearingManga, setIsClearingManga] = useState(false);
  const [messages, setMessages] = useState<{ type: "ok" | "err"; text: string }[]>([]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCacheStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const addMsg = (type: "ok" | "err", text: string) => {
    setMessages((prev) => [{ type, text }, ...prev].slice(0, 5));
  };

  const handleCleanup = async () => {
    if (!confirm("Jalankan cleanup cache expired?")) return;
    setIsCleaning(true);
    try {
      const res = await adminCacheCleanup();
      addMsg("ok", `✅ Cleanup selesai: ${JSON.stringify(res)}`);
      await loadStats();
    } catch (e) {
      addMsg("err", `❌ ${e instanceof Error ? e.message : "Gagal"}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleClearChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterId) return;
    setIsClearingChapter(true);
    try {
      await adminClearChapterCache(Number(chapterId));
      addMsg("ok", `✅ Cache chapter #${chapterId} dihapus`);
      setChapterId("");
      await loadStats();
    } catch (ex) {
      addMsg("err", `❌ ${ex instanceof Error ? ex.message : "Gagal"}`);
    } finally {
      setIsClearingChapter(false);
    }
  };

  const handleClearManga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mangaId) return;
    setIsClearingManga(true);
    try {
      await adminClearMangaCache(Number(mangaId));
      addMsg("ok", `✅ Cache manga #${mangaId} dihapus`);
      setMangaId("");
      await loadStats();
    } catch (ex) {
      addMsg("err", `❌ ${ex instanceof Error ? ex.message : "Gagal"}`);
    } finally {
      setIsClearingManga(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cache Management</h1>
          <p className="mt-1 text-sm text-muted">Monitor dan bersihkan cache sistem</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStats}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent">
            🔄 Refresh
          </button>
          <button onClick={handleCleanup} disabled={isCleaning}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
            {isCleaning ? "Cleaning..." : "🧹 Cleanup Expired"}
          </button>
        </div>
      </div>

      {/* Activity log */}
      {messages.length > 0 && (
        <div className="mb-6 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`rounded-lg px-4 py-2.5 text-sm ${
              m.type === "ok"
                ? "border border-emerald-800/40 bg-emerald-900/20 text-emerald-400"
                : "border border-red-800/40 bg-red-900/20 text-red-400"
            }`}>
              {m.text}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Clear by Chapter */}
        <div className="rounded-xl border border-border bg-card-bg p-6">
          <h2 className="mb-1 font-semibold text-foreground">Clear Cache Chapter</h2>
          <p className="mb-4 text-xs text-muted">Hapus cache untuk satu chapter berdasarkan ID</p>
          <form onSubmit={handleClearChapter} className="space-y-3">
            <input
              type="number"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              placeholder="Chapter ID"
              min={1}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button type="submit" disabled={isClearingChapter}
              className="w-full rounded-lg border border-red-800/40 py-2.5 text-sm font-bold text-red-400 hover:bg-red-900/20 disabled:opacity-60">
              {isClearingChapter ? "Menghapus..." : "🗑️ Hapus Cache Chapter"}
            </button>
          </form>
        </div>

        {/* Clear by Manga */}
        <div className="rounded-xl border border-border bg-card-bg p-6">
          <h2 className="mb-1 font-semibold text-foreground">Clear Cache Manga</h2>
          <p className="mb-4 text-xs text-muted">Hapus semua cache untuk satu manga berdasarkan ID</p>
          <form onSubmit={handleClearManga} className="space-y-3">
            <input
              type="number"
              value={mangaId}
              onChange={(e) => setMangaId(e.target.value)}
              placeholder="Manga ID"
              min={1}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button type="submit" disabled={isClearingManga}
              className="w-full rounded-lg border border-red-800/40 py-2.5 text-sm font-bold text-red-400 hover:bg-red-900/20 disabled:opacity-60">
              {isClearingManga ? "Menghapus..." : "🗑️ Hapus Cache Manga"}
            </button>
          </form>
        </div>

        {/* Cache Stats */}
        <div className="rounded-xl border border-border bg-card-bg p-6">
          <h2 className="mb-4 font-semibold text-foreground">Statistik Cache</h2>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-border" />)}</div>
          ) : stats ? (
            <div className="overflow-auto rounded-lg bg-background p-3 text-sm font-mono">
              <JsonTree data={stats} />
            </div>
          ) : (
            <p className="text-sm text-muted">Tidak ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}