import Link from "next/link";
import { Clock } from "lucide-react";
import type { Manga } from "@/app/lib/api";

interface Props {
  mangas: Manga[];
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

export default function SiteUpdateSection({ mangas }: Props) {
  return (
    <div className="max-w-[1200px] mx-auto px-3 pt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#E50914]" />
          <span className="text-[14px] font-bold text-[#222] dark:text-white">Update</span>
        </div>
        <Link
          href="/"
          className="text-[12px] text-[#E50914] hover:underline"
        >
          See all
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
        {mangas.map((manga) => {
          const href = `/${manga.type?.slug || "manga"}/${manga.slug}`;
          return (
            <Link key={manga.id} href={href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <img
                  src={manga.cover_url || "/placeholder-cover.jpg"}
                  alt={manga.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Type badge */}
                {manga.type && (
                  <span
                    className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getTypeBadgeColor(manga.type.slug)}`}
                  >
                    {manga.type.name}
                  </span>
                )}
                {/* UP badge */}
                {manga.latest_chapter && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFD618] text-black">
                    UP
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#222] dark:text-gray-200 line-clamp-1 leading-tight">
                {manga.title}
              </p>
              {manga.latest_chapter && (
                <p className="text-[10px] text-[#E50914]">
                  Ch.{manga.latest_chapter}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
