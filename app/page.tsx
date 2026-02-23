import { fetchMangaList, fetchGenres, fetchMangaTypes } from "@/app/lib/api";
import SiteHeader from "@/app/components/SiteHeader";
import SiteHeroBanner from "@/app/components/SiteHeroBanner";
import SiteUpdateSection from "@/app/components/SiteUpdateSection";
import SiteComicSection from "@/app/components/SiteComicSection";
import SiteTopRanking from "@/app/components/SiteTopRanking";
import SiteFooter from "@/app/components/SiteFooter";

export default async function Home() {
  const [mangaList] = await Promise.all([
    fetchMangaList({
      page: 1,
      page_size: 30,
      sort_by: "updated_at",
      sort_order: "desc",
    }).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      page_size: 30,
      total_pages: 0,
    })),
    fetchGenres().catch(() => []),
    fetchMangaTypes().catch(() => []),
  ]);

  const allMangas = mangaList.data;
  const heroBannerMangas = allMangas.slice(0, 3);
  const updateMangas = allMangas.slice(0, 14);

  const manhwaMangas = allMangas
    .filter((m) => m.type?.slug === "manhwa")
    .slice(0, 14);
  const manhuaMangas = allMangas
    .filter((m) => m.type?.slug === "manhua")
    .slice(0, 14);
  const mangaMangas = allMangas
    .filter((m) => m.type?.slug === "manga")
    .slice(0, 14);

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#0a0a0a]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
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
      <SiteUpdateSection mangas={updateMangas} />

      <div className="max-w-[1200px] mx-auto px-3 pt-4">
        <div className="h-px bg-gray-100 dark:bg-[#1a1a1a]" />
      </div>

      {manhwaMangas.length > 0 && (
        <SiteComicSection
          title="Manhwa"
          mangas={manhwaMangas}
          seeAllHref="/?type_slug=manhwa"
        />
      )}
      {manhuaMangas.length > 0 && (
        <SiteComicSection
          title="Manhua"
          mangas={manhuaMangas}
          seeAllHref="/?type_slug=manhua"
        />
      )}
      {mangaMangas.length > 0 && (
        <SiteComicSection
          title="Manga"
          mangas={mangaMangas}
          seeAllHref="/?type_slug=manga"
        />
      )}

      <div className="max-w-[1200px] mx-auto px-3 pt-4">
        <div className="h-2 bg-gray-50 dark:bg-[#111] rounded" />
      </div>

      <SiteTopRanking title="Webtoon Top 300" mangas={allMangas.slice(0, 10)} />
      <SiteTopRanking
        title="Novel Top 300"
        mangas={allMangas.slice(10, 20)}
      />

      <SiteFooter />
    </div>
  );
}