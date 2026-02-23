import Link from "next/link";
import type { Manga } from "@/app/lib/api";

interface Props {
  manga: Manga;
  rank?: number;
}

function getTypeBadgeColor(typeSlug?: string) {
  switch (typeSlug) {
    case "manhwa":
      return "bg-[#E50914] text-white";
    case "manhua":
      return "bg-blue-500 text-white";
    case "manga":
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export default function SiteComicCard({ manga, rank }: Props) {
  const href = `/${manga.type?.slug || "manga"}/${manga.slug}`;

  return (
    <Link href={href} className="group block shrink-0 w-[120px] md:w-auto">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
        <img
          src={manga.cover_url || "/placeholder-cover.jpg"}
          alt={manga.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Rank number */}
        {rank !== undefined && (
          <span className="absolute top-1 left-1 text-[11px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded">
            #{rank}
          </span>
        )}
        {/* Type badge */}
        {manga.type && (
          <span
            className={`absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getTypeBadgeColor(manga.type.slug)}`}
          >
            {manga.type.name}
          </span>
        )}
        {/* FREE badge */}
        <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFD618] text-black">
          Free
        </span>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-[#222] dark:text-gray-200 line-clamp-2 leading-tight">
        {manga.title}
      </p>
      {manga.genres && manga.genres.length > 0 && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-1">
          {manga.genres[0].name}
        </p>
      )}
    </Link>
  );
}
