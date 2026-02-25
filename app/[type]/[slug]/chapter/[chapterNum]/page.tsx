"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChapterImage from "@/app/components/ChapterImage";
import {
  fetchChapterDetail,
  fetchChapterList,
  fetchMangaDetail,
  parseChapterNum,
  chapterNumToSlug,
  type ChapterDetail,
  type Manga,
  type Chapter,
} from "@/app/lib/api";
import { saveReadingProgress } from "@/app/lib/user-api";
import { useAuth } from "@/app/lib/auth";

interface PageProps {
  params: Promise<{
    type: string;
    slug: string;
    chapterNum: string;
  }>;
}

export default function ChapterReaderPage({ params }: PageProps) {
  const [resolvedParams, setResolvedParams] = useState<{
    type: string;
    slug: string;
    chapterNum: string;
  } | null>(null);
  const [chapterDetail, setChapterDetail] = useState<ChapterDetail | null>(null);
  const [mangaDetail, setMangaDetail] = useState<Manga | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [sessionStart] = useState(Date.now());
  const [apiLoadTime, setApiLoadTime] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const { token, isLoggedIn } = useAuth();
  const lastSavedPage = useRef(0);

  // Save reading progress (fire-and-forget)
  const saveProgress = useCallback(
    (chSlug: string, mangaSlug: string, pageNum: number) => {
      if (!token || !isLoggedIn) return;
      if (pageNum <= lastSavedPage.current) return;
      lastSavedPage.current = pageNum;
      saveReadingProgress(token, mangaSlug, chSlug, pageNum);
    },
    [token, isLoggedIn]
  );

  // Scroll to top on mount and when chapter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [resolvedParams?.chapterNum]);

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Fetch data
  useEffect(() => {
    if (!resolvedParams) return;

    const { type, slug, chapterNum } = resolvedParams;
    const apiStart = Date.now();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 CHAPTER READER INITIALIZED");
    console.log(`📖 Type: ${type} | Manga: ${slug} | Chapter: ${chapterNum}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const { main, sub } = parseChapterNum(chapterNum);
    const chapterSlug = chapterNumToSlug(slug, main, sub);

    console.log(`🔍 Fetching chapter: ${chapterSlug}`);

    Promise.all([
      fetchChapterDetail(chapterSlug),
      fetchMangaDetail(slug),
      fetchChapterList(slug, { page_size: 200, sort_order: "asc" }),
    ]).then(([chapter, manga, chapterList]) => {
      const apiTime = Date.now() - apiStart;
      setApiLoadTime(apiTime);

      console.log(`✅ API Response received in ${apiTime}ms`);
      console.log(`   📄 Chapter pages: ${chapter?.total_pages || 0}`);
      console.log(`   📚 Total chapters: ${chapterList?.total_chapters || 0}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (!chapter || !manga) {
        notFound();
      }

      if (manga.type?.slug !== type) {
        notFound();
      }

      setChapterDetail(chapter);
      setMangaDetail(manga);
      setAllChapters(chapterList?.chapters || []);
      setLoadedCount(0);
      lastSavedPage.current = 0;

      // Save page 1 immediately on chapter open
      if (token && isLoggedIn) {
        saveReadingProgress(token, manga.slug, chapter.slug, 1);
        lastSavedPage.current = 1;
      }

      console.log("🖼️  IMAGE LOADING STARTED (PARALLEL MODE)");
      console.log(`   Total images: ${chapter.pages.length}`);
      console.log(`   Browser will handle concurrent requests`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  }, [resolvedParams]);

  // IntersectionObserver: track halaman mana yang sedang dilihat user
  useEffect(() => {
    if (!chapterDetail || !mangaDetail) return;
    if (!token || !isLoggedIn) return;

    const chSlug = chapterDetail.slug;
    const mangaSlug = mangaDetail.slug;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(
              (entry.target as HTMLElement).dataset.page ?? "0",
              10
            );
            if (pageNum > 0) {
              saveProgress(chSlug, mangaSlug, pageNum);
            }
          }
        });
      },
      { threshold: 0.5 } // halaman minimal 50% visible baru save
    );

    const els = document.querySelectorAll("[data-page]");
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [chapterDetail, mangaDetail, token, isLoggedIn, saveProgress]);

  // Track image loading progress
  const handleImageLoaded = () => {
    setLoadedCount((prev) => {
      const next = prev + 1;

      if (chapterDetail) {
        const progress = ((next / chapterDetail.pages.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - sessionStart) / 1000).toFixed(1);

        console.log(
          `📊 Progress: ${next}/${chapterDetail.pages.length} (${progress}%) | Elapsed: ${elapsed}s`
        );

        if (next === chapterDetail.pages.length) {
          const totalTime = Date.now() - sessionStart;
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("🎉 ALL IMAGES LOADED SUCCESSFULLY!");
          console.log(`   ⏱️  API Load: ${(apiLoadTime / 1000).toFixed(2)}s`);
          console.log(
            `   🖼️  Images Load: ${((totalTime - apiLoadTime) / 1000).toFixed(2)}s`
          );
          console.log(`   🏁 Total Time: ${(totalTime / 1000).toFixed(2)}s`);
          console.log(
            `   📈 Avg per image: ${((totalTime - apiLoadTime) / chapterDetail.pages.length / 1000).toFixed(2)}s`
          );
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
      }

      return next;
    });
  };

  if (!resolvedParams || !chapterDetail || !mangaDetail) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-border border-t-accent" />
          <p className="text-sm text-muted">Loading chapter...</p>
        </div>
      </div>
    );
  }

  const { type, slug } = resolvedParams;
  const currentIndex = allChapters.findIndex(
    (ch) => ch.slug === chapterDetail.slug
  );
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < allChapters.length - 1
      ? allChapters[currentIndex + 1]
      : null;

  function getChapterUrl(chapter: Chapter): string {
    const padMain = String(chapter.chapter_main).padStart(3, "0");
    const chNum =
      chapter.chapter_sub > 0
        ? `${padMain}-${String(chapter.chapter_sub).padStart(2, "0")}`
        : padMain;
    return `/${type}/${slug}/chapter/${chNum}`;
  }

  return (
    <main className="min-h-screen bg-background chapter-reader">
      {/* Reader Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link
            href={`/${type}/${slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali ke Detail
          </Link>

          <div className="flex items-center gap-4">
            {prevChapter ? (
              <Link
                href={getChapterUrl(prevChapter)}
                className="text-sm text-muted hover:text-foreground"
              >
                ← Prev
              </Link>
            ) : (
              <span className="text-sm text-muted/50">← Prev</span>
            )}

            <span className="text-sm font-semibold text-foreground">
              {chapterDetail.chapter_label}
            </span>

            {nextChapter ? (
              <Link
                href={getChapterUrl(nextChapter)}
                className="text-sm text-muted hover:text-foreground"
              >
                Next →
              </Link>
            ) : (
              <span className="text-sm text-muted/50">Next →</span>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {loadedCount < chapterDetail.pages.length && (
        <div className="sticky top-14 z-40 bg-card-bg border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted whitespace-nowrap">
                Loading: {loadedCount}/{chapterDetail.pages.length}
              </span>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{
                    width: `${(loadedCount / chapterDetail.pages.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-accent font-mono">
                {((loadedCount / chapterDetail.pages.length) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Judul chapter — tetap ada padding */}
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {chapterDetail.manga.title}
        </h1>
        <p className="text-sm text-muted">{chapterDetail.chapter_label}</p>
        <p className="mt-1 text-xs text-muted">
          {chapterDetail.total_pages} halaman • Upload:{" "}
          {new Date(chapterDetail.created_at).toLocaleDateString("id-ID")}
        </p>
      </div>

      {/* Pages — FULL WIDTH, tanpa padding kiri-kanan */}
      {/* Setiap page dibungkus div dengan data-page untuk IntersectionObserver */}
      <div className="flex flex-col w-full max-w-[800px] mx-auto" id="chapter-pages">
        {chapterDetail.pages.map((page) => (
          <div key={page.id} data-page={page.page_order}>
            <ChapterImage
              imageUrl={`http://127.0.0.1:8000${page.proxy_url}`}
              pageOrder={page.page_order}
              totalPages={chapterDetail.total_pages}
              isAnchor={page.is_anchor}
              onLoadComplete={handleImageLoaded}
            />
          </div>
        ))}
      </div>

      {/* Navigation Bottom */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 px-4 pb-8">
        {prevChapter ? (
          <Link
            href={getChapterUrl(prevChapter)}
            className="rounded-lg border border-border bg-card-bg px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            ← {prevChapter.chapter_label}
          </Link>
        ) : (
          <button
            disabled
            className="cursor-not-allowed rounded-lg border border-border bg-card-bg px-6 py-3 font-semibold text-muted/50"
          >
            ← Previous Chapter
          </button>
        )}

        <Link
          href={`/${type}/${slug}`}
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Daftar Chapter
        </Link>

        {nextChapter ? (
          <Link
            href={getChapterUrl(nextChapter)}
            className="rounded-lg border border-border bg-card-bg px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {nextChapter.chapter_label} →
          </Link>
        ) : (
          <button
            disabled
            className="cursor-not-allowed rounded-lg border border-border bg-card-bg px-6 py-3 font-semibold text-muted/50"
          >
            Next Chapter →
          </button>
        )}
      </div>
    </main>
  );
}