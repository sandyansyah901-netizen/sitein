import { fetchMangaList, fetchChapterList, fetchGenres, fetchMangaTypes } from "@/app/lib/api";
import SiteHeader from "@/app/components/SiteHeader";
import SiteHeroBanner from "@/app/components/SiteHeroBanner";
import SiteUpdateSection from "@/app/components/SiteUpdateSection";
import SiteComicSection from "@/app/components/SiteComicSection";
import SiteTopRanking from "@/app/components/SiteTopRanking";
import SiteFooter from "@/app/components/SiteFooter";

const UPDATE_PER_PAGE = 21;

interface Props {
  searchParams: Promise<{ update_page?: string;[key: string]: string | undefined }>;
}

export default async function Home({ searchParams }: Props) {
  const sp = await searchParams;
  const updatePage = Math.max(1, parseInt(sp.update_page ?? "1", 10));

  // Fetch manga list untuk update section (21 per page) dan general list
  const [updateList, allList] = await Promise.all([
    fetchMangaList({
      page: updatePage,
      page_size: UPDATE_PER_PAGE,
      sort_by: "updated_at",
      sort_order: "desc",
    }).catch(() => ({ data: [], total: 0, page: updatePage, page_size: UPDATE_PER_PAGE, total_pages: 0 })),
    fetchMangaList({
      page: 1,
      page_size: 30,
      sort_by: "updated_at",
      sort_order: "desc",
    }).catch(() => ({ data: [], total: 0, page: 1, page_size: 30, total_pages: 0 })),
    fetchGenres().catch(() => []),
    fetchMangaTypes().catch(() => []),
  ]);

  const allMangas = allList.data;
  const heroBannerMangas = allMangas.slice(0, 3);

  // Fetch 2 chapter terakhir untuk setiap manga di update section
  const updateMangasSlugs = updateList.data.map((m) => m.slug);
  const chapterResults = await Promise.all(
    updateMangasSlugs.map((slug) =>
      fetchChapterList(slug, { page_size: 2, sort_order: "desc" }).catch(() => null)
    )
  );

  // Inject latest_chapters ke manga, sort by chapter terbaru
  const updateMangas = updateList.data.map((manga, i) => {
    const chData = chapterResults[i];
    return {
      ...manga,
      latest_chapters: chData?.chapters?.slice(0, 2).map((ch) => ({
        label: ch.chapter_label,
        slug: ch.slug,
        chapter_main: ch.chapter_main,
        chapter_sub: ch.chapter_sub,
        created_at: ch.created_at,
      })) ?? [],
    };
  }).sort((a, b) => {
    const aDate = a.latest_chapters?.[0]?.created_at ?? a.updated_at ?? "";
    const bDate = b.latest_chapters?.[0]?.created_at ?? b.updated_at ?? "";
    return bDate.localeCompare(aDate);
  });

  const manhwaMangas = allMangas.filter((m) => m.type?.slug === "manhwa").slice(0, 14);
  const manhuaMangas = allMangas.filter((m) => m.type?.slug === "manhua").slice(0, 14);
  const mangaMangas = allMangas.filter((m) => m.type?.slug === "manga").slice(0, 14);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SiteHeader />

      {/* Promo Bar */}
      <div className="max-w-[1200px] mx-auto px-3 pt-3 pb-1">
        <div className="bg-[#eee] dark:bg-[#1a1a1a] rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#e5e5e5] dark:hover:bg-[#222] transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">💘</span>
            <span className="text-[14px] text-[#222] dark:text-gray-200 font-bold">
              Your PICK is waiting for you
            </span>
          </div>
          <span className="text-gray-400 dark:text-gray-600 text-[18px]">›</span>
        </div>
      </div>

      <SiteHeroBanner mangas={heroBannerMangas} />
      <SiteUpdateSection
        mangas={updateMangas}
        currentPage={updatePage}
        totalPages={updateList.total_pages}
      />

      <div className="max-w-[1200px] mx-auto px-3 pt-4">
        <div className="h-px bg-gray-100 dark:bg-[#1a1a1a]" />
      </div>

      {manhwaMangas.length > 0 && (
        <SiteComicSection title="Manhwa" mangas={manhwaMangas} seeAllHref="/?type_slug=manhwa" />
      )}
      {manhuaMangas.length > 0 && (
        <SiteComicSection title="Manhua" mangas={manhuaMangas} seeAllHref="/?type_slug=manhua" />
      )}
      {mangaMangas.length > 0 && (
        <SiteComicSection title="Manga" mangas={mangaMangas} seeAllHref="/?type_slug=manga" />
      )}

      <div className="max-w-[1200px] mx-auto px-3 pt-4">
        <div className="h-2 bg-gray-50 dark:bg-[#111] rounded" />
      </div>

      <SiteTopRanking title="Webtoon Top 300" mangas={allMangas.slice(0, 10)} />
      <SiteTopRanking title="Novel Top 300" mangas={allMangas.slice(10, 20)} />

      <SiteFooter />
    </div>
  );
}