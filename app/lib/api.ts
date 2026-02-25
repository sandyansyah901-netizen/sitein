const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// Helper: Retry logic untuk handle 502
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        // Tambah timeout
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      // Jika 502, retry
      if (res.status === 502 && i < retries - 1) {
        console.warn(`⚠️ 502 error, retrying (${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }

      return res;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`⚠️ Network error, retrying (${i + 1}/${retries})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

export interface Manga {
  id: number;
  slug: string;
  title: string;
  cover_url?: string | null;
  description?: string;
  status?: string;
  type?: {
    id: number;
    name: string;
    slug: string;
  };
  genres?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  total_chapters?: number;
  latest_chapter?: string | null;
  latest_chapters?: Array<{
    label: string;
    slug: string;
    chapter_main: number;
    chapter_sub: number;
    created_at: string;
  }>;
  updated_at?: string;
  created_at?: string;
  alt_titles?: string[];
}

export interface Chapter {
  id: number;
  chapter_main: number;
  chapter_sub: number;
  chapter_label: string;
  slug: string;
  total_pages: number;
  preview_url?: string | null;
  anchor_path?: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface ChapterPage {
  id: number;
  page_order: number;
  gdrive_file_id: string;
  is_anchor: boolean;
  proxy_url: string;
}

export interface ChapterDetail {
  id: number;
  chapter_main: number;
  chapter_sub: number;
  chapter_label: string;
  slug: string;
  manga: {
    id: number;
    title: string;
    slug: string;
  };
  pages: ChapterPage[];
  total_pages: number;
  uploaded_by: string;
  created_at: string;
}

export interface ChapterListResponse {
  manga_slug: string;
  manga_title: string;
  total_chapters: number;
  chapters: Chapter[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface MangaListResponse {
  items: Manga[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface Genre {
  id: number;
  slug: string;
  name: string;
  total_manga?: number;
}

export interface MangaType {
  id: number;
  slug: string;
  name: string;
  total_manga?: number;
}

interface GenresResponse {
  genres: Genre[];
}

interface TypesResponse {
  types: MangaType[];
}

export async function fetchMangaList(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  type_slug?: string;
  genre_slug?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<{
  data: Manga[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size)
    searchParams.set("page_size", params.page_size.toString());
  if (params?.search) searchParams.set("search", params.search);
  if (params?.type_slug) searchParams.set("type_slug", params.type_slug);
  if (params?.genre_slug) searchParams.set("genre_slug", params.genre_slug);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

  const url = `${API_BASE_URL}/manga/?${searchParams.toString()}`;

  try {
    console.log("🔵 Fetching manga list from:", url);
    const res = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("❌ API error:", res.status, res.statusText);
      throw new Error(`API error: ${res.status}`);
    }

    const json: MangaListResponse = await res.json();
    console.log("✅ Manga list fetched:", json.pagination.total, "items");

    json.items.forEach((manga) => {
      console.log(
        `📦 ${manga.title} → Type: ${manga.type?.name} (${manga.type?.slug})`
      );
    });

    return {
      data: json.items,
      total: json.pagination.total,
      page: json.pagination.page,
      page_size: json.pagination.page_size,
      total_pages: json.pagination.total_pages,
    };
  } catch (error) {
    console.error("❌ Failed to fetch manga list:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
    };
  }
}

export async function fetchGenres(): Promise<Genre[]> {
  const url = `${API_BASE_URL}/manga/genres`;

  try {
    console.log("🔵 Fetching genres from:", url);
    const res = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const json: GenresResponse = await res.json();
    console.log("✅ Genres fetched:", json.genres.length, "items");

    if (!Array.isArray(json.genres)) {
      throw new Error("Invalid genres response");
    }

    return json.genres;
  } catch (error) {
    console.error("❌ Failed to fetch genres:", error);
    return [];
  }
}

export async function fetchMangaTypes(): Promise<MangaType[]> {
  const url = `${API_BASE_URL}/manga/types`;

  try {
    console.log("🔵 Fetching manga types from:", url);
    const res = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const json: TypesResponse = await res.json();
    console.log("✅ Manga types fetched:", json.types.length, "items");

    if (!Array.isArray(json.types)) {
      throw new Error("Invalid manga types response");
    }

    return json.types;
  } catch (error) {
    console.error("❌ Failed to fetch manga types:", error);
    return [];
  }
}

export async function fetchMangaDetail(slug: string): Promise<Manga | null> {
  const url = `${API_BASE_URL}/manga/${slug}`;

  try {
    console.log("🔵 Fetching manga detail from:", url);
    const res = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("❌ API error:", res.status, res.statusText);
      throw new Error(`API error: ${res.status}`);
    }

    const data: Manga = await res.json();
    console.log("✅ Manga detail fetched:", {
      title: data.title,
      type: data.type,
    });
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch manga detail:", error);
    return null;
  }
}

export async function fetchChapterList(
  mangaSlug: string,
  params?: {
    page?: number;
    page_size?: number;
    sort_order?: "asc" | "desc";
  }
): Promise<ChapterListResponse | null> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size)
    searchParams.set("page_size", params.page_size.toString());
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

  const url = `${API_BASE_URL}/chapter/manga/${mangaSlug}?${searchParams.toString()}`;

  try {
    console.log("🔵 Fetching chapter list from:", url);
    const res = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("❌ API error:", res.status, res.statusText);
      throw new Error(`API error: ${res.status}`);
    }

    const data: ChapterListResponse = await res.json();
    console.log("✅ Chapter list fetched:", data.total_chapters, "chapters");
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch chapter list:", error);
    return null;
  }
}

export async function fetchChapterDetail(
  chapterSlug: string
): Promise<ChapterDetail | null> {
  const url = `${API_BASE_URL}/chapter/${chapterSlug}`;

  try {
    console.log("🔵 Fetching chapter detail from:", url);
    const res = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("❌ API error:", res.status, res.statusText);
      throw new Error(`API error: ${res.status}`);
    }

    const data: ChapterDetail = await res.json();
    console.log("✅ Chapter detail fetched:", {
      chapter: data.chapter_label,
      pages: data.total_pages,
    });
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch chapter detail:", error);
    return null;
  }
}

// Helper: Convert chapter number to slug format
export function chapterNumToSlug(
  mangaSlug: string,
  chapterMain: number,
  chapterSub: number
): string {
  if (chapterSub > 0) {
    return `${mangaSlug}-chapter-${chapterMain}-${chapterSub}`;
  }
  return `${mangaSlug}-chapter-${chapterMain}`;
}

// Helper: Parse chapter number from URL format (001 or 001-01)
export function parseChapterNum(chapterNum: string): {
  main: number;
  sub: number;
} {
  const parts = chapterNum.split("-");
  const main = parseInt(parts[0], 10);
  const sub = parts[1] ? parseInt(parts[1], 10) : 0;
  return { main, sub };
}