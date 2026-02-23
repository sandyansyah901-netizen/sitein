"use client";

import { useEffect, useState } from "react";
import { adminCreateMangaType } from "@/app/lib/admin-api";
import { fetchMangaTypes, type MangaType } from "@/app/lib/api";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const TYPE_COLORS: Record<string, string> = {
  manga: "bg-blue-500/10 text-blue-400",
  manhwa: "bg-green-500/10 text-green-400",
  manhua: "bg-orange-500/10 text-orange-400",
  novel: "bg-purple-500/10 text-purple-400",
  doujinshi: "bg-pink-500/10 text-pink-400",
};

export default function AdminMangaTypesPage() {
  const [types, setTypes] = useState<MangaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setIsLoading(true);
    const data = await fetchMangaTypes();
    setTypes(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await adminCreateMangaType(name.trim(), slug.trim());
      setSuccess(`Tipe "${name}" berhasil ditambahkan!`);
      setName("");
      setSlug("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah tipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tipe Manga</h1>
        <p className="mt-1 text-sm text-muted">Kelola tipe konten: Manga, Manhwa, Manhua, dll</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card-bg p-6">
            <h2 className="mb-4 font-semibold text-foreground">Tambah Tipe Baru</h2>

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
                <label className="mb-1.5 block text-sm font-medium text-foreground">Nama Tipe</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
                  placeholder="contoh: Manhwa"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="contoh: manhwa"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "+ Tambah Tipe"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card-bg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">
                Daftar Tipe
                <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                  {types.length}
                </span>
              </h2>
            </div>
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-border" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {types.map((type) => (
                  <div key={type.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${TYPE_COLORS[type.slug] ?? "bg-border text-muted"}`}>
                        {type.name}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{type.name}</p>
                        <p className="text-xs text-muted">
                          slug: <code className="text-accent">{type.slug}</code>
                          {type.total_manga !== undefined && (
                            <span className="ml-2">· {type.total_manga} manga</span>
                          )}
                        </p>
                      </div>
                    </div>
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