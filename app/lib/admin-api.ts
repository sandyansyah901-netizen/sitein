const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
export const API_BASE = "http://127.0.0.1:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("komik_token") ?? "";
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<unknown> {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Normalize cover URL dari berbagai format ke path relatif
 * yang akan di-proxy oleh Next.js rewrite ke backend.
 *
 * Next.js rewrite config:
 *   /static/:path*  → http://127.0.0.1:8000/static/:path*
 *   /covers/:path*  → http://127.0.0.1:8000/covers/:path*
 *
 * - null/undefined                                        → null
 * - "http://127.0.0.1:8000/static/covers/x.webp"        → "/static/covers/x.webp"
 * - "http://localhost:8000/static/covers/x.webp"         → "/static/covers/x.webp"
 * - "https://external.com/image.jpg"                     → "https://external.com/image.jpg" (pakai langsung)
 * - "/static/covers/x.webp"                              → "/static/covers/x.webp"
 * - "/covers/x.webp"                                     → "/covers/x.webp"
 * - "covers/x.webp"                                      → "/static/covers/x.webp"
 * - "x.webp"                                             → "/static/covers/x.webp"
 */
export function normalizeCoverUrl(coverPath: string | null | undefined): string | null {
  if (!coverPath) return null;

  // URL dari backend lokal — ambil pathname-nya saja (akan di-proxy Next.js)
  if (
    coverPath.startsWith("http://127.0.0.1:8000") ||
    coverPath.startsWith("http://localhost:8000")
  ) {
    const url = new URL(coverPath);
    return url.pathname; // → "/static/covers/x.webp"
  }

  // External URL (bukan backend lokal) — pakai langsung
  if (coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
    return coverPath;
  }

  // Sudah path dengan leading slash — pakai langsung (Next.js proxy akan handle)
  if (coverPath.startsWith("/")) {
    return coverPath;
  }

  // "covers/x.webp" → "/static/covers/x.webp"
  if (coverPath.startsWith("covers/")) {
    return `/static/${coverPath}`;
  }

  // Nama file saja: "x.webp" → "/static/covers/x.webp"
  return `/static/covers/${coverPath}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminStats {
  [key: string]: unknown;
}

export interface AdminRole {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  roles?: string[] | Array<{ id: number; name: string }>;
}

export interface AdminUsersResponse {
  items?: AdminUser[];
  users?: AdminUser[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
}

export interface StorageSource {
  id: number;
  name?: string;
  remote_name?: string;
  status?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface AdminManga {
  id: number;
  title: string;
  slug: string;
  description?: string;
  cover_url?: string | null;
  status?: string;
  type?: { id: number; name: string; slug: string };
  genres?: Array<{ id: number; name: string; slug: string }>;
  total_chapters?: number;
  storage_id?: number;
  storage?: { id: number; name?: string; remote_name?: string };
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdminMangaListResponse {
  items?: AdminManga[];
  manga?: AdminManga[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
}

export interface AdminChapter {
  id: number;
  chapter_main: number;
  chapter_sub: number;
  chapter_label: string;
  slug: string;
  total_pages?: number;
  volume_number?: number;
  chapter_type?: string;
  anchor_path?: string | null;
  preview_url?: string | null;
  chapter_folder_name?: string;
  uploaded_by?: string;
  created_at?: string;
  manga?: { id: number; title: string; slug: string };
  [key: string]: unknown;
}

export interface AdminChapterListResponse {
  items?: AdminChapter[];
  chapters?: AdminChapter[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
}

export interface GroupsStatus {
  [key: string]: unknown;
}

export interface GroupsQuota {
  [key: string]: unknown;
}

export interface CacheStats {
  [key: string]: unknown;
}

export interface CoverStats {
  [key: string]: unknown;
}

export interface ThumbnailInfo {
  [key: string]: unknown;
}

export interface RemoteHealth {
  [key: string]: unknown;
}

export interface RemoteStats {
  [key: string]: unknown;
}

export interface CoverInfo {
  cover_url: string | null;
  cover_path: string | null;
  file_exists: boolean;
  file_size_kb: number | null;
  format: string | null;
  access_url: string | null;
  [key: string]: unknown;
}

export interface CoverListItem {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  has_cover: boolean;
  [key: string]: unknown;
}

export interface CoverListResponse {
  items: CoverListItem[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  total?: number;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<AdminStats> {
  return adminFetch(`${API_BASE_URL}/admin/stats`) as Promise<AdminStats>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENRES
// ─────────────────────────────────────────────────────────────────────────────

export async function adminCreateGenre(
  name: string,
  slug: string
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/genres?${new URLSearchParams({ name, slug })}`,
    { method: "POST" }
  );
}

