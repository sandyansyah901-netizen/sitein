import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Manga } from "@/app/lib/api";
import { mangaHref } from "@/app/lib/utils";

interface Props {
  mangas: Manga[];
  currentPage: number;
  totalPages: number;
}

function formatChapterDate(dateString: string): string {
  const now = new Date();
  // Pastikan timestamp diparse sebagai UTC (tambah 'Z' jika belum ada)
  const normalized = dateString.endsWith("Z") || dateString.includes("+") ? dateString : dateString + "Z";
  const date = new Date(normalized);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} Min Ago`;
  if (diffHours < 24) return `${diffHours} Hours Ago`;
  if (diffDays < 7) return `${diffDays} Days Ago`;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = String(date.getFullYear()).slice(2);
  return `${d} ${m} ${y}`;
}

function getTypeBadgeColor(typeSlug?: string) {
  switch (typeSlug) {
    case "manhwa": return "bg-[#E50914] text-white";
    case "manhua": return "bg-blue-500 text-white";
    case "manga": return "bg-purple-500 text-white";
    default: return "bg-gray-500 text-white";
  }
}

function normalizeCover(url?: string | null): string {
  if (!url) return "/placeholder-cover.jpg";
  try { return new URL(url).pathname; } catch { return url.startsWith("/") ? url : `/${url}`; }
}

export default function SiteUpdateSection({ mangas, currentPage, totalPages }: Props) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="max-w-[1200px] mx-auto px-3 pt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#E50914]" />
          <span className="text-[14px] font-bold text-[#222] dark:text-white">Update</span>
        </div>
        <Link href="/" className="text-[12px] text-[#E50914] hover:underline">See all</Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
        {mangas.map((manga) => {
          const href = mangaHref(manga.type?.slug, manga.slug);
          const chapters = manga.latest_chapters ?? [];

          return (
            <div key={manga.id} className="group block">
              {/* Cover */}
              <Link href={href}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  <img
                    src={normalizeCover(manga.cover_url)}
                    alt={manga.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {manga.type && (
                    <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getTypeBadgeColor(manga.type.slug)}`}>
                      {manga.type.name}
                    </span>
                  )}
                  {chapters.length > 0 && (
                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFD618] text-black">
                      UP
                    </span>
                  )}
                </div>
              </Link>

              {/* Title */}
              <Link href={href}>
                <p className="mt-1 text-[11px] font-semibold text-[#222] dark:text-gray-200 line-clamp-1 leading-tight hover:text-[#E50914]">
                  {manga.title}
                </p>
              </Link>

              {/* 2 chapter terakhir */}
              <div className="flex flex-col gap-0.5 mt-0.5">
                {chapters.length > 0 ? chapters.map((ch) => {
                  const padMain = String(ch.chapter_main).padStart(3, "0");
                  const chNum = ch.chapter_sub > 0
                    ? `${padMain}-${String(ch.chapter_sub).padStart(2, "0")}`
                    : padMain;
                  const chHref = `${href}/chapter/${chNum}`;
                  return (
                    <div key={ch.slug} className="flex items-center justify-between gap-1">
                      <Link href={chHref} className="text-[10px] text-[#E50914] font-semibold hover:underline truncate">
                        {ch.label}
                      </Link>
                      <span className="text-[9px] text-gray-400 shrink-0 whitespace-nowrap">
                        {formatChapterDate(ch.created_at)}
                      </span>
                    </div>
                  );
                }) : manga.latest_chapter ? (
                  <p className="text-[10px] text-[#E50914] font-semibold">{manga.latest_chapter}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination — hanya muncul jika total pages > 1 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {/* Prev */}
          {hasPrev ? (
            <Link
              href={`/?update_page=${currentPage - 1}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-[12px] font-semibold text-gray-600 dark:text-gray-400 hover:border-[#E50914] hover:text-[#E50914] transition-colors"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-[#1a1a1a] text-[12px] font-semibold text-gray-300 dark:text-gray-700 cursor-not-allowed">
              <ChevronLeft className="w-3 h-3" /> Prev
            </span>
          )}

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="text-[12px] text-gray-400 px-1">…</span>
              ) : (
                <Link
                  key={p}
                  href={`/?update_page=${p}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-colors ${p === currentPage
                    ? "bg-[#E50914] text-white"
                    : "border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#E50914] hover:text-[#E50914]"
                    }`}
                >
                  {p}
                </Link>
              )
            )}

          {/* Next */}
          {hasNext ? (
            <Link
              href={`/?update_page=${currentPage + 1}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-[12px] font-semibold text-gray-600 dark:text-gray-400 hover:border-[#E50914] hover:text-[#E50914] transition-colors"
            >
              Next <ChevronRight className="w-3 h-3" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-[#1a1a1a] text-[12px] font-semibold text-gray-300 dark:text-gray-700 cursor-not-allowed">
              Next <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
