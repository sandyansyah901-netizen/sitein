"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateManga } from "@/app/lib/admin-api";
import { fetchGenres, fetchMangaTypes, type Genre, type MangaType } from "@/app/lib/api";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CreateMangaPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [types, setTypes] = useState<MangaType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [typeSlug, setTypeSlug] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => {});
    fetchMangaTypes().then(setTypes).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeSlug) { setError("Pilih tipe manga terlebih dahulu"); return; }
    setError("");
    setIsSubmitting(true);
    try {
      await adminCreateManga({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        type_slug: typeSlug,
        storage_id: 1, // ✅ hardcode karena hanya ada 1 storage
        status_manga: status,
        genre_slugs: selectedGenres.length > 0 ? selectedGenres : undefined,
      });
      router.push("/admin/manga");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat manga");
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

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-foreground">Tambah Manga Baru</h1>
        <p className="mt-1 text-sm text-muted">Isi form berikut untuk menambah manga ke sistem</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card-bg p-6">

        {/* Judul */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Judul <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder="contoh: One Piece"
            required
            maxLength={255}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Slug <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="contoh: one-piece"
            required
            maxLength={255}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-[11px] text-muted">Diisi otomatis dari judul, bisa diubah manual</p>
        </div>

        {/* Tipe & Status — 2 kolom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tipe <span className="text-accent">*</span>
            </label>
            <select
              value={typeSlug}
              onChange={(e) => setTypeSlug(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>
          </div>
        </div>

        {/* Storage info — readonly, hardcode 1 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Storage</label>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5">
            <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-sm text-muted">Storage #1</span>
            <span className="ml-auto rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Storage otomatis menggunakan Storage #1</p>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tulis sinopsis manga..."
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
                  key={g.id}
                  type="button"
                  onClick={() => toggleGenre(g.slug)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedGenres.includes(g.slug)
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
            <button
              type="button"
              onClick={() => setSelectedGenres([])}
              className="mt-2 text-xs text-muted hover:text-accent"
            >
              ✕ Hapus semua pilihan
            </button>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </span>
            ) : "💾 Simpan Manga"}
          </button>
        </div>
      </form>
    </div>
  );
}