export async function adminDeleteGenre(genreId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/genres/${genreId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MANGA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export async function adminCreateMangaType(
  name: string,
  slug: string
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga-types?${new URLSearchParams({ name, slug })}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  return adminFetch(`${API_BASE_URL}/admin/roles`) as Promise<AdminRole[]>;
}

export async function adminCreateRole(name: string): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/roles?${new URLSearchParams({ name })}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminUsers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}): Promise<AdminUsersResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.search) sp.set("search", params.search);
  if (params?.is_active !== undefined)
    sp.set("is_active", String(params.is_active));
  return adminFetch(
    `${API_BASE_URL}/admin/users?${sp}`
  ) as Promise<AdminUsersResponse>;
}

export async function adminUpdateUserRole(
  userId: number,
  roles: string[]
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}

export async function adminToggleUserStatus(
  userId: number,
  isActive: boolean
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function adminDeleteUser(userId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MANGA
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminMangaList(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  storage_id?: number;
}): Promise<AdminMangaListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.search) sp.set("search", params.search);
  if (params?.storage_id) sp.set("storage_id", String(params.storage_id));
  return adminFetch(
    `${API_BASE_URL}/admin/manga?${sp}`
  ) as Promise<AdminMangaListResponse>;
}

export async function fetchAdminMangaDetail(
  mangaId: number
): Promise<AdminManga> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}`
  ) as Promise<AdminManga>;
}

// POST /admin/manga — application/x-www-form-urlencoded
export async function adminCreateManga(data: {
  title: string;
  slug: string;
  description?: string;
  type_slug: string;
  storage_id: number;
  status_manga?: string;
  genre_slugs?: string[];
}): Promise<unknown> {
  const token = getToken();
  const body = new URLSearchParams();
  body.append("title", data.title);
  body.append("slug", data.slug);
  if (data.description) body.append("description", data.description);
  body.append("type_slug", data.type_slug);
  body.append("storage_id", String(data.storage_id));
  if (data.status_manga) body.append("status_manga", data.status_manga);
  if (data.genre_slugs) {
    data.genre_slugs.forEach((g) => body.append("genre_slugs", g));
  }

  const res = await fetch(`${API_BASE_URL}/admin/manga`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${token}`,
    },
    body: body.toString(),
  });

  if (res.status === 401 || res.status === 403)
    throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// PUT /admin/manga/{manga_id} — application/json
export async function adminUpdateManga(
  mangaId: number,
  body: {
    title?: string;
    slug?: string;
    description?: string;
    cover_image_path?: string;
    status?: string;
    type_slug?: string;
    storage_id?: number;
    genre_slugs?: string[];
  }
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/manga/${mangaId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function adminDeleteManga(
  mangaId: number,
  deleteGdrive = false
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}?delete_gdrive=${deleteGdrive}`,
    { method: "DELETE" }
  );
}

// PUT /admin/manga/{manga_id}/status
export async function adminToggleMangaStatus(
  mangaId: number,
  newStatus: string
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/status?new_status=${encodeURIComponent(newStatus)}`,
    { method: "PUT" }
  );
}

// POST /admin/manga/{manga_id}/cover — multipart/form-data
export async function adminUploadCover(
  mangaId: number,
  file: File,
  backupToGdrive = true
): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const fd = new FormData();
  fd.append("cover_file", file);

  const res = await fetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/cover?backup_to_gdrive=${backupToGdrive}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }
  );

  if (res.status === 401 || res.status === 403)
    throw new Error("Akses ditolak. Pastikan kamu sudah login sebagai admin.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Upload cover gagal");
  }
  return res.json();
}

// DELETE /admin/manga/{manga_id}/cover
export async function adminDeleteCover(
  mangaId: number,
  deleteGdrive = true
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/cover?delete_gdrive=${deleteGdrive}`,
    { method: "DELETE" }
  );
}

// GET /admin/manga/{manga_id}/cover/info
export async function fetchCoverInfo(mangaId: number): Promise<CoverInfo> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaId}/cover/info`
  ) as Promise<CoverInfo>;
}

