import { notFound } from "next/navigation";
import { fetchMangaDetail, fetchChapterList } from "@/app/lib/api";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}

function getTypeColor(typeSlug?: string) {
  switch (typeSlug) {
    case "manga":
      return "bg-blue-600";
    case "manhwa":
      return "bg-green-600";
    case "manhua":
      return "bg-orange-600";
    case "novel":
      return "bg-purple-600";
    case "doujinshi":
      return "bg-pink-600";
    case "one-shot":
      return "bg-indigo-600";
    default:
      return "bg-gray-600";
  }
}

function formatChapterNumber(chapterMain: number, chapterSub: number): string {
  if (chapterSub > 0) {
    return `${chapterMain}.${chapterSub}`;
  }
  return `${chapterMain}`;
}

function padChapterNumber(chapterMain: number, chapterSub: number): string {
  const mainPadded = String(chapterMain).padStart(3, "0");
  if (chapterSub > 0) {
    const subPadded = String(chapterSub).padStart(2, "0");
    return `${mainPadded}-${subPadded}`;
  }
  return mainPadded;
}

export default async function MangaDetailPage({ params }: PageProps) {
  const { type, slug } = await params;

  console.log("🔍 Detail page params:", { type, slug });

  // Fetch manga detail dan chapters parallel
  const [manga, chapterData] = await Promise.all([
    fetchMangaDetail(slug),
    fetchChapterList(slug, { page_size: 200, sort_order: "desc" }),
  ]);

  // Jika manga tidak ditemukan
  if (!manga) {
    notFound();
  }

  // Validasi: pastikan type di URL sesuai dengan type manga
  if (manga.type?.slug !== type) {
    console.warn(
      `⚠️ Type mismatch: URL=${type}, Manga=${manga.type?.slug}. Redirecting...`
    );
    notFound();
  }

  const coverUrl =
    manga.cover_url ||
    "https://via.placeholder.com/400x600/1a1a2e/666?text=No+Cover";

  const chapters = chapterData?.chapters || [];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span>›</span>
        <Link
          href={`/?type_slug=${type}`}
          className="capitalize hover:text-accent"
        >
          {manga.type?.name}
        </Link>
        <span>›</span>
        <span className="text-foreground">{manga.title}</span>
      </nav>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div className="mx-auto w-full max-w-sm lg:mx-0">
          <img
            src={coverUrl}
            alt={manga.title}
            className="w-full rounded-lg shadow-2xl"
          />
        </div>

        {/* Info */}
        <div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {manga.title}
          </h1>

          {/* Alternative Titles */}
          {manga.alt_titles && manga.alt_titles.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted">
                {manga.alt_titles.join(" • ")}
              </p>
            </div>
          )}

          {/* Type & Status */}
          <div className="mb-4 flex flex-wrap gap-2">
            {manga.type && (
              <span
                className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${getTypeColor(manga.type.slug)}`}
              >
                {manga.type.name}
              </span>
            )}
            {manga.status && (
              <span className="rounded bg-card-bg px-3 py-1 text-xs font-semibold capitalize text-muted">
                {manga.status}
              </span>
            )}
          </div>

          {/* Genres */}
          {manga.genres && manga.genres.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-muted">Genre:</h2>
              <div className="flex flex-wrap gap-2">
                {manga.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/?genre_slug=${genre.slug}`}
                    className="rounded-lg border border-border bg-card-bg px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {manga.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                Sinopsis
              </h2>
              <p className="leading-relaxed text-muted">{manga.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-card-bg p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Total Chapter</p>
              <p className="text-xl font-bold text-foreground">
                {manga.total_chapters || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Status</p>
              <p className="text-xl font-bold capitalize text-foreground">
                {manga.status || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Terakhir Update</p>
              <p className="text-sm font-semibold text-foreground">
                {manga.updated_at
                  ? new Date(manga.updated_at).toLocaleDateString("id-ID")
                  : "-"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {chapters.length > 0 && (
            <div className="flex gap-3">
              <Link
                href={`/${type}/${slug}/chapter/${padChapterNumber(chapters[0].chapter_main, chapters[0].chapter_sub)}`}
                className="flex-1 rounded-lg bg-accent px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Baca Chapter Terbaru
              </Link>
              <button className="rounded-lg border border-border bg-card-bg px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                Bookmark
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chapters List */}
      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          Daftar Chapter ({chapterData?.total_chapters || 0})
        </h2>

        {chapters.length === 0 ? (
          <div className="rounded-lg bg-card-bg p-8 text-center">
            <p className="text-muted">Belum ada chapter tersedia</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => {
              const chapterNum = padChapterNumber(
                chapter.chapter_main,
                chapter.chapter_sub
              );
              const previewUrl =
                chapter.preview_url ||
                "https://via.placeholder.com/300x400/1a1a2e/666?text=Ch+" +
                  formatChapterNumber(chapter.chapter_main, chapter.chapter_sub);

              return (
                <Link
                  key={chapter.id}
                  href={`/${type}/${slug}/chapter/${chapterNum}`}
                  className="group overflow-hidden rounded-lg border border-border bg-card-bg transition-all hover:border-accent hover:bg-card-hover"
                >
                  {/* Preview Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={previewUrl}
                      alt={chapter.chapter_label}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="mb-1 text-sm font-bold text-white">
                        {chapter.chapter_label}
                      </p>
                      <p className="text-xs text-gray-300">
                        {chapter.total_pages} halaman
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs text-muted">
                      Upload:{" "}
                      {new Date(chapter.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const manga = await fetchMangaDetail(slug);

  if (!manga) {
    return {
      title: "Manga Not Found",
    };
  }

  return {
    title: `${manga.title} - ${manga.type?.name || "Komik"} | KomikHub`,
    description: manga.description || `Baca ${manga.title} di KomikHub`,
  };
}