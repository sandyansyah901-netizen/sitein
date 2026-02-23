"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import SiteComicCard from "@/app/components/SiteComicCard";
import type { Manga } from "@/app/lib/api";

interface Props {
  title: string;
  mangas: Manga[];
  showRank?: boolean;
  seeAllHref?: string;
}

export default function SiteComicSection({
  title,
  mangas,
  showRank = false,
  seeAllHref,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: dir === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (mangas.length === 0) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-3 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-bold text-[#222] dark:text-white">{title}</span>
        {seeAllHref ? (
          <Link href={seeAllHref} className="text-[12px] text-[#E50914] hover:underline">
            See all
          </Link>
        ) : (
          <span className="text-[12px] text-[#E50914] cursor-pointer hover:underline">
            See all
          </span>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative group">
        {/* Left scroll button */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] shadow rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-[#444] dark:text-gray-300" />
        </button>

        {/* Scrollable grid */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible"
        >
          {mangas.map((manga, i) => (
            <SiteComicCard
              key={manga.id}
              manga={manga}
              rank={showRank ? i + 1 : undefined}
            />
          ))}
        </div>

        {/* Right scroll button */}
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
