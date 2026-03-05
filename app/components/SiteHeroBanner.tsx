"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Manga } from "@/app/lib/api";
import { mangaHref } from "@/app/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BannerSlotConfig {
  slot_index: number;
  mode: "auto" | "custom";
  custom_image_url: string | null;
  custom_title: string | null;
  custom_subtitle: string | null;
  custom_link: string | null;
}

interface BannerItem {
  imageUrl: string;
  title: string;
  subtitle?: string;
  href: string;
  type?: string;
}

interface Props {
  mangas: Manga[];
  bannerConfig?: BannerSlotConfig[];
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function buildBannerItems(
  mangas: Manga[],
  config: BannerSlotConfig[]
): BannerItem[] {
  const mangasSlice = mangas.slice(0, 3);
  const items: BannerItem[] = [];

  for (let i = 0; i < 3; i++) {
    const slot = config.find((s) => s.slot_index === i);
    const isCustom = slot?.mode === "custom" && slot.custom_image_url;

    if (isCustom && slot) {
      items.push({
        imageUrl: slot.custom_image_url!,
        title: slot.custom_title ?? "",
        subtitle: slot.custom_subtitle ?? undefined,
        href: slot.custom_link ?? "#",
      });
    } else {
      // Auto mode: pakai manga ke-i
      const manga = mangasSlice[i];
      if (!manga) continue;
      items.push({
        imageUrl: manga.cover_url ?? "/placeholder-cover.jpg",
        title: manga.title,
        href: mangaHref(manga.type?.slug, manga.slug),
        type: manga.type?.name,
      });
    }
  }

  return items;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SiteHeroBanner({ mangas, bannerConfig = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = buildBannerItems(mangas, bannerConfig);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % Math.max(items.length, 1));
    }, 5000);
  };

  useEffect(() => {
    if (items.length < 2) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const goTo = (idx: number) => { setActiveIndex(idx); resetTimer(); };

  if (items.length === 0) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-3 pt-2">
      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid grid-cols-3 gap-1 h-[420px] rounded-xl overflow-hidden">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className={`relative overflow-hidden cursor-pointer group ${i === activeIndex ? "ring-2 ring-[#E50914]/60" : ""}`}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {item.type && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white bg-[#E50914] mb-2">
                  {item.type}
                </span>
              )}
              <p className="text-white font-bold text-[15px] leading-tight line-clamp-2">{item.title}</p>
              {item.subtitle && (
                <p className="text-white/70 text-[12px] leading-tight mt-1 line-clamp-1">{item.subtitle}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: single banner carousel */}
      <div className="lg:hidden relative h-[280px] sm:h-[360px] rounded-xl overflow-hidden">
        {items.map((item, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${i === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <Link href={item.href} className="block w-full h-full">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {item.type && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white bg-[#E50914] mb-2">
                    {item.type}
                  </span>
                )}
                <p className="text-white font-bold text-[16px] leading-tight line-clamp-2">{item.title}</p>
                {item.subtitle && (
                  <p className="text-white/70 text-[12px] leading-tight mt-1 line-clamp-1">{item.subtitle}</p>
                )}
              </div>
            </Link>
          </div>
        ))}

        {/* Arrow nav */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => goTo((activeIndex - 1 + items.length) % items.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => goTo((activeIndex + 1) % items.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all ${i === activeIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
