"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Manga } from "@/app/lib/api";
import { mangaHref } from "@/app/lib/utils";

interface Props {
  mangas: Manga[];
}

export default function SiteHeroBanner({ mangas }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % Math.max(mangas.length, 1));
    }, 5000);
  };

  useEffect(() => {
    if (mangas.length < 2) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangas.length]);

  const goTo = (idx: number) => {
    setActiveIndex(idx);
    resetTimer();
  };

  if (mangas.length === 0) return null;

  const getHref = (manga: Manga) =>
    mangaHref(manga.type?.slug, manga.slug);

  return (
    <div className="max-w-[1200px] mx-auto px-3 pt-2">
      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid grid-cols-3 gap-1 h-[420px] rounded-xl overflow-hidden">
        {mangas.slice(0, 3).map((manga, i) => (
          <Link
            key={manga.id}
            href={getHref(manga)}
            className={`relative overflow-hidden cursor-pointer group ${i === activeIndex ? "ring-2 ring-[#E50914]/60" : ""
              }`}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <img
              src={manga.cover_url || "/placeholder-cover.jpg"}
              alt={manga.title}
              className="absolute w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {manga.type && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white bg-[#E50914] mb-2">
                  {manga.type.name}
                </span>
              )}
              <p className="text-white font-bold text-[15px] leading-tight line-clamp-2">
                {manga.title}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: single banner carousel */}
      <div className="lg:hidden relative h-[280px] sm:h-[360px] rounded-xl overflow-hidden">
        {mangas.slice(0, 3).map((manga, i) => (
          <div
            key={manga.id}
            className={`absolute inset-0 transition-opacity duration-500 ${i === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <Link href={getHref(manga)} className="block w-full h-full">
              <img
                src={manga.cover_url || "/placeholder-cover.jpg"}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {manga.type && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white bg-[#E50914] mb-2">
                    {manga.type.name}
                  </span>
                )}
                <p className="text-white font-bold text-[16px] leading-tight line-clamp-2">
                  {manga.title}
                </p>
              </div>
            </Link>
          </div>
        ))}

        {/* Arrow nav */}
        {mangas.length > 1 && (
          <>
            <button
              onClick={() =>
                goTo((activeIndex - 1 + mangas.length) % mangas.length)
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => goTo((activeIndex + 1) % mangas.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Dots */}
        {mangas.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {mangas.slice(0, 3).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all ${i === activeIndex
                    ? "w-4 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/50"
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
