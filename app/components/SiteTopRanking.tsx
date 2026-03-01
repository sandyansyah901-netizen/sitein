"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Manga } from "@/app/lib/api";
import { mangaHref } from "@/app/lib/utils";

interface Props {
  title: string;
  mangas: Manga[];
}

export default function SiteTopRanking({ title, mangas }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  if (mangas.length === 0) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-3 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-bold text-[#222] dark:text-white">{title}</span>
        <span className="text-[12px] text-[#E50914] cursor-pointer hover:underline">See all</span>
      </div>

      {/* Scroll area */}
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] shadow rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-[#444] dark:text-gray-300" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        >
          {mangas.map((manga, i) => {
            const href = mangaHref(manga.type?.slug, manga.slug);
            return (
              <Link
                key={manga.id}
                href={href}
                className="group/card flex-shrink-0 w-[140px] sm:w-[160px] block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  <img
                    src={manga.cover_url || "/placeholder-cover.jpg"}
                    alt={manga.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                  {/* Rank */}
                  <span className="absolute top-1 left-1 text-[12px] font-black text-white bg-[#E50914] px-2 py-0.5 rounded">
                    #{i + 1}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">
                      {manga.title}
                    </p>
                  </div>
                </div>
                {manga.total_chapters !== undefined && (
                  <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                    {manga.total_chapters} ch
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] shadow rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-[#444] dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}
