import { Suspense } from "react";
import { fetchMangaList, fetchGenres, fetchMangaTypes } from "@/app/lib/api";
import MangaCard from "@/app/components/MangaCard";
import SearchBar from "@/app/components/SearchBar";
import FilterBar from "@/app/components/FilterBar";
import Pagination from "@/app/components/Pagination";

interface HomeProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type_slug?: string;
    genre_slug?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  }>;
}

async function MangaGrid({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    type_slug?: string;
    genre_slug?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  };
}) {
  const mangaList = await fetchMangaList({
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    page_size: 20,
    search: searchParams.search,
    type_slug: searchParams.type_slug,
    genre_slug: searchParams.genre_slug,
    status: searchParams.status,
    sort_by: searchParams.sort_by || "updated_at",
    sort_order: searchParams.sort_order || "desc",
  });

  // Defensive: pastikan mangaList dan mangaList.data ada
  if (!mangaList || !mangaList.data || mangaList.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          className="mb-4 h-16 w-16 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-foreground">
          Tidak ada hasil
        </h3>
        <p className="mt-1 text-sm text-muted">
          Coba ubah kata kunci atau filter pencarian
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Results info */}
      <div className="mb-4 text-sm text-muted">
        Menampilkan {mangaList.data.length} dari {mangaList.total || 0} komik
      </div>

      {/* Manga grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {mangaList.data.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>

      {/* Pagination */}
      {mangaList.total_pages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={mangaList.page}
            totalPages={mangaList.total_pages}
          />
        </div>
      )}
    </>
  );
}

function MangaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-lg bg-card-bg" />
          <div className="mt-2 h-4 w-3/4 rounded bg-card-bg" />
          <div className="mt-1 h-3 w-1/2 rounded bg-card-bg" />
        </div>
      ))}
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedParams = await searchParams;

  // Fetch dengan error handling
  const [genres, types] = await Promise.all([
    fetchGenres().catch(() => []),
    fetchMangaTypes().catch(() => []),
  ]);

  const hasActiveFilters =
    resolvedParams.search ||
    resolvedParams.type_slug ||
    resolvedParams.genre_slug ||
    resolvedParams.status;

  // Get type name untuk display
  const currentType = types.find((t) => t.slug === resolvedParams.type_slug);
  const currentGenre = genres.find((g) => g.slug === resolvedParams.genre_slug);

  // Build title yang lebih informatif
  let sectionTitle = "Update Terbaru";
  if (resolvedParams.search) {
    sectionTitle = `Hasil pencarian: "${resolvedParams.search}"`;
  } else if (currentType && currentGenre) {
    sectionTitle = `${currentType.name} - ${currentGenre.name}`;
  } else if (currentType) {
    sectionTitle = `Komik ${currentType.name}`;
  } else if (currentGenre) {
    sectionTitle = `Genre ${currentGenre.name}`;
  } else if (resolvedParams.status) {
    sectionTitle = `Status: ${resolvedParams.status === "ongoing" ? "Ongoing" : "Completed"}`;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero Section */}
      {!hasActiveFilters && (
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-accent/20 via-card-bg to-purple-900/20 px-6 py-12 text-center sm:px-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Baca Komik Favoritmu di{" "}
            <span className="text-accent">KomikHub</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted">
            Koleksi lengkap manga, manhwa, dan manhua terupdate. Gratis, cepat,
            dan tanpa iklan mengganggu.
          </p>
          <div className="mt-6 flex justify-center">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>
        </section>
      )}

      {/* Search bar when filtered */}
      {hasActiveFilters && (
        <div className="mb-6">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      )}

      {/* Filters */}
      <section className="mb-6">
        <Suspense>
          <FilterBar genres={genres} types={types} />
        </Suspense>
      </section>

      {/* Section title */}
      <h2 className="mb-4 text-xl font-bold text-foreground">
        {sectionTitle}
      </h2>

      {/* Manga Grid */}
      <Suspense fallback={<MangaGridSkeleton />}>
        <MangaGrid searchParams={resolvedParams} />
      </Suspense>

      {/* Footer */}
      <footer className="mt-16 border-t border-border py-8 text-center text-sm text-muted">
        <p>© 2026 KomikHub. Semua hak cipta dilindungi.</p>
        <p className="mt-1">
          Dibuat dengan ❤️ menggunakan Next.js & Tailwind CSS
        </p>
      </footer>
    </main>
  );
}