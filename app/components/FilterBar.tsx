"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Genre, MangaType } from "@/app/lib/api";

interface FilterBarProps {
  genres: Genre[];
  types: MangaType[];
}

export default function FilterBar({ genres, types }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type_slug") || "";
  const currentGenre = searchParams.get("genre_slug") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentSort = searchParams.get("sort_by") || "updated_at";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  }

  // Defensive: pastikan genres dan types adalah array
  const safeGenres = Array.isArray(genres) ? genres : [];
  const safeTypes = Array.isArray(types) ? types : [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Filter */}
      <select
        value={currentType}
        onChange={(e) => updateFilter("type_slug", e.target.value)}
        className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
      >
        <option value="">Semua Tipe</option>
        {safeTypes.map((type) => (
          <option key={type.id} value={type.slug}>
            {type.name} {type.total_manga ? `(${type.total_manga})` : ""}
          </option>
        ))}
      </select>

      {/* Genre Filter */}
      <select
        value={currentGenre}
        onChange={(e) => updateFilter("genre_slug", e.target.value)}
        className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
      >
        <option value="">Semua Genre</option>
        {safeGenres.map((genre) => (
          <option key={genre.id} value={genre.slug}>
            {genre.name} {genre.total_manga ? `(${genre.total_manga})` : ""}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
      >
        <option value="">Semua Status</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
        <option value="hiatus">Hiatus</option>
      </select>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => updateFilter("sort_by", e.target.value)}
        className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
      >
        <option value="updated_at">Terbaru Update</option>
        <option value="created_at">Baru Ditambah</option>
        <option value="title">Judul A-Z</option>
      </select>

      {/* Reset */}
      {(currentType || currentGenre || currentStatus) && (
        <button
          onClick={() => router.push("/")}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ✕ Reset
        </button>
      )}
    </div>
  );
}