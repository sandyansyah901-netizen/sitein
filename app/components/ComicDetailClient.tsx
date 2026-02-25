"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Layers,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Manga, Chapter } from "@/app/lib/api";
import { addBookmark, removeBookmark, checkBookmark, addToReadingList } from "@/app/lib/user-api";
import { useAuth } from "@/app/lib/auth";

interface Props {
  manga: Manga;
  chapters: Chapter[];
  totalChapters: number;
  recommended: Manga[];
  typeSlug: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function padChapterNumber(main: number, sub: number): string {
  const mainPadded = String(main).padStart(3, "0");
  if (sub > 0) return `${mainPadded}-${String(sub).padStart(2, "0")}`;
  return mainPadded;
}

export default function ComicDetailClient({
  manga,
  chapters,
  totalChapters,
  recommended,
  typeSlug,
}: Props) {
  const router = useRouter();
  const { token, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "info" | "news">("home");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Cek status bookmark saat mount
  useEffect(() => {
    if (!token || !isLoggedIn) return;
    checkBookmark(token, manga.slug)
      .then((res) => setBookmarked(res.is_bookmarked))
      .catch(() => { });
  }, [token, isLoggedIn, manga.slug]);

  const sortedChapters = [...chapters].sort((a, b) => {
    const diff = a.chapter_main - b.chapter_main || a.chapter_sub - b.chapter_sub;
    return sortOrder === "asc" ? diff : -diff;
  });

  const visibleChapters = showAll ? sortedChapters : sortedChapters.slice(0, 6);

  const firstChapter = [...chapters].sort(
    (a, b) => a.chapter_main - b.chapter_main || a.chapter_sub - b.chapter_sub
  )[0];

  const firstChapterHref = firstChapter
    ? `/${typeSlug}/${manga.slug}/chapter/${padChapterNumber(firstChapter.chapter_main, firstChapter.chapter_sub)}`
    : null;

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Back button (mobile) */}
      <div className="md:hidden flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-[#222] dark:text-white" />
        </button>
        <span className="text-[14px] font-semibold text-[#222] dark:text-white line-clamp-1">
          {manga.title}
        </span>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-t-xl bg-[#f7f7f7] dark:bg-[#111] mx-3 sm:mx-0">
        {/* Blurred background */}
        {manga.cover_url && (
          <img
            src={manga.cover_url}
            alt=""
            className="absolute w-full h-full object-cover blur-[6px] scale-110 opacity-40 dark:opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-[#f7f7f7]/60 dark:bg-[#111]/70" />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f7f7f7] dark:from-[#111] to-transparent" />

        {/* Content */}
        <div className="relative flex flex-col items-center pt-10 pb-6 px-4">
          {/* Cover */}
          <div className="w-[120px] aspect-[3/4] rounded-lg overflow-hidden shadow-lg mb-4">
            <img
              src={manga.cover_url || "/placeholder-cover.jpg"}
              alt={manga.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title */}
          <h1 className="font-bold text-[18px] text-[#111] dark:text-white text-center leading-tight mb-1">
            {manga.title}
          </h1>

          {/* Alt title */}
          {manga.alt_titles && manga.alt_titles.length > 0 && (
            <p className="text-[11px] italic text-gray-500 dark:text-gray-400 text-center mb-2">
              {manga.alt_titles[0]}
            </p>
          )}

          {/* Genre */}
          {manga.genres && manga.genres.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="text-[12px] text-gray-600 dark:text-gray-300">
                {manga.genres.map((g) => g.name).join(", ")}
              </span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {totalChapters} chapters
              </span>
            </div>
            {manga.updated_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {formatDate(manga.updated_at)}
                </span>
              </div>
            )}
          </div>

          {/* Status badge */}
          {manga.status && (
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full mb-3 ${manga.status.toLowerCase() === "completed"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                }`}
            >
              {manga.status}
            </span>
          )}

          {/* Bookmark button */}
          <button
            onClick={async () => {
              if (!token || !isLoggedIn) {
                window.dispatchEvent(new CustomEvent("open-login-modal"));
                return;
              }
              if (bookmarkLoading) return;
              setBookmarkLoading(true);
              try {
                if (bookmarked) {
                  await removeBookmark(token, manga.slug);
                  setBookmarked(false);
                } else {
                  await addBookmark(token, manga.slug);
                  setBookmarked(true);
                  // Otomatis masuk reading list sebagai plan_to_read
                  addToReadingList(token, manga.slug, "plan_to_read").catch(() => { });
                }
              } catch {
                /* silent */
              } finally {
                setBookmarkLoading(false);
              }
            }}
            disabled={bookmarkLoading}
            className={`flex items-center gap-1.5 text-[12px] transition-colors disabled:opacity-50 ${bookmarked
              ? "text-[#E50914]"
              : "text-gray-500 dark:text-gray-400 hover:text-[#E50914]"
              }`}
            aria-label="Bookmark"
          >
            <BookMarked
              className={`w-4 h-4 ${bookmarked ? "fill-[#E50914]" : ""}`}
            />
            <span>{bookmarked ? "Bookmarked" : "Bookmark"}</span>
          </button>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-3 sm:px-0 pt-3">
        {firstChapterHref ? (
          <Link
            href={firstChapterHref}
            className="block w-full bg-[#E50914] hover:bg-[#c1070f] rounded-lg py-3.5 text-white font-bold text-[13px] text-center transition-colors"
          >
            Read First Chapter
          </Link>
        ) : (
          <button
            disabled
            className="block w-full bg-gray-300 dark:bg-[#333] rounded-lg py-3.5 text-gray-500 font-bold text-[13px] text-center"
          >
            No Chapters Available
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-3 sm:px-0 pt-4">
        {(["home", "info", "news"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-colors ${activeTab === tab
              ? "bg-[#E50914] text-white"
              : "border border-gray-300 dark:border-[#333] text-[#555] dark:text-gray-400 hover:border-[#E50914] hover:text-[#E50914]"
              }`}
          >
            {tab === "home" ? "Episodes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-3 sm:px-0 pt-4">
        {/* HOME tab: episode list */}
        {activeTab === "home" && (
          <div>
            {/* Sort header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-[#222] dark:text-white">
                Total {totalChapters}
              </span>
              <button
                onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-[#E50914] transition-colors"
              >
                {sortOrder === "asc" ? "From First" : "Latest First"}
                {sortOrder === "asc" ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Episode list */}
            {visibleChapters.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">
                No chapters available
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleChapters.map((ch, idx) => {
                  const chapterNum = padChapterNumber(ch.chapter_main, ch.chapter_sub);
                  const href = `/${typeSlug}/${manga.slug}/chapter/${chapterNum}`;
                  const isFirst8 = idx < 8;
                  const isLast = idx === sortedChapters.length - 1;

                  return (
                    <Link
                      key={ch.id}
                      href={href}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111] transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="w-[56px] h-[84px] shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
                        {ch.preview_url ? (
                          <img
                            src={ch.preview_url}
                            alt={ch.chapter_label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">
                            Ch.{ch.chapter_main}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#222] dark:text-white line-clamp-1">
                          {ch.chapter_label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDate(ch.created_at)}
                        </p>
                      </div>

                      {/* Badge */}
                      <div className="shrink-0">
                        {isLast && !isFirst8 ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E50914] text-white">
                            Wait Free
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-gray-300 dark:border-[#444] text-gray-500 dark:text-gray-400">
                            Free
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Show more button */}
            {sortedChapters.length > 6 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full mt-3 py-2.5 flex items-center justify-center gap-1 text-[12px] text-gray-500 dark:text-gray-400 hover:text-[#E50914] border border-gray-200 dark:border-[#2a2a2a] rounded-lg transition-colors"
              >
                {showAll ? (
                  <>
                    Show less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show more ({sortedChapters.length - 6} more){" "}
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Recommended */}
            {recommended.length > 0 && (
              <div className="mt-6">
                <p className="text-[13px] font-bold text-[#222] dark:text-white mb-3">
                  You may also like
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {recommended.map((rec) => {
                    const href = `/${rec.type?.slug || "manga"}/${rec.slug}`;
                    return (
                      <Link key={rec.id} href={href} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                          <img
                            src={rec.cover_url || "/placeholder-cover.jpg"}
                            alt={rec.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-semibold text-[#222] dark:text-gray-200 line-clamp-2 leading-tight">
                          {rec.title}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO tab */}
        {activeTab === "info" && (
          <div>
            {/* Synopsis */}
            <div className="mb-5">
              <p className="text-[13px] font-bold text-[#222] dark:text-white mb-2">
                Synopsis
              </p>
              <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">
                {manga.description || "No description available."}
              </p>
            </div>

            {/* Details */}
            <div className="bg-[#f7f7f7] dark:bg-[#111] rounded-xl p-4">
              <p className="text-[13px] font-bold text-[#222] dark:text-white mb-3">
                Details
              </p>
              <div className="flex flex-col gap-2.5">
                {manga.alt_titles && manga.alt_titles.length > 0 && (
                  <DetailRow label="Alternative Title" value={manga.alt_titles.join(", ")} />
                )}
                {manga.genres && manga.genres.length > 0 && (
                  <DetailRow
                    label="Genre"
                    value={manga.genres.map((g) => g.name).join(", ")}
                  />
                )}
                {manga.status && (
                  <DetailRow label="Status" value={manga.status} />
                )}
                {manga.total_chapters !== undefined && (
                  <DetailRow
                    label="Total Chapters"
                    value={String(manga.total_chapters)}
                  />
                )}
                {manga.updated_at && (
                  <DetailRow
                    label="Last Update"
                    value={formatDate(manga.updated_at)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* NEWS tab */}
        {activeTab === "news" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3">📰</div>
            <p className="text-[13px] font-semibold text-[#222] dark:text-white mb-1">
              No News Yet
            </p>
            <p className="text-[11px] text-gray-400">
              Check back later for updates about this series.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-[120px] shrink-0">
        {label}
      </span>
      <span className="text-[11px] text-[#333] dark:text-gray-300 capitalize flex-1">
        {value}
      </span>
    </div>
  );
}
