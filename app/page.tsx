import { fetchMangaList } from "@/app/lib/api";
import SiteHeader from "@/app/components/SiteHeader";
import SiteHeroBanner, { type BannerSlotConfig } from "@/app/components/SiteHeroBanner";
import SiteUpdateSection from "@/app/components/SiteUpdateSection";
import SiteComicSection from "@/app/components/SiteComicSection";
import SiteTopRanking from "@/app/components/SiteTopRanking";
import SiteFooter from "@/app/components/SiteFooter";

const UPDATE_PER_PAGE = 21;
const API_BASE = "http://127.0.0.1:8000/api/v1";

interface Props {
  searchParams: Promise<{ update_page?: string;[key: string]: string | undefined }>;
}

// Fetch banner config dari API (server-side, no auth needed)
async function fetchBannerConfig(): Promise<BannerSlotConfig[]> {
  try {
    const res = await fetch(`${API_BASE}/banners`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slots ?? [];
  } catch {
    return [];
  }
}

export default async function Home({ searchParams }: Props) {
  const sp = await searchParams;
  const updatePage = Math.max(1, parseInt(sp.update_page ?? "1", 10));

  // ✅ OPTIMIZED: Fetch per-tipe (query lebih ringan, dijamin dapat 14 per tipe)
  // Semua berjalan paralel — latency sama dengan 1 request
  const [updateList, manhwaList, manhuaList, mangaList, bannerConfig] = await Promise.all([
    fetchMangaList({
      page: updatePage,
      page_size: UPDATE_PER_PAGE,
      sort_by: "latest_chapter",
      sort_order: "desc",
    }).catch(() => ({ data: [], total: 0, page: updatePage, page_size: UPDATE_PER_PAGE, total_pages: 0 })),
    fetchMangaList({ page_size: 14, sort_by: "latest_chapter", sort_order: "desc", type_slug: "manhwa" })
      .catch(() => ({ data: [] })),
    fetchMangaList({ page_size: 14, sort_by: "latest_chapter", sort_order: "desc", type_slug: "manhua" })
      .catch(() => ({ data: [] })),
    fetchMangaList({ page_size: 14, sort_by: "latest_chapter", sort_order: "desc", type_slug: "manga" })
      .catch(() => ({ data: [] })),
    fetchBannerConfig(),
  ]);

  // Hero banner: pakai 3 manga paling baru dari update section
  const heroBannerMangas = updateList.data.slice(0, 3);

  const manhwaMangas = manhwaList.data;
  const manhuaMangas = manhuaList.data;
  const mangaMangas = mangaList.data;

  // TopRanking: pakai updateList (sudah sorted by latest chapter)
  const topRankingMangas = updateList.data;

  // ✅ OPTIMIZED: latest_chapters sudah ada di response /manga — tidak perlu 21 request terpisah
  const updateMangas = updateList.data.map((manga) => ({
    ...manga,
    latest_chapters: manga.latest_chapters ?? [],
  })).sort((a, b) => {
    const toMs = (s?: string) => {
      if (!s) return 0;
      const normalized = s.endsWith("Z") || s.includes("+") ? s : s + "Z";
      return new Date(normalized).getTime();
    };
    const aMs = toMs(a.latest_chapters?.[0]?.created_at ?? a.updated_at);
    const bMs = toMs(b.latest_chapters?.[0]?.created_at ?? b.updated_at);
    return bMs - aMs;
  });



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

      <SiteHeroBanner mangas={heroBannerMangas} bannerConfig={bannerConfig} />
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

      <SiteTopRanking title="Webtoon Top 300" mangas={topRankingMangas.slice(0, 10)} />
      <SiteTopRanking title="Novel Top 300" mangas={topRankingMangas.slice(10, 20)} />

      <SiteFooter />
    </div>
  );
}