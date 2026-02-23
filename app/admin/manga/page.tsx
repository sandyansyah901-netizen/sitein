"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchAdminMangaList, adminDeleteManga, adminToggleMangaStatus,
  fetchAdminStorage, type AdminManga, type StorageSource,
} from "@/app/lib/admin-api";

const STATUS_COLORS: Record<string, string> = {
  ongoing: "bg-emerald-500/10 text-emerald-400",
  completed: "bg-blue-500/10 text-blue-400",
  hiatus: "bg-yellow-500/10 text-yellow-400",
};
const TYPE_COLORS: Record<string, string> = {
  manga: "bg-blue-500/20 text-blue-400",
  manhwa: "bg-green-500/20 text-green-400",
  manhua: "bg-orange-500/20 text-orange-400",
};

export default function AdminMangaPage() {
  const [mangaList, setMangaList] = useState<AdminManga[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [storages, setStorages] = useState<StorageSource[]>([]);
  const [filterStorage, setFilterStorage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError("");
    try {
      const data = await fetchAdminMangaList({
        page, page_size: 20, search: search || undefined,
        storage_id: filterStorage ? Number(filterStorage) : undefined,
      });
      const items = data.items ?? data.manga ?? [];
      setMangaList(items);
      setTotal(data.pagination?.total ?? data.total ?? items.length);
      setTotalPages(data.pagination?.total_pages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat manga");
    } finally { setIsLoading(false); }
  }, [page, search, filterStorage]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchAdminStorage().then((d) => setStorages(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleDelete = async (manga: AdminManga) => {
    const deleteGdrive = confirm(`Hapus juga files di Google Drive?\n\nOK = Ya (hapus GDrive)\nCancel = Tidak (hapus DB saja)`);
    if (!confirm(`Yakin hapus manga "${manga.title}"? Ini akan menghapus semua chapters dan pages!`)) return;
    setDeletingId(manga.id);
    try {
      await adminDeleteManga(manga.id, deleteGdrive);
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "Gagal hapus"); }
    finally { setDeletingId(null); }
  };

  const handleToggleStatus = async (manga: AdminManga) => {
    const current = manga.status ?? "ongoing";
    const next = current === "ongoing" ? "completed" : "ongoing";
    setTogglingId(manga.id);
    try {
      await adminToggleMangaStatus(manga.id, next);
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "Gagal"); }
    finally { setTogglingId(null); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Manga</h1>
          <p className="mt-1 text-sm text-muted">
            Total <span className="font-semibold text-foreground">{total}</span> manga
          </p>
        </div>
        <Link href="/admin/manga/create"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">
          + Tambah Manga
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul manga..." className="w-64 rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent" />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover">Cari</button>
          {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground">✕</button>}
        </form>
        <select value={filterStorage} onChange={(e) => { setFilterStorage(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-accent">
          <option value="">Semua Storage</option>
          {storages.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.remote_name ?? `Storage #${s.id}`}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">⚠️ {error}</div>}

      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {["Cover", "Judul", "Tipe", "Status", "Chapters", "Storage", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-border" /></td>
                  ))}</tr>
                ))
              ) : mangaList.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted">Tidak ada manga ditemukan</td></tr>
              ) : (
                mangaList.map((manga) => (
                  <tr key={manga.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="h-14 w-10 overflow-hidden rounded border border-border bg-border">
                        {manga.cover_url
                          ? <img src={manga.cover_url} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center text-[10px] text-muted">No Cover</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-foreground line-clamp-1">{manga.title}</p>
                      <p className="text-xs text-muted">{manga.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {manga.type && (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[manga.type.slug] ?? "bg-border text-muted"}`}>
                          {manga.type.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleStatus(manga)} disabled={togglingId === manga.id}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50 ${STATUS_COLORS[manga.status ?? ""] ?? "bg-border text-muted"}`}>
                        {togglingId === manga.id ? "..." : manga.status ?? "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{manga.total_chapters ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {manga.storage?.name ?? manga.storage?.remote_name ?? (manga.storage_id ? `#${manga.storage_id}` : "—")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/manga/${manga.id}`}
                          className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-foreground" title="Detail">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link href={`/admin/manga/${manga.id}/edit`}
                          className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-blue-400" title="Edit">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => handleDelete(manga)} disabled={deletingId === manga.id}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/20 disabled:opacity-50" title="Hapus">
                          {deletingId === manga.id
                            ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted">Halaman {page} dari {totalPages} · Total {total} manga</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent hover:text-accent disabled:opacity-30">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent hover:text-accent disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}