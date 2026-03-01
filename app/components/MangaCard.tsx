import Link from "next/link";
import { Manga } from "@/app/lib/api";
import { normalizeCoverUrl } from "@/app/lib/admin-api";
import { mangaHref } from "@/app/lib/utils";

function getTypeColor(typeSlug?: string) {
  switch (typeSlug) {
    case "manga":
      return "bg-blue-600";
    case "manhwa":
      return "bg-green-600";
    case "manhua":
      return "bg-orange-600";
    case "novel":
      return "bg-purple-600";
    case "doujinshi":
      return "bg-pink-600";
    case "one-shot":
      return "bg-indigo-600";
    default:
      return "bg-gray-600";
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case "ongoing":
      return "bg-emerald-600";
    case "completed":
      return "bg-rose-600";
    case "hiatus":
      return "bg-yellow-600";
    default:
      return "bg-gray-600";
  }
}

function timeAgo(dateString?: string): string {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID");
}

export default function MangaCard({ manga }: { manga: Manga }) {
  // ✅ normalizeCoverUrl sekarang return path relatif "/static/covers/x.webp"
  // yang akan di-proxy oleh Next.js rewrite ke http://127.0.0.1:8000/static/covers/x.webp
  const coverUrl =
    normalizeCoverUrl(manga.cover_url) ||
    "https://via.placeholder.com/300x420/1a1a2e/666?text=No+Cover";

  // PENTING: URL dinamis berdasarkan type
  const mangaUrl = mangaHref(manga.type?.slug, manga.slug);

  console.log("🔗 MangaCard URL:", {
    title: manga.title,
    type: manga.type?.slug,
    url: mangaUrl,
    cover: coverUrl,
  });

  return (
    <Link href={mangaUrl}>
      <div className="group relative overflow-hidden rounded-lg bg-card-bg transition-all duration-300 hover:bg-card-hover hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img
            src={coverUrl}
            alt={manga.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Type badge */}
          {manga.type && (
            <span
              className={`absolute top-2 left-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${getTypeColor(manga.type.slug)}`}
            >
              {manga.type.name}
            </span>
          )}

          {/* Status badge */}
          {manga.status && (
            <span
              className={`absolute top-2 right-2 rounded px-2 py-0.5 text-[10px] font-bold capitalize text-white ${getStatusColor(manga.status)}`}
            >
              {manga.status}
            </span>
          )}

          {/* Latest chapter */}
          {manga.latest_chapter && (
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
              {manga.latest_chapter}
            </span>
          )}

          {/* Updated time */}
          {manga.updated_at && (
            <span className="absolute bottom-2 right-2 text-[10px] text-gray-300">
              {timeAgo(manga.updated_at)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-accent">
            {manga.title}
          </h3>
          {manga.genres && manga.genres.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {manga.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre.id}
                  className="rounded bg-border px-1.5 py-0.5 text-[10px] capitalize text-muted"
                >
                  {genre.name}
                </span>
              ))}
              {manga.genres.length > 2 && (
                <span className="rounded bg-border px-1.5 py-0.5 text-[10px] text-muted">
                  +{manga.genres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}