"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchAdminMangaDetail,
  adminUpdateManga,
  adminUploadCover,
  adminDeleteCover,
  fetchCoverInfo,
  normalizeCoverUrl,
  API_BASE,
  type AdminManga,
  type CoverInfo,
} from "@/app/lib/admin-api";
import {
  fetchGenres,
  fetchMangaTypes,
  type Genre,
  type MangaType,
} from "@/app/lib/api";

import { normalizeSlug } from "@/app/lib/utils";

export default function EditMangaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── Data ──────────────────────────────────────────────────────
  const [manga, setManga] = useState<AdminManga | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [types, setTypes] = useState<MangaType[]>([]);
  const [coverInfo, setCoverInfo] = useState<CoverInfo | null>(null);

  // ── Form state ────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [typeSlug, setTypeSlug] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // ── Cover state ───────────────────────────────────────────────
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDeletingCover, setIsDeletingCover] = useState(false);
  const [isLoadingCoverInfo, setIsLoadingCoverInfo] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── UI state ──────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverMsg, setCoverMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [m, g, t] = await Promise.all([
          fetchAdminMangaDetail(Number(id)),
          fetchGenres(),
          fetchMangaTypes(),
        ]);
        setManga(m);
        setGenres(g);
        setTypes(t);
        setTitle(m.title ?? "");
        setSlug(m.slug ?? "");
        setDescription((m.description as string) ?? "");
        setTypeSlug(m.type?.slug ?? "");
        setStatus((m.status as string) ?? "ongoing");
        setSelectedGenres(Array.isArray(m.genres) ? m.genres.map((g) => g.slug) : []);
        // Load cover info non-blocking
        loadCoverInfo(Number(id));
      } catch {
        router.push("/admin/manga");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id, router]);

  const loadCoverInfo = async (mangaId: number) => {
    setIsLoadingCoverInfo(true);
    try {
      const info = await fetchCoverInfo(mangaId);
      setCoverInfo(info);
    } catch {
      setCoverInfo(null);
    } finally {
      setIsLoadingCoverInfo(false);
    }
  };

  const reloadManga = async () => {
    try {
      const m = await fetchAdminMangaDetail(Number(id));
      // Debug log — hapus setelah masalah cover terselesaikan
      console.log("📦 reloadManga response:", {
        cover_url: m.cover_url,
        normalized: normalizeCoverUrl(m.cover_url),
        raw_cover: (m as Record<string, unknown>).cover_image_path,
      });
      setManga(m);
      await loadCoverInfo(Number(id));
    } catch { }
  };

  // ── Cover file preview ────────────────────────────────────────
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  useEffect(() => {
    return () => { if (coverPreview) URL.revokeObjectURL(coverPreview); };
  }, [coverPreview]);

  // ── Upload cover ──────────────────────────────────────────────
  const handleUploadCover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverFile || !manga) return;
    setIsUploadingCover(true);
    setCoverMsg(null);
    try {
      await adminUploadCover(manga.id, coverFile, true);
      setCoverMsg({ type: "ok", text: "✅ Cover berhasil diupload!" });
      setCoverFile(null);
      setCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
      await reloadManga();
    } catch (e) {
      setCoverMsg({ type: "err", text: `❌ ${e instanceof Error ? e.message : "Upload gagal"}` });
    } finally {
      setIsUploadingCover(false);
    }
  };

  // ── Delete cover ──────────────────────────────────────────────
  const handleDeleteCover = async () => {
    if (!manga || !confirm("Hapus cover dari server & Google Drive?")) return;
    setIsDeletingCover(true);
    setCoverMsg(null);
    try {
      await adminDeleteCover(manga.id, true);
      setCoverMsg({ type: "ok", text: "✅ Cover berhasil dihapus" });
      setCoverInfo(null);
      await reloadManga();
    } catch (e) {
      setCoverMsg({ type: "err", text: `❌ ${e instanceof Error ? e.message : "Hapus gagal"}` });
    } finally {
      setIsDeletingCover(false);
    }
  };

  // ── Submit form utama ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manga) return;
    if (!typeSlug) { setError("Pilih tipe manga terlebih dahulu"); return; }
    setError(""); setSuccess("");
    setIsSubmitting(true);
    try {
      await adminUpdateManga(manga.id, {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        type_slug: typeSlug,
        status,
        genre_slugs: selectedGenres.length > 0 ? selectedGenres : [],
      });
      setSuccess("✅ Manga berhasil diperbarui!");
      setTimeout(() => router.push(`/admin/manga/${manga.id}`), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui manga");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGenre = (genreSlug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreSlug)
        ? prev.filter((g) => g !== genreSlug)
        : [...prev, genreSlug]
    );
  };

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="mb-6">
          <div className="mb-3 h-4 w-20 animate-pulse rounded bg-border" />
          <div className="h-8 w-64 animate-pulse rounded bg-border" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5 rounded-xl border border-border bg-card-bg p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 w-24 animate-pulse rounded bg-border" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-border" />
              </div>
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-border" />
        </div>
      </div>
    );
  }

  if (!manga) return null;

  // ✅ Resolve cover URL:
  // 1. Jika ada cover_path di coverInfo → pakai /static/covers/{filename} sebagai primary (sesuai docs)
  // 2. Fallback ke normalizeCoverUrl(manga.cover_url)
  // 3. Fallback ke normalizeCoverUrl(coverInfo.access_url)
  const resolvedCoverUrl = (() => {
    // Priority 1: cover_path dari coverInfo → build /static/covers/{filename}
    if (coverInfo?.cover_path) {
      const filename = coverInfo.cover_path.replace(/^.*[\\/]/, ""); // ambil nama file saja
      return `${API_BASE}/static/covers/${filename}`;
    }
    // Priority 2: cover_url dari manga data
    if (manga.cover_url) {
      return normalizeCoverUrl(manga.cover_url);
    }
    // Priority 3: access_url dari coverInfo sebagai last resort
    if (coverInfo?.access_url) {
      return normalizeCoverUrl(coverInfo.access_url);
    }
    return null;
  })();

  const displayCover = coverPreview ?? resolvedCoverUrl;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/admin/manga/${manga.id}`)}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Detail
        </button>
        <h1 className="text-2xl font-bold text-foreground">Edit Manga</h1>
        <p className="mt-1 text-sm text-muted">
          Mengedit: <span className="font-semibold text-foreground">{manga.title}</span>
        </p>
      </div>

      {/* Global alerts */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── KIRI: Form utama ──────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-border bg-card-bg p-6 lg:col-span-2"
        >
          {/* Judul */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Judul <span className="text-accent">*</span>
            </label>
            <input
              type="text" value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (slug === normalizeSlug(manga.title)) setSlug(normalizeSlug(e.target.value));
              }}
              placeholder="contoh: One Piece"
              required maxLength={255}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Slug <span className="text-accent">*</span>
            </label>
            <input
              type="text" value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="contoh: one-piece"
              required maxLength={255}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-[11px] text-muted">
              ⚠️ Hati-hati mengubah slug — akan mempengaruhi URL semua chapter
            </p>
          </div>

          {/* Tipe & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Tipe <span className="text-accent">*</span>
              </label>
              <select
                value={typeSlug} onChange={(e) => setTypeSlug(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">Pilih tipe...</option>
                {types.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
          </div>

          {/* Storage readonly */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Storage</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5">
              <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-sm text-muted">
                {manga.storage?.name ?? manga.storage?.remote_name ?? (manga.storage_id ? `Storage #${manga.storage_id}` : "Storage #1")}
              </span>
              <span className="ml-auto rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted">Storage tidak bisa diubah melalui form ini</p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Deskripsi</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4} placeholder="Tulis sinopsis manga..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Genre
              {selectedGenres.length > 0 && (
                <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                  {selectedGenres.length} dipilih
                </span>
              )}
            </label>
            {genres.length === 0 ? (
              <p className="text-sm text-muted">Memuat genre...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <button
                    key={g.id} type="button"
                    onClick={() => toggleGenre(g.slug)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedGenres.includes(g.slug)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-accent/50 hover:text-foreground"
                      }`}
                  >
                    {selectedGenres.includes(g.slug) ? "✓ " : ""}{g.name}
                  </button>
                ))}
              </div>
            )}
            {selectedGenres.length > 0 && (
              <button type="button" onClick={() => setSelectedGenres([])}
                className="mt-2 text-xs text-muted hover:text-accent">
                ✕ Hapus semua pilihan
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => router.push(`/admin/manga/${manga.id}`)}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting || !!success}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : "💾 Simpan Perubahan"}
            </button>
          </div>
        </form>

        {/* ── KANAN: Cover ───────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card-bg p-5">
            <h2 className="mb-3 font-semibold text-foreground">Cover Manga</h2>

            {/* Preview */}
            <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-border">
              {displayCover ? (
                <>
                  <img
                    src={displayCover}
                    alt={manga.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback: coba endpoint /covers/{filename} jika /static/covers/ gagal
                      const img = e.currentTarget;
                      if (img.src.includes("/static/covers/")) {
                        const filename = img.src.replace(/^.*\/static\/covers\//, "");
                        img.src = `${API_BASE}/covers/${filename}`;
                      }
                    }}
                  />
                  {coverPreview && (
                    <div className="absolute top-2 left-2 rounded-md bg-yellow-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
                      Preview
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                  <svg className="h-10 w-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Belum ada cover</span>
                </div>
              )}
            </div>

            {/* Cover info dari API */}
            {!coverPreview && (
              <div className="mb-4">
                {isLoadingCoverInfo ? (
                  <div className="space-y-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-3.5 w-full animate-pulse rounded bg-border" />
                    ))}
                  </div>
                ) : coverInfo ? (
                  <div className="rounded-lg border border-border bg-background/50 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Info Cover
                    </p>
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted">Status</dt>
                        <dd>
                          {coverInfo.file_exists ? (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              ✅ Ada di server
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                              ❌ Tidak ada
                            </span>
                          )}
                        </dd>
                      </div>
                      {coverInfo.format && (
                        <div className="flex items-center justify-between">
                          <dt className="text-muted">Format</dt>
                          <dd className="rounded bg-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-foreground">
                            {coverInfo.format}
                          </dd>
                        </div>
                      )}
                      {coverInfo.file_size_kb != null && (
                        <div className="flex items-center justify-between">
                          <dt className="text-muted">Ukuran</dt>
                          <dd className="font-medium text-foreground">
                            {coverInfo.file_size_kb >= 1024
                              ? `${(coverInfo.file_size_kb / 1024).toFixed(1)} MB`
                              : `${coverInfo.file_size_kb.toFixed(0)} KB`}
                          </dd>
                        </div>
                      )}
                      {coverInfo.cover_path && (
                        <div className="flex items-start justify-between gap-2">
                          <dt className="shrink-0 text-muted">Path</dt>
                          <dd className="truncate text-right font-mono text-[10px] text-muted" title={coverInfo.cover_path}>
                            {coverInfo.cover_path}
                          </dd>
                        </div>
                      )}
                      {/* ✅ Tampilkan URL akses yang digunakan */}
                      {resolvedCoverUrl && (
                        <div className="flex items-start justify-between gap-2">
                          <dt className="shrink-0 text-muted">URL</dt>
                          <dd className="truncate text-right font-mono text-[10px] text-muted" title={resolvedCoverUrl}>
                            {resolvedCoverUrl.replace("http://127.0.0.1:8000", "")}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <button
                      onClick={() => loadCoverInfo(manga.id)}
                      className="mt-2 flex items-center gap-1 text-[10px] text-muted hover:text-accent"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh info
                    </button>
                  </div>
                ) : resolvedCoverUrl ? (
                  <div className="rounded-lg border border-border bg-background/50 p-3">
                    <p className="text-[10px] text-muted">
                      ℹ️ Cover tersedia
                      <button onClick={() => loadCoverInfo(manga.id)}
                        className="ml-2 text-accent hover:underline">
                        Muat info
                      </button>
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Cover alert */}
            {coverMsg && (
              <div className={`mb-3 rounded-lg px-3 py-2.5 text-xs ${coverMsg.type === "ok"
                ? "border border-emerald-800/40 bg-emerald-900/20 text-emerald-400"
                : "border border-red-800/40 bg-red-900/20 text-red-400"
                }`}>
                {coverMsg.text}
              </div>
            )}

            {/* Upload form */}
            <form onSubmit={handleUploadCover} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Upload Cover Baru
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted file:mr-2 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-accent-hover"
                />
                {coverFile && (
                  <p className="mt-1 text-[11px] text-muted">
                    📄 {coverFile.name} · {(coverFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={!coverFile || isUploadingCover}
                className="w-full rounded-lg bg-accent py-2.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {isUploadingCover ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengupload...
                  </span>
                ) : "⬆️ Upload Cover"}
              </button>
            </form>

            {/* Delete cover */}
            {resolvedCoverUrl && !coverPreview && (
              <button
                onClick={handleDeleteCover}
                disabled={isDeletingCover}
                className="mt-2 w-full rounded-lg border border-red-800/40 py-2.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-60"
              >
                {isDeletingCover ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menghapus...
                  </span>
                ) : "🗑️ Hapus Cover"}
              </button>
            )}

            {/* Cancel preview */}
            {coverPreview && (
              <button
                type="button"
                onClick={() => {
                  setCoverPreview(null);
                  setCoverFile(null);
                  if (coverInputRef.current) coverInputRef.current.value = "";
                }}
                className="mt-2 w-full rounded-lg border border-border py-2 text-xs text-muted hover:text-foreground"
              >
                ✕ Batal pilih file
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-border bg-card-bg p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Tips</h3>
            <ul className="space-y-1.5 text-xs text-muted">
              <li>• Format: JPG, PNG, WebP</li>
              <li>• Rasio ideal: 3:4 (portrait)</li>
              <li>• Format asli dipertahankan saat upload</li>
              <li>• Cover otomatis di-backup ke GDrive</li>
              <li>• Hapus cover juga menghapus dari GDrive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}