// POST /admin/covers/sync-from-gdrive
export async function adminSyncCoversFromGdrive(): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/covers/sync-from-gdrive`, {
    method: "POST",
  });
}

// GET /admin/covers/stats
export async function fetchCoverStats(): Promise<CoverStats> {
  return adminFetch(
    `${API_BASE_URL}/admin/covers/stats`
  ) as Promise<CoverStats>;
}

// GET /admin/covers/list
export async function fetchCoverList(params?: {
  page?: number;
  page_size?: number;
  has_cover?: boolean;
}): Promise<CoverListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.has_cover !== undefined)
    sp.set("has_cover", String(params.has_cover));
  return adminFetch(
    `${API_BASE_URL}/admin/covers/list?${sp}`
  ) as Promise<CoverListResponse>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTERS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAdminChapters(params?: {
  manga_id?: number;
  manga_slug?: string;
  page?: number;
  page_size?: number;
}): Promise<AdminChapterListResponse> {
  const sp = new URLSearchParams();
  if (params?.manga_id) sp.set("manga_id", String(params.manga_id));
  if (params?.manga_slug) sp.set("manga_slug", params.manga_slug);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return adminFetch(
    `${API_BASE_URL}/admin/chapters?${sp}`
  ) as Promise<AdminChapterListResponse>;
}

// PUT /admin/chapter/{chapter_id}
export async function adminUpdateChapter(
  chapterId: number,
  body: {
    chapter_main?: number;
    chapter_sub?: number;
    chapter_label?: string;
    slug?: string;
    chapter_folder_name?: string;
    volume_number?: number;
    chapter_type?: string;
    anchor_path?: string;
    preview_url?: string;
  }
): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/chapter/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// DELETE /admin/chapter/{chapter_id}
export async function adminDeleteChapter(
  chapterId: number,
  deleteGdrive = false
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}?delete_gdrive=${deleteGdrive}`,
    { method: "DELETE" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER THUMBNAILS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/chapter/{chapter_id}/thumbnail/info
export async function fetchThumbnailInfo(
  chapterId: number
): Promise<ThumbnailInfo> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail/info`
  ) as Promise<ThumbnailInfo>;
}

// POST /admin/chapter/{chapter_id}/thumbnail/upload — multipart/form-data
export async function adminUploadThumbnail(
  chapterId: number,
  file: File
): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("Akses ditolak.");
  const fd = new FormData();
  fd.append("thumbnail", file);

  const res = await fetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }
  );

  if (res.status === 401 || res.status === 403)
    throw new Error("Akses ditolak.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Upload thumbnail gagal");
  }
  return res.json();
}

// POST /admin/chapter/{chapter_id}/thumbnail/generate
export async function adminGenerateThumbnail(
  chapterId: number,
  sourcePage = 1
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail/generate?source_page=${sourcePage}`,
    { method: "POST" }
  );
}

// POST /admin/manga/{manga_slug}/thumbnails/generate-all
export async function adminBulkGenerateThumbnails(
  mangaSlug: string,
  sourcePage = 1
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/manga/${mangaSlug}/thumbnails/generate-all?source_page=${sourcePage}`,
    { method: "POST" }
  );
}

// DELETE /admin/chapter/{chapter_id}/thumbnail
export async function adminDeleteThumbnail(
  chapterId: number
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/chapter/${chapterId}/thumbnail`,
    { method: "DELETE" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE SOURCES
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/storage
export async function fetchAdminStorage(): Promise<StorageSource[]> {
  return adminFetch(`${API_BASE_URL}/admin/storage`) as Promise<StorageSource[]>;
}

// POST /admin/storage/{storage_id}/test
export async function adminTestStorage(storageId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/storage/${storageId}/test`, {
    method: "POST",
  });
}

// PUT /admin/storage/{storage_id}/status
export async function adminToggleStorageStatus(
  storageId: number,
  newStatus: "active" | "suspended"
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/storage/${storageId}/status?new_status=${newStatus}`,
    { method: "PUT" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE GROUPS
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/groups/status
export async function fetchGroupsStatus(): Promise<GroupsStatus> {
  return adminFetch(
    `${API_BASE_URL}/admin/groups/status`
  ) as Promise<GroupsStatus>;
}

// GET /admin/groups/quota
export async function fetchGroupsQuota(): Promise<GroupsQuota> {
  return adminFetch(
    `${API_BASE_URL}/admin/groups/quota`
  ) as Promise<GroupsQuota>;
}

// POST /admin/groups/switch
export async function adminSwitchGroup(
  targetGroup: 1 | 2
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/groups/switch?target_group=${targetGroup}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/cache/stats
export async function fetchCacheStats(): Promise<CacheStats> {
  return adminFetch(
    `${API_BASE_URL}/admin/cache/stats`
  ) as Promise<CacheStats>;
}

// POST /admin/cache/cleanup
export async function adminCacheCleanup(): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/cache/cleanup`, {
    method: "POST",
  });
}

// DELETE /admin/cache/chapter/{chapter_id}
export async function adminClearChapterCache(
  chapterId: number
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/cache/chapter/${chapterId}`,
    { method: "DELETE" }
  );
}

// DELETE /admin/cache/manga/{manga_id}
export async function adminClearMangaCache(mangaId: number): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/cache/manga/${mangaId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/remotes/health
export async function fetchRemotesHealth(): Promise<RemoteHealth> {
  return adminFetch(
    `${API_BASE_URL}/admin/remotes/health`
  ) as Promise<RemoteHealth>;
}

// GET /admin/remotes/stats
export async function fetchRemotesStats(): Promise<RemoteStats> {
  return adminFetch(
    `${API_BASE_URL}/admin/remotes/stats`
  ) as Promise<RemoteStats>;
}

// GET /admin/remotes/best
export async function fetchBestRemote(group: 1 | 2 = 1): Promise<unknown> {
  return adminFetch(`${API_BASE_URL}/admin/remotes/best?group=${group}`);
}

// POST /admin/remotes/{remote_name}/reset
export async function adminResetRemoteHealth(
  remoteName: string,
  group: 1 | 2 = 1
): Promise<unknown> {
  return adminFetch(
    `${API_BASE_URL}/admin/remotes/${encodeURIComponent(remoteName)}/reset?group=${group}`,
    { method: "POST" }
  );
}