import { notFound } from "next/navigation";
import { fetchMangaDetail, fetchChapterList, fetchMangaList } from "@/app/lib/api";
import { fromSeoSlug } from "@/app/lib/utils";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";
import ComicDetailClient from "@/app/components/ComicDetailClient";

interface PageProps {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}

export default async function ComicDetailPage({ params }: PageProps) {
  const { type, slug: rawSlug } = await params;
  const slug = fromSeoSlug(rawSlug);

  const [manga, chapterData, recommendedList] = await Promise.all([
    fetchMangaDetail(slug),
    fetchChapterList(slug, { page_size: 50, sort_order: "asc" }),
    fetchMangaList({
      page: 1,
      page_size: 6,
      sort_by: "updated_at",
      sort_order: "desc",
    }).catch(() => ({ data: [] })),
  ]);

  if (!manga) {
    notFound();
  }

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#0a0a0a]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <SiteHeader />
      <div className="pb-8 pt-2">
        <ComicDetailClient
          manga={manga}
          chapters={chapterData?.chapters || []}
          totalChapters={
            chapterData?.total_chapters || manga.total_chapters || 0
          }
          recommended={recommendedList.data}
          typeSlug={type}
        />
      </div>
      <SiteFooter />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = fromSeoSlug(rawSlug);
  const manga = await fetchMangaDetail(slug);

  if (!manga) {
    return { title: "Manga Not Found" };
  }

  return {
    title: `${manga.title} - ${manga.type?.name || "Komik"} | Sitein`,
    description: manga.description || `Baca ${manga.title} di Sitein`,
  };
}