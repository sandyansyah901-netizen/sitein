const API_BASE = "http://127.0.0.1:8000/api/v1";

// ─── Types ────────────────────────────────────────────────

export interface ReadingHistoryItem {
    manga_id: number;
    manga_title: string;
    manga_slug: string;
    manga_cover: string;
    chapter_id: number;
    chapter_label: string;
    chapter_slug: string;
    page_number: number;
    total_pages: number;
    last_read_at: string;
}

export interface BookmarkItem {
    manga_id: number;
    manga_title: string;
    manga_slug: string;
    manga_cover: string;
    total_chapters: number;
    latest_chapter: string | null;
    created_at: string;
}

export type ReadingListStatus =
    | "plan_to_read"
    | "reading"
    | "completed"
    | "dropped"
    | "on_hold";

export interface ReadingListItem {
    manga_id: number;
    manga_title: string;
    manga_slug: string;
    manga_cover: string;
    status: ReadingListStatus;
    rating: number | null;
    notes: string | null;
    total_chapters: number;
    read_chapters: number;
    added_at: string;
    updated_at: string;
}

export interface Pagination {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface ReadingStats {
    reading_list: {
        plan_to_read: number;
        reading: number;
        completed: number;
        dropped: number;
        on_hold: number;
    };
    total_in_list: number;
    total_bookmarks: number;
    total_history: number;
}

export interface CheckBookmarkResult {
    manga_slug: string;
    is_bookmarked: boolean;
    created_at: string | null;
}

export interface ReadingListStatusResult {
    manga_slug: string;
    in_list: boolean;
    status: ReadingListStatus | null;
    rating: number | null;
    notes: string | null;
}

// ─── Helper ───────────────────────────────────────────────

function authHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
            typeof err?.detail === "string"
                ? err.detail
                : `HTTP ${res.status}`
        );
    }
    return res.json() as Promise<T>;
}

// ─── Reading History ──────────────────────────────────────

export async function saveReadingProgress(
    token: string,
    mangaSlug: string,
    chapterSlug: string,
    pageNumber: number
): Promise<void> {
    const res = await fetch(`${API_BASE}/reading/save`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
            manga_slug: mangaSlug,
            chapter_slug: chapterSlug,
            page_number: pageNumber,
        }),
    });
    // fire-and-forget: don't throw on error
    if (!res.ok) console.warn("[reading/save] error:", res.status);
}

export async function getReadingHistory(
    token: string,
    page = 1,
    pageSize = 20
): Promise<{ items: ReadingHistoryItem[]; pagination: Pagination }> {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
    });
    const res = await fetch(`${API_BASE}/reading/history?${params}`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    return handleResponse(res);
}

export async function deleteReadingHistory(
    token: string,
    mangaSlug: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/reading/history/manga/${mangaSlug}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    await handleResponse(res);
}

// ─── Bookmarks ────────────────────────────────────────────

export async function getBookmarks(
    token: string,
    page = 1,
    pageSize = 20,
    sortBy: "created_at" | "title" | "updated_at" = "created_at",
    sortOrder: "asc" | "desc" = "desc"
): Promise<{ items: BookmarkItem[]; pagination: Pagination }> {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
    });
    const res = await fetch(`${API_BASE}/bookmarks/?${params}`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    return handleResponse(res);
}

export async function addBookmark(
    token: string,
    mangaSlug: string
): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/bookmarks/manga/${mangaSlug}`, {
        method: "POST",
        headers: authHeaders(token),
    });
    return handleResponse(res);
}

export async function removeBookmark(
    token: string,
    mangaSlug: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/bookmarks/manga/${mangaSlug}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    await handleResponse(res);
}

export async function checkBookmark(
    token: string,
    mangaSlug: string
): Promise<CheckBookmarkResult> {
    const res = await fetch(`${API_BASE}/bookmarks/check/${mangaSlug}`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    return handleResponse(res);
}

// ─── Reading Lists ────────────────────────────────────────

export async function getReadingLists(
    token: string,
    status?: ReadingListStatus | null,
    page = 1,
    pageSize = 20,
    sortBy: "updated_at" | "added_at" | "title" | "rating" = "updated_at",
    sortOrder: "asc" | "desc" = "desc"
): Promise<{ items: ReadingListItem[]; pagination: Pagination }> {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
    });
    if (status) params.set("status", status);
    const res = await fetch(`${API_BASE}/lists/?${params}`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    return handleResponse(res);
}

export async function addToReadingList(
    token: string,
    mangaSlug: string,
    status: ReadingListStatus,
    rating?: number | null,
    notes?: string | null
): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/lists/`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ manga_slug: mangaSlug, status, rating, notes }),
    });
    return handleResponse(res);
}

export async function removeFromReadingList(
    token: string,
    mangaSlug: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/lists/manga/${mangaSlug}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    await handleResponse(res);
}

export async function getMangaListStatus(
    token: string,
    mangaSlug: string
): Promise<ReadingListStatusResult> {
    const res = await fetch(`${API_BASE}/lists/status/${mangaSlug}`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    return handleResponse(res);
}

export async function getReadingStats(
    token: string
): Promise<ReadingStats> {
    const res = await fetch(`${API_BASE}/lists/stats`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    return handleResponse(res);
}
