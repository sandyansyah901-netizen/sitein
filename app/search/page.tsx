import { fetchMangaList } from "@/app/lib/api";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";
import MangaCard from "@/app/components/MangaCard";
import SearchPagination from "@/app/components/SearchPagination";
import type { Metadata } from "next";

interface SearchPageProps {
    searchParams: Promise<{ search?: string; page?: string }>;
}

export async function generateMetadata({
    searchParams,
}: SearchPageProps): Promise<Metadata> {
    const { search } = await searchParams;
    return {
        title: search ? `Hasil pencarian "${search}" — Sitein` : "Pencarian — Sitein",
        description: search
            ? `Temukan manga, manhwa, manhua untuk "${search}" di Sitein.`
            : "Cari komik favoritmu di Sitein.",
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { search, page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page ?? "1", 10));
    const PAGE_SIZE = 24;

    const result = await fetchMangaList({
        search: search ?? "",
        page: currentPage,
        page_size: PAGE_SIZE,
        sort_by: "updated_at",
        sort_order: "desc",
    }).catch(() => ({
        data: [],
        total: 0,
        page: currentPage,
        page_size: PAGE_SIZE,
        total_pages: 0,
    }));

    const mangas = result.data;
    const totalPages = result.total_pages;
    const total = result.total;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <SiteHeader />

            <main className="max-w-[1200px] mx-auto px-4 py-6">
                {/* Header pencarian */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-[#222] dark:text-white">
                        {search ? (
                            <>
                                Hasil untuk{" "}
                                <span className="text-[#E50914]">"{search}"</span>
                            </>
                        ) : (
                            "Semua Komik"
                        )}
                    </h1>
                    {total > 0 && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {total.toLocaleString("id-ID")} hasil ditemukan
                        </p>
                    )}
                </div>

                {/* Grid hasil */}
                {mangas.length > 0 ? (
                    <>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                            {mangas.map((manga) => (
                                <MangaCard key={manga.id} manga={manga} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8">
                                <SearchPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    search={search ?? ""}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h2 className="text-lg font-semibold text-[#222] dark:text-white mb-2">
                            {search
                                ? `Tidak ada hasil untuk "${search}"`
                                : "Belum ada komik"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            {search
                                ? "Coba gunakan kata kunci lain atau periksa ejaan kamu."
                                : "Coba masukkan kata kunci di search bar."}
                        </p>
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
