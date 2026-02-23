"use client";

import { useEffect, useState } from "react";
import {
  adminCreateGenre,
  adminDeleteGenre,
} from "@/app/lib/admin-api";
import { fetchGenres, type Genre } from "@/app/lib/api";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setIsLoading(true);
    const data = await fetchGenres();
    setGenres(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(slugify(v));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !slug.trim()) return;
    setIsSubmitting(true);
    try {
      await adminCreateGenre(name.trim(), slug.trim());
      setSuccess(`Genre "${name}" berhasil ditambahkan!`);
      setName("");
      setSlug("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah genre");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (genre: Genre) => {
    if (!confirm(`Hapus genre "${genre.name}"?`)) return;
    setDeletingId(genre.id);
    setError("");
    try {
      await adminDeleteGenre(genre.id);
      setSuccess(`Genre "${genre.name}" dihapus.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus genre");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Manajemen Genre</h1>
        <p className="mt-1 text-sm text-muted">Tambah dan hapus genre manga</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form tambah */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card-bg p-6">
            <h2 className="mb-4 font-semibold text-foreground">Tambah Genre Baru</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nama Genre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="contoh: Action"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="contoh: action"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1 text-[10px] text-muted">
                  Diisi otomatis dari nama, bisa diubah manual
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "+ Tambah Genre"}
              </button>
            </form>
          </div>
        </div>

        {/* Daftar genre */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card-bg">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">
                Daftar Genre
                <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                  {genres.length}
                </span>
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-border" />
                ))}
              </div>
            ) : genres.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted">
                Belum ada genre. Tambahkan yang pertama!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{genre.name}</p>
                      <p className="text-xs text-muted">
                        slug: <code className="text-accent">{genre.slug}</code>
                        {genre.total_manga !== undefined && (
                          <span className="ml-2 text-muted">
                            · {genre.total_manga} manga
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(genre)}
                      disabled={deletingId === genre.id}
                      className="rounded-lg border border-red-800/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {deletingId === genre.id ? "..." : "Hapus"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}