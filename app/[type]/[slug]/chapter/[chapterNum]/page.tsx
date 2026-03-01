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
import { fromSeoSlug, toSeoSlug } from "@/app/lib/utils";

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
  const [nextChapterDetail, setNextChapterDetail] = useState<ChapterDetail | null>(null);
  const [sessionStart] = useState(Date.now());
  const [apiLoadTime, setApiLoadTime] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [pagesReady, setPagesReady] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { token, isLoggedIn } = useAuth();
  const lastSavedPage = useRef(0);
  const lastScrollY = useRef(0);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawerListRef = useRef<HTMLDivElement>(null);

  // Save reading progress (fire-and-forget).
  // Only send to API when user reaches a page higher than the last saved one.
  const saveProgress = useCallback(
    (chSlug: string, mangaSlug: string, pageNum: number) => {
      if (!token || !isLoggedIn) return;
      if (pageNum <= lastSavedPage.current) return; // only go forward
      lastSavedPage.current = pageNum;
      saveReadingProgress(token, mangaSlug, chSlug, pageNum);
    },
    [token, isLoggedIn]
  );

  // Scroll to top on mount and when chapter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [resolvedParams?.chapterNum]);

  // Hide navbar on scroll-down, show on scroll-up
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current + 8) {
        setNavVisible(false);
      } else if (currentY < lastScrollY.current - 8) {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      autoScrollRef.current = setInterval(() => {
        window.scrollBy({ top: 1, behavior: "auto" });
      }, 16); // ~60fps, 1px per frame
    } else {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    }
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [autoScroll]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  // Sync fullscreen state on external exit (e.g. Esc key)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Scroll chapter drawer to active chapter when opened
  useEffect(() => {
    if (!showChapterDrawer) return;
    // Small delay to let the drawer slide into view first
    const t = setTimeout(() => {
      const el = drawerListRef.current?.querySelector<HTMLElement>("[data-current='true']");
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 380);
    return () => clearTimeout(t);
  }, [showChapterDrawer]);

  // Resolve params
  useEffect(() => {
    params.then((p) => setResolvedParams({ ...p, slug: fromSeoSlug(p.slug) }));
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
      setNextChapterDetail(null); // reset saat ganti chapter
      const chapters = chapterList?.chapters || [];
      setAllChapters(chapters);
      setLoadedCount(0);
      lastSavedPage.current = 0;
      setPagesReady(false); // will flip to true after render so observer re-attaches

      // Fetch preview chapter berikutnya
      const currentIdx = chapters.findIndex((ch) => ch.slug === chapter.slug);
      if (currentIdx >= 0 && currentIdx < chapters.length - 1) {
        const nextCh = chapters[currentIdx + 1];
        fetchChapterDetail(nextCh.slug).then((detail) => {
          if (detail) setNextChapterDetail(detail);
        });
      }

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

  // Signal that pages are ready to observe AFTER React has rendered them.
  // We depend on chapterDetail so this re-fires whenever a new chapter loads.
  useEffect(() => {
    if (!chapterDetail || !mangaDetail) return;
    // Defer to next paint so the [data-page] elements are in the DOM
    const t = setTimeout(() => setPagesReady(true), 0);
    return () => clearTimeout(t);
  }, [chapterDetail, mangaDetail]);

  // IntersectionObserver: track halaman mana yang sedang dilihat user
  useEffect(() => {
    if (!chapterDetail || !mangaDetail) return;
    if (!token || !isLoggedIn) return;
    if (!pagesReady) return; // wait until DOM elements exist

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
      { threshold: 0.3 } // halaman minimal 30% visible sudah save (lebih responsif)
    );

    const els = document.querySelectorAll("[data-page]");
    console.log(`👁️  IntersectionObserver: found ${els.length} page elements to observe`);
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [chapterDetail, mangaDetail, token, isLoggedIn, saveProgress, pagesReady]);

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
    return `/${type}/${toSeoSlug(slug)}/chapter/${chNum}`;
  }

  return (
    <main className="min-h-screen bg-background chapter-reader">
      {/* Floating Navbar */}
      <header
        style={{
          position: "fixed",
          top: navVisible ? "16px" : "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          transition: "top 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          width: "calc(100% - 32px)",
          maxWidth: "760px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "52px",
            padding: "0 16px",
            borderRadius: "999px",
            background: "rgba(15,15,20,0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          }}
        >
          {/* Back */}
          <Link
            href={`/${type}/${toSeoSlug(slug)}`}
            style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
            className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Kembali</span>
          </Link>

          {/* Manga title — clickable, truncated, fills remaining space */}
          <Link
            href={`/${type}/${toSeoSlug(slug)}`}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "13px",
              fontWeight: 600,
              paddingLeft: "4px",
              paddingRight: "4px",
            }}
            className="text-foreground hover:text-accent transition-colors"
            title={chapterDetail.manga.title}
          >
            {chapterDetail.manga.title}
          </Link>

          {/* Prev / Label / Next */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {prevChapter ? (
              <Link
                href={getChapterUrl(prevChapter)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
                className="text-muted hover:text-foreground hover:border-accent/50 transition-all"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </Link>
            ) : (
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: "13px",
                  opacity: 0.3,
                }}
                className="text-muted cursor-not-allowed select-none"
              >
                ← Prev
              </span>
            )}

            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.06)",
                whiteSpace: "nowrap",
              }}
              className="text-foreground"
            >
              {chapterDetail.chapter_label}
            </span>

            {nextChapter ? (
              <Link
                href={getChapterUrl(nextChapter)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
                className="text-muted hover:text-foreground hover:border-accent/50 transition-all"
              >
                Next
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: "13px",
                  opacity: 0.3,
                }}
                className="text-muted cursor-not-allowed select-none"
              >
                Next →
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Spacer so content doesn't hide under floating nav */}
      <div style={{ height: "80px" }} />

      {/* Progress Bar */}
      {loadedCount < chapterDetail.pages.length && (
        <div className="sticky top-0 z-40 bg-card-bg border-b border-border">
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
      <div
        className="flex flex-col w-full max-w-[800px] mx-auto"
        id="chapter-pages"
        onClick={() => setNavVisible(true)}
      >
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
      <div className="mt-8 flex flex-wrap justify-center gap-4 px-4">
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
          href={`/${type}/${toSeoSlug(slug)}`}
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

      {/* ===== NEXT CHAPTER PREVIEW (Webtoon style) ===== */}
      {nextChapter && nextChapterDetail && (
        <div className="mx-auto max-w-[800px] w-full mt-10 mb-12 px-4">
          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted uppercase tracking-widest font-semibold">Selanjutnya</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Link href={getChapterUrl(nextChapter)} className="group block">
            <div
              className="rounded-xl border border-border bg-card-bg overflow-hidden flex"
              style={{ height: "200px" }}
            >
              {/* Left: title info */}
              <div
                className="flex flex-col justify-center shrink-0 px-5"
                style={{ width: "200px" }}
              >
                <p className="text-xs text-muted mb-1">Selanjutnya</p>
                <h2
                  className="text-foreground font-bold leading-snug group-hover:text-accent transition-colors"
                  style={{
                    fontSize: "15px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {chapterDetail.manga.title}
                </h2>
                <p className="text-xs text-muted mt-2">{nextChapter.chapter_label}</p>
                <div
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white group-hover:bg-accent-hover transition-colors self-start"
                >
                  Baca
                  <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Right: image strip */}
              <div className="relative flex-1 overflow-hidden">
                <div className="flex h-full gap-1">
                  {nextChapterDetail.pages.slice(1, 4).map((page, i) => (
                    <div
                      key={page.id}
                      className="relative flex-1 overflow-hidden"
                      style={{ opacity: i === 0 ? 1 : i === 1 ? 0.7 : 0.35 }}
                    >
                      <img
                        src={`http://127.0.0.1:8000${page.proxy_url}`}
                        alt={`Preview page ${page.page_order}`}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                {/* Subtle left fade so images blend into the info panel */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, var(--color-card-bg, #18181b) 0%, transparent 25%)",
                  }}
                />
                {/* Page count badge */}
                <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                  {nextChapterDetail.total_pages} halaman
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="pb-28" />

      {/* ===== BOTTOM FLOATING BAR ===== */}
      <div
        style={{
          position: "fixed",
          bottom: navVisible ? "20px" : "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          width: "calc(100% - 32px)",
          maxWidth: "480px",
          transition: "bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "52px",
            padding: "0 8px",
            borderRadius: "999px",
            background: "rgba(15,15,20,0.82)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            gap: "4px",
          }}
        >
          {/* Prev */}
          {prevChapter ? (
            <Link
              href={getChapterUrl(prevChapter)}
              title={prevChapter.chapter_label}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "40px", height: "40px", borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0,
              }}
              className="text-muted hover:text-foreground hover:border-accent/60 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.25, flexShrink: 0 }} className="text-muted">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          )}

          {/* Chapter list (···) */}
          <button
            onClick={() => setShowChapterDrawer(true)}
            title="Daftar Chapter"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              flex: 1, height: "36px", borderRadius: "999px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              gap: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
            className="text-foreground hover:bg-white/10 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Chapter</span>
          </button>

          {/* Auto-scroll */}
          <button
            onClick={() => setAutoScroll((v) => !v)}
            title={autoScroll ? "Stop Auto-scroll" : "Auto Scroll"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "40px", height: "40px", borderRadius: "999px",
              border: `1px solid ${autoScroll ? "rgba(var(--accent-rgb,99,102,241),0.7)" : "rgba(255,255,255,0.12)"}`,
              background: autoScroll ? "rgba(var(--accent-rgb,99,102,241),0.18)" : "transparent",
              flexShrink: 0, cursor: "pointer",
            }}
            className={autoScroll ? "text-accent" : "text-muted hover:text-foreground transition-all"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "40px", height: "40px", borderRadius: "999px",
              border: `1px solid ${isFullscreen ? "rgba(var(--accent-rgb,99,102,241),0.7)" : "rgba(255,255,255,0.12)"}`,
              background: isFullscreen ? "rgba(var(--accent-rgb,99,102,241),0.18)" : "transparent",
              flexShrink: 0, cursor: "pointer",
            }}
            className={isFullscreen ? "text-accent" : "text-muted hover:text-foreground transition-all"}
          >
            {isFullscreen ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Next */}
          {nextChapter ? (
            <Link
              href={getChapterUrl(nextChapter)}
              title={nextChapter.chapter_label}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "40px", height: "40px", borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0,
              }}
              className="text-muted hover:text-foreground hover:border-accent/60 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.25, flexShrink: 0 }} className="text-muted">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* ===== CHAPTER DRAWER ===== */}
      {/* Backdrop */}
      {showChapterDrawer && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setShowChapterDrawer(false)}
        />
      )}
      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: showChapterDrawer ? "0px" : "-100%",
          zIndex: 61,
          width: "100%",
          maxWidth: "600px",
          borderRadius: "20px 20px 0 0",
          background: "rgba(15,15,20,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)",
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h3 className="text-base font-bold text-foreground">{chapterDetail.manga.title}</h3>
          <button
            onClick={() => setShowChapterDrawer(false)}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari chapter..."
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "inherit",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Chapter list */}
        <div ref={drawerListRef} style={{ overflowY: "auto", flex: 1, paddingBottom: "24px" }}>
          {allChapters
            .filter((ch) =>
              chapterSearch
                ? ch.chapter_label.toLowerCase().includes(chapterSearch.toLowerCase())
                : true
            )
            .map((ch) => {
              const isCurrent = ch.slug === chapterDetail.slug;
              return (
                <Link
                  key={ch.slug}
                  href={getChapterUrl(ch)}
                  data-current={isCurrent ? "true" : undefined}
                  onClick={() => { setShowChapterDrawer(false); setChapterSearch(""); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 20px",
                    background: isCurrent ? "rgba(var(--accent-rgb,99,102,241),0.15)" : "transparent",
                    borderLeft: isCurrent ? "3px solid var(--color-accent, #6366f1)" : "3px solid transparent",
                  }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <span
                    style={{ fontWeight: isCurrent ? 700 : 500, fontSize: "14px" }}
                    className={isCurrent ? "text-accent" : "text-foreground"}
                  >
                    {ch.chapter_label}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(ch.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </Link>
              );
            })}
          {allChapters.filter((ch) =>
            chapterSearch ? ch.chapter_label.toLowerCase().includes(chapterSearch.toLowerCase()) : true
          ).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted">Tidak ada chapter ditemukan</p>
            )}
        </div>
      </div>
    </main>
  );
}
