"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  fetchAdminChapters, adminDeleteChapter, adminGenerateThumbnail,
  adminDeleteThumbnail, fetchThumbnailInfo, type AdminChapter,
} from "@/app/lib/admin-api";


// ── Mode filter: bisa by ID atau by judul/slug ──────────────────────────────
type FilterMode = "id" | "title";

export default function AdminChaptersPage() {
  const searchParams = useSearchParams();
  const initMangaId = searchParams.get("manga_id") ?? "";

  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filterMode, setFilterMode] = useState<FilterMode>("id");
  const [mangaId, setMangaId] = useState(initMangaId);
  const [mangaIdInput, setMangaIdInput] = useState(initMangaId);
  const [mangaSearch, setMangaSearch] = useState("");
  const [mangaSearchInput, setMangaSearchInput] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [thumbInfo, setThumbInfo] = useState<Record<number, unknown>>({});
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<{ type: "ok" | "err"; text: string }[]>([]);

  const addMsg = (type: "ok" | "err", text: string) =>
    setMsgs((p) => [{ type, text }, ...p].slice(0, 5));

  const load = useCallback(async () => {
    setIsLoading(true); setError("");
    try {
      const data = await fetchAdminChapters({
        // Filter by ID jika mode "id" dan ada input
        manga_id: filterMode === "id" && mangaId ? Number(mangaId) : undefined,
        // Filter by judul/slug jika mode "title" dan ada input
        manga_slug: filterMode === "title" && mangaSearch ? mangaSearch : undefined,
        page, page_size: 20,
      });
      const items = data.items ?? data.chapters ?? [];
      setChapters(items);
      setTotal(data.pagination?.total ?? data.total ?? items.length);
      setTotalPages(data.pagination?.total_pages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat chapters");
    } finally { setIsLoading(false); }
  }, [page, mangaId, mangaSearch, filterMode]);

  useEffect(() => { load(); }, [load]);

  // ── Reset filter ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setMangaId(""); setMangaIdInput("");
    setMangaSearch(""); setMangaSearchInput("");
    setPage(1);
  };

  const isFiltered = filterMode === "id" ? !!mangaId : !!mangaSearch;

  const handleDelete = async (ch: AdminChapter) => {
    const deleteGdrive = confirm("Hapus juga files di Google Drive?\nOK = Ya | Cancel = Tidak");
    if (!confirm(`Hapus chapter "${ch.chapter_label}"? Semua pages akan dihapus!`)) return;
    setDeletingId(ch.id);
    try {
      await adminDeleteChapter(ch.id, deleteGdrive);
      addMsg("ok", `✅ Chapter "${ch.chapter_label}" dihapus`);
      await load();
    } catch (e) { addMsg("err", `❌ ${e instanceof Error ? e.message : "Gagal"}`); }
    finally { setDeletingId(null); }
  };

  const handleLoadThumbInfo = async (chapterId: number) => {
    try {
      const info = await fetchThumbnailInfo(chapterId);
      setThumbInfo((p) => ({ ...p, [chapterId]: info }));
    } catch { setThumbInfo((p) => ({ ...p, [chapterId]: { error: "Gagal" } })); }
  };

  const handleGenerateThumb = async (ch: AdminChapter) => {
    setGeneratingId(ch.id);
    try {
      await adminGenerateThumbnail(ch.id, 1);
      addMsg("ok", `✅ Thumbnail "${ch.chapter_label}" di-generate`);
      await handleLoadThumbInfo(ch.id);
    } catch (e) { addMsg("err", `❌ ${e instanceof Error ? e.message : "Gagal"}`); }
    finally { setGeneratingId(null); }
  };

  const handleDeleteThumb = async (ch: AdminChapter) => {
    if (!confirm("Hapus thumbnail chapter ini?")) return;
    try {
      await adminDeleteThumbnail(ch.id);
      addMsg("ok", `✅ Thumbnail dihapus, revert ke page 1`);
      await handleLoadThumbInfo(ch.id);
    } catch (e) { addMsg("err", `❌ ${e instanceof Error ? e.message : "Gagal"}`); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manajemen Chapters</h1>
        <p className="mt-1 text-sm text-muted">Total <span className="font-semibold text-foreground">{total}</span> chapters</p>
      </div>

      {/* ── Filter ─────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-end gap-3">

        {/* Toggle mode */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => { setFilterMode("id"); handleReset(); }}
            className={`px-3 py-2 font-semibold transition-colors ${filterMode === "id"
              ? "bg-accent text-white"
              : "bg-card-bg text-muted hover:text-foreground"
              }`}
          >
            By ID
          </button>
          <button
            onClick={() => { setFilterMode("title"); handleReset(); }}
            className={`px-3 py-2 font-semibold transition-colors ${filterMode === "title"
              ? "bg-accent text-white"
              : "bg-card-bg text-muted hover:text-foreground"
              }`}
          >
            By Judul / Slug
          </button>
        </div>

        {/* Input sesuai mode */}
        {filterMode === "id" ? (
          <form
            onSubmit={(e) => { e.preventDefault(); setMangaId(mangaIdInput); setPage(1); }}
            className="flex gap-2"
          >
            <input
              type="number"
              value={mangaIdInput}
              onChange={(e) => setMangaIdInput(e.target.value)}
              placeholder="Manga ID..."
              className="w-40 rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Filter
            </button>
            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
              >
                ✕ Reset
              </button>
            )}
          </form>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setMangaSearch(mangaSearchInput); setPage(1); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={mangaSearchInput}
              onChange={(e) => setMangaSearchInput(e.target.value)}
              placeholder="Cari judul atau slug manga..."
              className="w-64 rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Cari
            </button>
            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
              >
                ✕ Reset
              </button>
            )}
          </form>
        )}

        {/* Badge aktif filter */}
        {isFiltered && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            {filterMode === "id" ? `Manga ID: ${mangaId}` : `Cari: "${mangaSearch}"`}
          </span>
        )}
      </div>

      {msgs.length > 0 && (
        <div className="mb-4 space-y-2">
          {msgs.map((m, i) => (
            <div key={i} className={`rounded-lg px-4 py-2.5 text-sm ${m.type === "ok"
              ? "border border-emerald-800/40 bg-emerald-900/20 text-emerald-400"
              : "border border-red-800/40 bg-red-900/20 text-red-400"
              }`}>
              {m.text}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {["ID", "Manga", "Chapter", "Pages", "Thumbnail", "Dibuat", "Aksi"].map((h) => (
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
              ) : chapters.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted">Tidak ada chapter ditemukan</td></tr>
              ) : (
                chapters.map((ch) => (
                  <tr key={ch.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-3 text-muted">#{ch.id}</td>
                    <td className="px-4 py-3 text-sm text-muted max-w-[120px]">
                      <p className="truncate">{ch.manga?.title ?? `Manga #${ch.manga?.id ?? "?"}`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{ch.chapter_label}</p>
                      <p className="text-xs text-muted">{ch.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{ch.total_pages ?? "—"}</td>
                    <td className="px-4 py-3">
                      {ch.preview_url ? (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">✓ Ada</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {ch.created_at ? new Date(ch.created_at).toLocaleDateString("id-ID") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {/* Edit Pages */}
                          <Link
                            href={`/admin/chapters/${ch.id}/edit`}
                            title="Edit Halaman Chapter"
                            className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-accent transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button onClick={() => handleGenerateThumb(ch)} disabled={generatingId === ch.id}
                            title="Generate Thumbnail" className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-yellow-400 disabled:opacity-50">
                            {generatingId === ch.id
                              ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                          </button>
                          <button onClick={() => handleLoadThumbInfo(ch.id)}
                            title="Info Thumbnail" className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-blue-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteThumb(ch)}
                            title="Hapus Thumbnail" className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-orange-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <button onClick={() => handleDelete(ch)} disabled={deletingId === ch.id}
                            title="Hapus Chapter" className="rounded-lg p-1.5 text-red-400 hover:bg-red-900/20 disabled:opacity-50">
                            {deletingId === ch.id
                              ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                          </button>
                        </div>
                        {thumbInfo[ch.id] !== undefined && (
                          <div className="rounded bg-background p-1.5 text-[10px] font-mono text-muted max-w-[180px] truncate">
                            {JSON.stringify(thumbInfo[ch.id] as Record<string, unknown>).slice(0, 80)}…
                          </div>
                        )}
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
            <p className="text-xs text-muted">Halaman {page} dari {totalPages}</p>
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